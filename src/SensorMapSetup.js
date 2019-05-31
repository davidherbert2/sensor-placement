/**
 * @module SensorMapSetup
 */

import {fromLonLat} from "ol/proj";
import {bbox as bboxStrategy} from "ol/loadingstrategy";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import GeoJSON from "ol/format/GeoJSON"; 
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

import InteractiveVectorLayer from "./InteractiveVectorLayer.js";

/**
 * Map projection (Google Spherical Mercator EPSG:3857)
 */
const MAP_PROJECTION = "EPSG:3857";

/**
 * Address of Amazon AWS instance and proxy to circumvent CORS for the UO API
 */
const AWS_INSTANCE = "http://ec2-18-209-223-88.compute-1.amazonaws.com:8080";
const PROXY = `${AWS_INSTANCE}/sensor-placement/cgi-bin/uo_wrapper.py`;
 
/**
 * Urban Observatory API endpoint
 */
export const UO_API = `${PROXY}?url=http://uoweb3.ncl.ac.uk/api/v1.1`;
export const UO_THEMES = `${UO_API}/themes/json/`;
export const UO_SENSOR_TYPES = `${UO_API}/sensors/types/json/`;
export const UO_SENSOR_DATA = `${UO_API}/sensors/json/`;

/**
 * Lon/lat of USB
 */
export const NEWCASTLE_CENTROID = [-1.6253, 54.9736];

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
 * Hex to rgba - https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
 * @param {string} hex - RGB triplet 
 * @param {float} [opacity=1.0] - desired opacity 
 */
const HEX2RGBA = (hex, alpha = 1) => {
	const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
	return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Return a GeoJSON source pointing to the given typename
 * @param {string} feature - the name of the data layer, namespaced if necessary
 * @return {Object}
 */
const GEOJSON_SOURCE = (feature) => {
	return({ /* Source options */
		format: new GeoJSON(),
		url: (extent) => {
			return(`
				${AWS_INSTANCE}/geoserver/siss/wfs?service=WFS&
				version=2.0.0&request=GetFeature&typename=${feature}&
				outputFormat=application/json&srsname=${MAP_PROJECTION}&bbox=
				` 
				+ extent.join(",") + `,${MAP_PROJECTION}`
			);
		},
		strategy: bboxStrategy,
		overlaps: false,
		wrapX: false		
	});
};

/**
 * Individual layer definitions
 * OpenStreetMap layer
 */
export const OPENSTREETMAP = () => {
	return(new TileLayer({
		title: "OpenStreetMap",
		type: "base",
		visible: true,
		source: new OSM()
	}));
};

/**
 * LA layer
 */
export const LA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Local Authority areas", 
			type: "overlay", 
			cluster: false,
			extent: NEWCASTLE_CENTRE_3857,
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: HEX2RGBA("#bc4b51", 0.0)}),
					stroke: new Stroke({color: HEX2RGBA("#bc4b51"), width: 2})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_la")
	));
};

/**
 * LSOA layer
 */
export const LSOA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "LSOAs", 
			type: "overlay", 
			cluster: false,
			visible: false,
			extent: NEWCASTLE_CENTRE_3857,
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: HEX2RGBA("#89608e", 0.0)}),
					stroke: new Stroke({color: HEX2RGBA("#89608e"), width: 1})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_lsoa")
	));
	// { /* Hover options */
	// 	style: (feature) => {
	// 		return(new Style({
	// 			stroke: new Stroke({color: "rgba(192, 159, 128, 1)", width: 0.2}),
	// 			fill: new Fill({color: "rgba(192, 159, 128, 0.4)"}),
	// 			text: new Text({
	// 				font: "12px DejaVu Sans",
	// 				text: feature.get("lsoa11nm"),
	// 				overflow: true,
	// 				stroke: new Stroke({color: "rgba(118, 50, 63, 1)"}),
	// 				fill: new Fill({color: "rgba(118, 50, 63, 1)"})
	// 			})
	// 		}));
	// 	}
	// }));
};

/**
 * OA layer
 */
export const OA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "OAs", 
			type: "overlay", 
			cluster: false,
			visible: false,
			extent: NEWCASTLE_CENTRE_3857,
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: HEX2RGBA("#f4a259", 0.0)}),
					stroke: new Stroke({color: HEX2RGBA("#f4a259"), width: 0.5})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_oa")
	));
};

/**
 * Sensor layer
 */
export const SENSORS = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Sensor locations",
			type: "overlay",
			cluster: true,
			visible: true,		
			style: (feature) => {
				let	clusterFeats = feature.get("features");
				let size = clusterFeats ? clusterFeats.length : 1;
				let style = new Style({
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
			nameattr: "Sensor Name"			
		}));
};