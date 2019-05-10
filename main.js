import Feature from "ol/Feature";
import {fromLonLat} from "ol/proj";
import Point from "ol/geom/Point";

import DropDownListFromUrl from "./src/DropDownListFromUrl.js";		
import FeatureClusterPopover from "./src/FeatureClusterPopover.js";
import * as conf from "./src/SensorMapSetup.js";

window.onload = (event) => {	

	let layers = {
		"base": conf.OSM_LAYER(),
		"sensor": conf.SENSOR_LAYER()		
	};
	let map = conf.MAP(Object.values(layers));
	let popup = new FeatureClusterPopover("body", conf.SENSOR_ATTR_ORDERING, conf.SENSOR_ATTR_NAMES, "Sensor Name");
	
	map.addOverlay(popup.overlay);
	map.on("singleclick", evt => {
		let hits = map.getFeaturesAtPixel(evt.pixel);
		if (hits != null) {
			popup.show(evt.coordinate, hits[0]);	
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
		let source = layers["sensor"].getSource().getSource();
		Object.assign(sensorArgs, conf.NEWCASTLE_CENTRE);
		sensorInfo = sensorInfo + "?" + Object.keys(sensorArgs).map(key => key + "=" + sensorArgs[key]).join("&");
		fetch("http://localhost:8000/cgi-bin/uo_wrapper.py?url=" + encodeURIComponent(sensorInfo))
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