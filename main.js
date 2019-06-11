import Map from "ol/Map";
import View from "ol/View";
import LayerGroup from "ol/layer/Group";
import Feature from "ol/Feature";
import {fromLonLat} from "ol/proj";
import Point from "ol/geom/Point";
import MousePosition from "ol/control/MousePosition";
import Zoom from "ol/control/Zoom";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";

import DropDownListFromUrl from "./src/DropDownListFromUrl.js";		
import * as conf from "./src/SensorMapSetup.js";

window.onload = (event) => {

	/** 
	 * List of tips for internationalisation purposes
	 */
	LayerSwitcher.prototype.tip = {
		up: "Re-order layers in stack",
		down: "Re-order layers in stack",
		info: "Layer legend and metadata",
		extent: "Zoom to layer extent",
		trash: "Remove layer",
		plus: "Open/close group"
	};
	
	/**
	 * Layer creation 
	 */
	let osmLayer    	= conf.OPENSTREETMAP();
	let sensorLayer 	= conf.SENSORS();
	let laLayer    	 	= conf.LA();
	let lsoaLayer  		= conf.LSOA();
	let oaLayer    	 	= conf.OA();
	let imdLayer    	= conf.IMD();
	let disabilityLayer = conf.DISABILITY();

	/**
	 * Create the map and layer tree
	 */
	let map = new Map({
		target: "map",
		layers: [
			new LayerGroup({
				"title": "Base maps",
				"openInLayerSwitcher": false,
				"layers": [osmLayer]
			}),			
			new LayerGroup({
				"title": "Office of National Statistics",
				"openInLayerSwitcher": true,
				"layers": [imdLayer, disabilityLayer]
			}),
			new LayerGroup({
				"title": "Boundaries",
				"openInLayerSwitcher": false,
				"layers": [laLayer, lsoaLayer, oaLayer]
			}),
			new LayerGroup({
				"title": "Urban Observatory",
				"openInLayerSwitcher": true,
				"layers": [sensorLayer]
			})			
		],
		view: new View({
			center: fromLonLat(conf.NEWCASTLE_CENTROID),
			zoom: 14
		}),
		controls: [
			new MousePosition({
				projection: "EPSG:4326",
				coordinateFormat: (coord) => {
					return(`<strong>${coord[0].toFixed(4)},${coord[1].toFixed(4)}</strong>`);
				}
			}),
			new Zoom()
		]
	});	

	/**
	 * Layer switcher 
	 */
	let switcher = new LayerSwitcher({
		show_progress: false,
		mouseover: false  	/* Show on mouseover */
	});

	switcher.on("drawlist", (evt) => {		
		let btnDiv = evt.li.querySelector(".ol-layerswitcher-buttons");
		if (evt.layer.get("layerExtent") === true) {
			let newBtn = document.createElement("div");
			newBtn.setAttribute("title", switcher.tip.extent);
			newBtn.classList.add("layerExtent");
			btnDiv.appendChild(newBtn); 
			let layer = evt.layer;
			newBtn.addEventListener("click", conf.MAP_SIZING_FACTORY(map, layer.getExtent()));
		}
		if (evt.layer.get("layerInfo") === true) {
			let newBtn = document.createElement("div");
			newBtn.setAttribute("title", switcher.tip.info);
			newBtn.classList.add("layerInfo");
			btnDiv.appendChild(newBtn); 
		}
	});

	map.addControl(switcher);
	
	/**
	 * Assign click/hover handlers for layers 
	 */
	sensorLayer.assignHandlers(map);
	laLayer.assignHandlers(map);
	lsoaLayer.assignHandlers(map);
	oaLayer.assignHandlers(map);

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
		sensorLayer.popup.hide();
	});
	
	ddVariables.dd.addEventListener("change", evt => {
		sensorLayer.popup.hide();
		let sensorInfo = conf.UO_SENSOR_DATA;
		let sensorArgs = {
			"theme": ddThemes.value,
			"sensor_type": ddVariables.value
		};
		/* Two levels of source - first one is a cluster */
		let source = sensorLayer.getSource().getSource();
		Object.assign(sensorArgs, conf.NEWCASTLE_CENTRE);
		sensorInfo = sensorInfo + "?" + Object.keys(sensorArgs).map(key => key + "=" + sensorArgs[key]).join("&");
		fetch(sensorInfo)
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
