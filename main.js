import Feature from "ol/Feature";
import LayerGroup from "ol/layer/Group";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {fromLonLat} from "ol/proj";
import Point from "ol/geom/Point";

import DropDownListFromUrl from "./src/DropDownListFromUrl.js";		
import FeatureClusterPopover from "./src/FeatureClusterPopover.js";
import * as conf from "./src/SensorMapSetup.js";

window.onload = (event) => {
	
	/**
	 * Layer group and switcher 
	 */
	let osmLayer = conf.OSM_LAYER();
	let lsoaLayer = conf.LSOA_LAYER();
	let sensorLayer = conf.SENSOR_LAYER();
	let layers = [
		new LayerGroup({
			"title": "Base maps",
			"fold": "open",
			"layers": [
				osmLayer
			]
		}),
		new LayerGroup({
			"title": "Office of National Statistics",
			"fold": "open",
			"layers": [
				lsoaLayer
			]
		}),
		//new ol.layer.Group({
		//	"title": "Newcastle City Council",
		//	"fold": "open",
		//	"layers": [
		//		conf.LSOA_LAYER()
		//	]
		//}),
		new LayerGroup({
			"title": "Urban Observatory",
			"fold": "open",
			"layers": [
				sensorLayer
			]
		})
	];
	
	let map = conf.MAP(Object.values(layers));
	let popup = new FeatureClusterPopover("body", conf.SENSOR_ATTR_ORDERING, conf.SENSOR_ATTR_NAMES, "Sensor Name");
	
	let highlight = null;
	let featureOverlays = {
		"LSOAs": new VectorLayer({
			source: new VectorSource(),
			map: map,
			style: conf.LSOA_HIGHLIGHT_STYLE
		})
	};
	
	map.addOverlay(popup.overlay);
	map.on("singleclick", evt => {
		let hits = map.getFeaturesAtPixel(evt.pixel, {
			layerFilter: layerCandidate => {
				return(layerCandidate == sensorLayer);
			}
		});
		if (hits && hits.length > 0) {
			popup.show(evt.coordinate, hits[0]);	
		}
	});
	map.on("pointermove", evt => {
		if (evt.dragging) {
          return;
        }
        let pixel = map.getEventPixel(evt.originalEvent);
		let features = map.getFeaturesAtPixel(pixel, {
			layerFilter: layerCandidate => {
				return(layerCandidate == lsoaLayer);
			}
		});
		let feature = (features && features.length == 0) ? null : features[0];
		if (feature && feature !== highlight) {
			if (highlight) {
				featureOverlays["LSOAs"].getSource().removeFeature(highlight);
			}
			featureOverlays["LSOAs"].getSource().addFeature(feature);
			highlight = feature;
		}
	});
	
	let form = document.querySelector("form");
	
	let ddThemes = new DropDownListFromUrl(form, conf.UO_THEMES, "theme-list", ["theme-list"], "Select a theme", true);
	let ddVariables = new DropDownListFromUrl(form, conf.UO_SENSOR_TYPES, "variable-list", ["variable-list"], "Select a variable", true);
	ddVariables.hide();
	
	ddThemes.populate({}, "Themes");
	ddThemes.dd.addEventListener("change", evt => {
		let newTheme = evt.currentTarget.value;
		ddVariables.show();
		ddVariables.populate({
			theme: newTheme
		}, "Variables");
		popup.hide();
	});
	
	ddVariables.dd.addEventListener("change", evt => {
		popup.hide();
		let sensorInfo = conf.UO_SENSOR_DATA;
		let sensorArgs = {
			"theme": ddThemes.value,
			"sensor_type": ddVariables.value
		};
		/* Two levels of source - first one is a cluster */
		let source = sensorLayer.getSource().getSource();
		Object.assign(sensorArgs, conf.NEWCASTLE_CENTRE);
		sensorInfo = sensorInfo + "?" + Object.keys(sensorArgs).map(key => key + "=" + sensorArgs[key]).join("&");
		fetch("http://ec2-52-207-74-207.compute-1.amazonaws.com:8080/sensor_placement/cgi-bin/uo_wrapper.py?url=" + encodeURIComponent(sensorInfo))
			.then(r => r.json())
			.then(jsonResponse => {
				source.clear();
				let features = jsonResponse.sensors.map(sensor => {
					Object.assign(sensor, {
						geometry: new Point(fromLonLat([
							sensor["Sensor Centroid Longitude"], 
							sensor["Sensor Centroid Latitude"]
						]))
					});
					return(new Feature(sensor));
				});
				source.addFeatures(features);
			})
			.catch(error => {
				console.log(error);
				alert("No suitable sensors found");
			});					
	});			
	
}
