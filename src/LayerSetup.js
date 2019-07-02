/**
 * @module SensorMapSetup
 */

import {fromLonLat} from "ol/proj";
import {bbox as bboxStrategy} from "ol/loadingstrategy";
import Style from "ol/style/Style";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import GeoJSON from "ol/format/GeoJSON"; 
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS"

import * as utils from "./Utilities.js"
import * as geoconst from "./GeoConstants.js";
import InteractiveVectorLayer from "./InteractiveVectorLayer.js";

/**
 * Return options for a GeoJSON source pointing to the given typename
 * @param {string} feature - the name of the data layer, namespaced if necessary
 * @return {Object}
 */
const GEOJSON_SOURCE = (feature) => {
	return({ /* Source options */
		format: new GeoJSON(),
		url: (extent) => {
			return(`${geoconst.GEOSERVER_WFS}&typename=${feature}&bbox=` + extent.join(",") + `,${geoconst.MAP_PROJECTION}`);
		},
		strategy: bboxStrategy,
		overlaps: false,
		wrapX: false		
	});
};

/**
 * Loader function for getting sensor location data from the Urban Observatory
 * @param {string} theme - sensor theme e.g. 'Air Quality'
 * @param {string} sensorType - sensor type e.g. 'NO2'
 */
const UO_LOADER = (theme, sensorType) => {
    return(function(extent) {
        let source = this;
        let sensorInfo = geoconst.UO_SENSOR_DATA;
        let sensorArgs = {
            "theme": theme,
            "sensor_type": sensorType
        };
        Object.assign(sensorArgs, geoconst.OL2UO(geoconst.NEWCASTLE_CENTRE));
        sensorInfo = sensorInfo + "?" + Object.keys(sensorArgs).map(key => key + "=" + sensorArgs[key]).join("&");
        source.clear();
        fetch(sensorInfo)
            .then(r => r.json())
            .then(jsonResponse => {
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
            });		
    });
};

/**
 * Options for the OA/LSOA/LA boundaries on hover
 * @param {string} col 
 * @param {float} opacity 
 * @param {string} nameAttr 
 */
const BOUNDARY_HOVER_OPTIONS = (col, opacity = 0.4, nameAttr = "name") => {
	return({ /* Hover options */
		style: (feature) => {
			return(new Style({
				stroke: new Stroke({color: utils.HEX2RGBA(col, opacity)}),
				fill: new Fill({color: utils.HEX2RGBA(col, opacity)}),
				text: new Text({
					font: "12px DejaVu Sans",
					text: feature.get(nameAttr),
					overflow: true,
					stroke: new Stroke({color: utils.HEX2RGBA(col, 1.0)}),
					fill: new Fill({color: utils.HEX2RGBA(col, 1.0)})
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
        opacity: 0.6,
        zIndex: 1,
        switcherOpts: {
            icon: "literal:OSM",
            attribution: true
        },		
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
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 100,
			switcherOpts: {
                icon: "literal:LA",
                attribution: true
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: utils.HEX2RGBA(LA_COL, 0.0)}),
					stroke: new Stroke({color: utils.HEX2RGBA(LA_COL, 0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_la"),
		BOUNDARY_HOVER_OPTIONS(LA_COL, 0.4)
	));
};

/**
 * LSOA layer
 */
const LSOA_COL = "#63535b"
export const LSOA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Lower Super Output Areas", 
			type: "overlay", 
			cluster: false,
			visible: true,
			minResolution: 2,
			maxResolution: 20,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 110,
			switcherOpts: {
                icon: "literal:LSOA",
                attribution: true
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: utils.HEX2RGBA(LSOA_COL, 0.0)}),
					stroke: new Stroke({color: utils.HEX2RGBA(LSOA_COL, 0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_lsoa"),
		BOUNDARY_HOVER_OPTIONS(LSOA_COL)
	));
};

/**
 * OA layer
 */
const OA_COL = "#400406"
export const OA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Output Areas", 
			type: "overlay", 
			cluster: false,
			visible: true,
			maxResolution: 10,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 120,
			switcherOpts: {
                icon: "literal:OA",
                attribution: true
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: utils.HEX2RGBA(OA_COL, 0.0)}),
					stroke: new Stroke({color: utils.HEX2RGBA(OA_COL, 0,0)})		
				}));
			}
		},
		GEOJSON_SOURCE("siss:tyne_and_wear_oa"),
		BOUNDARY_HOVER_OPTIONS(OA_COL, 0.4, "code")
	));
};

/**
 * IMD layer
 */
export const IMD = () => {
	return(new TileLayer({
		title: "Index of Multiple Deprivation",
        visible: false,
        zIndex: 10,
		switcherOpts: {
            icon: "minus",
            attribution: true,
            ztl: true,
            opacity: true,
            legend: "IMD Decile"
        },
		opacity: 0.6,
		source: new TileWMS({
			url: geoconst.GEOSERVER_WMS,
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
        zIndex: 11,
		switcherOpts: {
            icon: "wheelchair",
            attribution: true,            
            ztl: true,
            opacity: true,
            legend: "% of disabled with day-to-day limitations"
        },
		opacity: 0.6,
		source: new TileWMS({
			url: geoconst.GEOSERVER_WMS,
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
export const SENSORS = (theme , sensorType, zIndex, visible = false, icon = "question") => {
	return(new InteractiveVectorLayer(
		{
			title: `${sensorType} sensors`,
			type: "overlay",
			cluster: true,
            visible: visible,
            zIndex: zIndex,		
            switcherOpts: {
                icon: icon,
                attribution: true,
                ztl: true,
                opacity: true,
                legend: `${theme} ${sensorType} sensors`
            },			
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
		{
            loader: UO_LOADER(theme, sensorType),
            wrapX: false
        }, {},
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