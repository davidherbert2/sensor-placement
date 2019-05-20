/**
 * @module SensorMapSetup
 */

import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import {fromLonLat} from "ol/proj";
import {bbox as bboxStrategy} from "ol/loadingstrategy";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import GeoJSON from "ol/format/GeoJSON"; 
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import MousePosition from "ol/control/MousePosition";
import Zoom from "ol/control/Zoom";

import InteractiveVectorLayer from "./src/InteractiveVectorLayer.js";
 
/**
 * Urban Observatory API endpoint
 */
export const UO_API = "http://uoweb3.ncl.ac.uk/api/v1.1";
export const UO_THEMES = `${UO_API}/themes/json/`;
export const UO_SENSOR_TYPES = `${UO_API}/sensors/types/json/`;
export const UO_SENSOR_DATA = `${UO_API}/sensors/json/`;

/**
 * Bounding box of interest for sensor map in WGS 84
 */
export const NEWCASTLE_CENTRE = {
	"bbox_p1_x": -1.7353,
	"bbox_p1_y": 54.9484,
	"bbox_p2_x": -1.4298,
	"bbox_p2_y": 55.0563
};

/**
 * Bounding box of interest for sensor map in EPSG:3857
 */
const NEWCASTLE_CENTRE_3857 = 
	fromLonLat([NEWCASTLE_CENTRE["bbox_p1_x"], NEWCASTLE_CENTRE["bbox_p1_y"]]).concat(
	fromLonLat([NEWCASTLE_CENTRE["bbox_p2_x"], NEWCASTLE_CENTRE["bbox_p2_y"]]));

/**
 * Lon/lat of USB
 */
export const NEWCASTLE_CENTROID = [-1.6253, 54.9736];

/**
 * Individual layer definitions
 * OpenStreetMap layer
 */
export const OPENSTREETMAP = new TileLayer({
	title: "OpenStreetMap",
	type: "base",
	visible: true,
	source: new OSM()
});

/**
 * LSOA layer
 */
export const LSOA = new InteractiveVectorLayer(
	{ /* Layer options */
		title: "LSOAs", 
		type: "overlay", 
		cluster: false,
		extent: NEWCASTLE_CENTRE_3857,
		style: (feature) => {
			return(new Style({
				fill: new Fill({color: "rgba(215, 206, 199, 0.0)"}),
				stroke: new Stroke({color: "rgba(118, 50, 63, 1)", width: 1})		
			}));
		}
	},
	{ /* Source options */
		format: new GeoJSON(),
		url: (extent) => {
			return(`
				http://ec2-52-207-74-207.compute-1.amazonaws.com:8080/geoserver/data_dot_gov/wfs?service=WFS&
				version=2.0.0&request=GetFeature&typename=data_dot_gov:lsoa&
				outputFormat=application/json&srsname=EPSG:3857&bbox=
				` 
				+ extent.join(",") + ",EPSG:3857");
		},
		strategy: bboxStrategy		
	},
	{ /* Hover options */
		style: (feature) => {
			return(new Style({
				stroke: new Stroke({color: "rgba(192, 159, 128, 1)", width: 1}),
				fill: new Fill({color: "rgba(192, 159, 128, 0.4)"}),
				text: new Text({
					font: "12px consolas",
					text: feature.get("lsoa11nm"),
					overflow: true,
					stroke: new Stroke({color: "rgba(118, 50, 63, 1)"}),
					fill: new Fill({color: "rgba(118, 50, 63, 1)"})
				})
			}));
		}
	}
);

/**
 * Sensor layer
 */
export const SENSORS = new InteractiveVectorLayer(
	{
		title: "Sensor locations",
		type: "overlay",
		cluster: true,
		visible: true,		
		style: (feature) => {
			let	clusterFeats = feature.get("features");
			let size = clusterFeats ? clusterFeats.length : 1;
			style = new Style({
				image: new CircleStyle({
					radius: 5,
					fill: new Fill({color: "white"}),
					stroke: new Stroke({color: "red", width: 2})
				})
			});
			if (size > 1) {
				style.setText(new Text({
					text: size.toString(),
					fill: new Fill({color: "#ff0000"})
				}));
			}
			return(style);
		}
	},
	{}, {},
	{
		ordering: ["Name", "Latitude", "Longitude", "Elevation", "Height", "Broker", "Third party"],
		translation: {
			"Broker": "Broker Name", 
			"Elevation": "Ground Height Above Sea Level",
			"Latitude": "Sensor Centroid Latitude", 
			"Longitude": "Sensor Centroid Longitude", 
			"Height": "Sensor Height Above Ground",
			"Name": "Sensor Name",
			"Third party": "Third Party"
		},
		nameattr: "Name"			
	}
);

export const LAYERS = [
		new LayerGroup({
			"title": "Base maps",
			"fold": "open",
			"layers": [OPENSTREETMAP]
		}),
		new LayerGroup({
			"title": "Office of National Statistics",
			"fold": "open",
			"layers": [LSOA]
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
			"layers": [SENSORS]
		})
	];

/**
 * OL map
 */
export const MAP = new Map({
	target: "map",
	layers: LAYERS, 
	view: new View({
		center: fromLonLat(NEWCASTLE_CENTROID),
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