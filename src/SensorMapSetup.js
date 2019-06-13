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
import TileWMS from "ol/source/TileWMS"
import Cluster from "ol/source/Cluster";

import InteractiveVectorLayer from "./InteractiveVectorLayer.js";

/**
 * Map projection (Google Spherical Mercator EPSG:3857)
 */
const MAP_PROJECTION = "EPSG:3857";

/**
 * Address of Amazon AWS instance and proxy to circumvent CORS for the UO API
 */
const AWS_INSTANCE = "ec2-54-236-44-71.compute-1.amazonaws.com:8080";
const PROXY = `${AWS_INSTANCE}/sensor-placement/cgi-bin/uo_wrapper.py`;

/**
 *  Geoserver params 
 */
const GEOSERVER_ENDPOINT = `${AWS_INSTANCE}/geoserver`;
const GEOSERVER_WORKSPACE = "siss";
const GEOSERVER_PG_STORE = "pg_store";
const GEOSERVER_WMS = `${GEOSERVER_ENDPOINT}/${GEOSERVER_WORKSPACE}/wms`				
const GEOSERVER_WFS = `${GEOSERVER_ENDPOINT}/${GEOSERVER_WORKSPACE}/wfs?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&srsname=${MAP_PROJECTION}`
const GEOSERVER_REST = `${GEOSERVER_ENDPOINT}/rest/workspaces/${GEOSERVER_WORKSPACE}/datastores/${GEOSERVER_PG_STORE}`
 
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
 * Return a function to resize the map according to the extent of the supplied layer
 * @param {ol.Map} map 
 * @param {ol.Layer} layer 
 */
export const MAP_SIZING_FACTORY = (map, layer) => {
	let source = layer.getSource();
	let featureType = null;
	if (source instanceof TileWMS) {
		/* Tile WMS layer */
		featureType = source.getParams()["layers"];
	} else {
		if (source instanceof Cluster) {
			/* Cluster layer */
			source = source.getSource();
		} 
		/* Vectors here */
		let url = source.getUrl();
		if (url) {
			let qry = new URLSearchParams(url.substring(url.indexOf("?") + 1));
			featureType = qry.get("typename");		
		}		
	}
	return((evt) => {
		if (featureType) {
			/* Call Geoserver REST API to get layer extent */
			let nonNsFeatureType = featureType.split(":").pop();
			fetch(`${GEOSERVER_REST}/featuretypes/${nonNsFeatureType}.json`)
			.then(r => r.json())
			.then(jsonResponse => {
				let nbbox = jsonResponse["featureType"]["latLonBoundingBox"];
				let extent = NEWCASTLE_CENTRE_3857;
				if (nbbox) {
					/* Reproject the bounding box from lat/lon to Speherical Mercator */
					extent = [fromLonLat([nbbox.minx, nbbox.miny]), fromLonLat([nbbox.maxx, nbbox.maxy])].flat();
				}
				return(map.getView().fit(extent, {
					size: map.getSize(),
					nearest: true,
					padding: [20, 20, 20, 20]
				}));
			})
			.catch(error => {
				console.log(error);
				alert("Failed to get metadata for layer");
			});		
		} else if (source && source instanceof VectorSource) {
			/* Extent from features if possible */
			return(map.getView().fit(source.getExtent(), {
				size: map.getSize(),
				nearest: true,
				padding: [20, 20, 20, 20]
			}));
		}
	});
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
			return(`${GEOSERVER_WFS}&typename=${feature}&bbox=` + extent.join(",") + `,${MAP_PROJECTION}`);
		},
		strategy: bboxStrategy,
		overlaps: false,
		wrapX: false		
	});
};

const HOVER_OPTIONS = (col, opacity = 0.4, nameAttr = "name") => {
	return({ /* Hover options */
		style: (feature) => {
			return(new Style({
				stroke: new Stroke({color: HEX2RGBA(col, opacity)}),
				fill: new Fill({color: HEX2RGBA(col, opacity)}),
				text: new Text({
					font: "12px DejaVu Sans",
					text: feature.get(nameAttr),
					overflow: true,
					stroke: new Stroke({color: HEX2RGBA(col, 1.0)}),
					fill: new Fill({color: HEX2RGBA(col, 1.0)})
				})
			}));
		}
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
		baseLayer: true,
		displayInLayerSwitcher: true,
		layerExtent: false,
		layerInfo: true,
		source: new OSM()
	}));
};

/**
 * LA layer
 */
const LA_COL = "#7a4419"
export const LA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Local Authority areas", 
			type: "overlay", 
			cluster: false,
			visible: true,
			minResolution: 10,
			extent: NEWCASTLE_CENTRE_3857,
			displayInLayerSwitcher: true,
			layerExtent: false,
			layerInfo: true,
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: HEX2RGBA(LA_COL, 0.0)}),
					stroke: new Stroke({color: HEX2RGBA(LA_COL, 0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_la"),
		HOVER_OPTIONS(LA_COL, 0.4)
	));
};

/**
 * LSOA layer
 */
const LSOA_COL = "#63535b"
export const LSOA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "LSOAs", 
			type: "overlay", 
			cluster: false,
			visible: true,
			minResolution: 2,
			maxResolution: 20,
			extent: NEWCASTLE_CENTRE_3857,
			displayInLayerSwitcher: true,
			layerExtent: false,
			layerInfo: true,
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: HEX2RGBA(LSOA_COL, 0.0)}),
					stroke: new Stroke({color: HEX2RGBA(LSOA_COL, 0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_lsoa"),
		HOVER_OPTIONS(LSOA_COL)
	));
};

/**
 * OA layer
 */
const OA_COL = "#400406"
export const OA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "OAs", 
			type: "overlay", 
			cluster: false,
			visible: true,
			maxResolution: 10,
			extent: NEWCASTLE_CENTRE_3857,
			displayInLayerSwitcher: true,
			layerExtent: false,
			layerInfo: true,
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: HEX2RGBA(OA_COL, 0.0)}),
					stroke: new Stroke({color: HEX2RGBA(OA_COL, 0,0)})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_oa"),
		HOVER_OPTIONS(OA_COL, 0.4, "code")
	));
};

/**
 * IMD layer
 */
export const IMD = () => {
	return(new TileLayer({
		title: "Index of Multiple Deprivation",
		visible: false,
		displayInLayerSwitcher: true,
		layerExtent: true,
		layerInfo: true,
		opacity: 0.6,
		source: new TileWMS({
			url: GEOSERVER_WMS,
			params: {
				layers: "siss:imd_2015_by_lsoa",
				serverType: "geoserver",
				wrapX: false
			}
		})
	}));
};

/**
 * Disability layer
 */
export const DISABILITY = () => {
	return(new TileLayer({
		title: "Day-to-day disability limited (%)",
		visible: false,
		displayInLayerSwitcher: true,
		layerExtent: true,
		layerInfo: true,
		opacity: 0.6,
		source: new TileWMS({
			url: GEOSERVER_WMS,
			params: {
				layers: "siss:disability_2015_by_lsoa",
				serverType: "geoserver",
				wrapX: false
			}
		})
	}));
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
			displayInLayerSwitcher: true,
			layerExtent: true,
			layerInfo: true,
			style: (feature) => {
				let	clusterFeats = feature.get("features");
				let size = clusterFeats ? clusterFeats.length : 1;
				let style = new Style({
					image: new CircleStyle({
						radius: 7,
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