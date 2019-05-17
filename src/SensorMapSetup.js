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
 
/**
 * Urban Observatory API endpoint
 */
export const UO_API = "http://uoweb3.ncl.ac.uk/api/v1.1";
export const UO_THEMES = `${UO_API}/themes/json/`;
export const UO_SENSOR_TYPES = `${UO_API}/sensors/types/json/`;
export const UO_SENSOR_DATA = `${UO_API}/sensors/json/`;

 /**
  * Mapping of human-friendly attribute names for display (keys) to actual attribute names in data (values)
  */
export const SENSOR_ATTR_NAMES = {
	"Broker": "Broker Name", 
	"Elevation": "Ground Height Above Sea Level",
	"Latitude": "Sensor Centroid Latitude", 
	"Longitude": "Sensor Centroid Longitude", 
	"Height": "Sensor Height Above Ground",
	"Name": "Sensor Name",
	"Third party": "Third Party"
};

/**
 * Ordering for display of attributes within table
 */
export const SENSOR_ATTR_ORDERING = ["Name", "Latitude", "Longitude", "Elevation", "Height", "Broker", "Third party"];

/**
 * Bounding box of interest for sensor map, and centroid thereof
 */
export const NEWCASTLE_CENTRE = {
	"bbox_p1_x": -1.7353,
	"bbox_p1_y": 54.9484,
	"bbox_p2_x": -1.4298,
	"bbox_p2_y": 55.0563
};

const NEWCASTLE_CENTRE_3857 = fromLonLat([NEWCASTLE_CENTRE["bbox_p1_x"], NEWCASTLE_CENTRE["bbox_p1_y"]]).concat(
	fromLonLat([NEWCASTLE_CENTRE["bbox_p2_x"], NEWCASTLE_CENTRE["bbox_p2_y"]]));

/**
 * Lon/lat of USB
 */
export const NEWCASTLE_CENTROID = [
	-1.6253,
	54.9736
];

/**
 * Symbology for display of sensors on map 
 */
const SENSOR_SYMBOLOGY = new CircleStyle({
	radius: 5,
	fill: new Fill({
		color: "white"
	}),
	stroke: new Stroke({
		color: "red", 
		width: 2
	})
});

/**
 * Cache of styles to avoid regenerating each time 
 */
const SENSOR_SYMBOLOGY_CACHE = {};

/**
 * Styling function 
 */
const SENSOR_STYLE_FUNCTION = (feature) => {
	let	clusterFeats = feature.get("features");
	let size = clusterFeats ? clusterFeats.length : 1;
	let style = SENSOR_SYMBOLOGY_CACHE[size];
	if (!style) {
		if (size == 1) {
			style = new Style({
				image: SENSOR_SYMBOLOGY
			});
		} else {
			style = new Style({
				image: SENSOR_SYMBOLOGY, 
				text: new Text({
					text: size.toString(),
					fill: new Fill({
						color: "#ff0000"
					})
				})
			});
		}
		SENSOR_SYMBOLOGY_CACHE[size] = style;
	}
	return(style);
};

/**
 * OpenStreetMap layer
 */
export const OSM_LAYER = () => {
	return(new TileLayer({
		title: "OpenStreetMap",
		type: "base",
		visible: true,
		source: new OSM()
	}));
};
		
/**
 * OL vector layer to add sensor features
 */	
export const SENSOR_LAYER = () => {
	return(new VectorLayer({
		title: "Sensor locations",
		type: "overlay",
		visible: true,
		source: new Cluster({
			distance: 20, 					
			source: new VectorSource({wrapX: false}),
			wrapX: false
		}),
		style: SENSOR_STYLE_FUNCTION
	}));
};

/**
 * LSOA style 
 */
const LSOA_STYLE = (feature) => {
	return(new Style({
		fill: new Fill({
			color: "rgba(215, 206, 199, 0.0)"
		}),
		stroke: new Stroke({
			color: "rgba(118, 50, 63, 1)",
			width: 1
		})		
	}));
};

/**
 * Office of National Statistics LSOA dataset
 * http://geoportal.statistics.gov.uk/datasets/da831f80764346889837c72508f046fa_1/data
 * Downloaded as Shapefile and exported via local Geoserver
 */
export const LSOA_LAYER = () => {
	return(new VectorLayer({
		title: "LSOAs",
		type: "overlay",
		extent: NEWCASTLE_CENTRE_3857,
        source: new VectorSource({
			format: new GeoJSON(),
			url: function(extent) {
				return(`
					http://ec2-52-207-74-207.compute-1.amazonaws.com:8080/geoserver/data_dot_gov/wfs?service=WFS&
					version=2.0.0&request=GetFeature&typename=data_dot_gov:lsoa&
					outputFormat=application/json&srsname=EPSG:3857&bbox=
					` 
					+ extent.join(",") + ",EPSG:3857");
			},
			strategy: bboxStrategy
		}),
        style: LSOA_STYLE
    }));
};

/**
 * Overlay layer for the above to facilitate mousemove handler
 */
export const LSOA_HIGHLIGHT_STYLE = (feature) => {
    return(new Style({
        stroke: new Stroke({
            color: "rgba(192, 159, 128, 1)",
            width: 1
        }),
        fill: new Fill({
            color: "rgba(192, 159, 128, 0.4)"
        }),
		text: new Text({
			font: "12px consolas",
			text: feature.get("lsoa11nm"),
			//placement: "line",
			overflow: true,
			stroke: new Stroke({
				color: "rgba(118, 50, 63, 1)"
			}),
			fill: new Fill({
				color: "rgba(118, 50, 63, 1)"
			})
		})
    }));
};
 
/**
 * OL map
 */
export const MAP = (layers) => {
	return(new Map({
		target: "map",
		layers: layers, 
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
	}));
};