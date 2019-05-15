import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {fromLonLat} from "ol/proj";
import Point from "ol/geom/Point";

import DropDownListFromUrl from "./src/DropDownListFromUrl.js";		
import FeatureClusterPopover from "./src/FeatureClusterPopover.js";
import * as conf from "./src/SensorMapSetup.js";

window.onload = (event) => {
	
	let getLayerByTitle = (title) => {
		return(map.getLayers().getArray().find(lyr => lyr.get("title") === title));
	};

	/** 
	 * Layer group and switcher 
	 */
	let layers [
		new ol.layer.Group({
			"title": "Base maps",
			"fold": "open",
			"layers": [
				conf.OSM_LAYER()
			]
		}),
		new ol.layer.Group({
			"title": "Office of National Statistics",
			"fold": "open",
			"layers": [
				conf.LSOA_LAYER()
			]
		}),
		//new ol.layer.Group({
		//	"title": "Newcastle City Council",
		//	"fold": "open",
		//	"layers": [
		//		conf.LSOA_LAYER()
		//	]
		//}),
		new ol.layer.Group({
			"title": "Urban Observatory",
			"fold": "open",
			"layers": [
				conf.SENSOR_LAYER()
			]
		})
	];

	let layers = {
		"base": ,		
		"lsoa": conf.LSOA_LAYER(),
		"sensor": conf.SENSOR_LAYER()
	};
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
		let hits = map.getFeaturesAtPixel(evt.pixel, layerCandidate => {
			return(layerCandidate == getLayerByTitle("Sensor locations"));
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
		let features = map.getFeaturesAtPixel(pixel, layerCandidate => {
			return(layerCandidate == getLayerByTitle("LSOAs"));
		});
		let feature = features.length == 0 ? null : features[0];
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
		let source = getLayerByTitle("Sensor locations").getSource().getSource();
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
