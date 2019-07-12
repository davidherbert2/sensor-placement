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

import * as geoconst from "./utilities/GeoConstants";
import InteractiveVectorLayer from "./vector/InteractiveVectorLayer";

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
				stroke: new Stroke({color: col.toRgba(1.0)}),
				fill: new Fill({color: col.toRgba(opacity)}),
				text: new Text({
					font: "14px sans serif",
                    text: feature.get(nameAttr),
                    placement: "point",
					overflow: true,
					stroke: new Stroke({color: "#ffffff".toRgba(1.0), width: 3}),
                    fill: new Fill({color: col.toRgba(1.0)}),
                    padding: [10, 10, 10, 10]
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
        opacity: 0.7,
        zIndex: 1,
        switcherOpts: {
            icon: "literal:OSM",
            attribution: "© OpenStreetMap contributors"
        },		
		source: new OSM()
	}));
};

/**
 * LA layer
 */
const LA_COL = "#7a4419"
const LA_OPACITY = 0.5
const LA_FEATURE = "siss:tyne_and_wear_la"
export const LA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Local Authority areas", 
			cluster: false,
			visible: false,
			minResolution: 10,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 100,
            opacity: LA_OPACITY,
			switcherOpts: {
                icon: "literal:LA",
                feature: LA_FEATURE
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: LA_COL.toRgba(0.0)}),
					stroke: new Stroke({color: LA_COL.toRgba(0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE(LA_FEATURE),
		BOUNDARY_HOVER_OPTIONS(LA_COL, LA_OPACITY)
	));
};

/**
 * LSOA layer
 */
const LSOA_COL = "#63535b"
const LSOA_OPACITY = 0.5
const LSOA_FEATURE = "siss:tyne_and_wear_lsoa"
export const LSOA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Lower Super Output Areas", 
			cluster: false,
			visible: false,
			minResolution: 2,
			maxResolution: 20,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 110,
            opacity: LSOA_OPACITY,
			switcherOpts: {
                icon: "literal:LSOA",
                feature: LSOA_FEATURE
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: LSOA_COL.toRgba(0.0)}),
					stroke: new Stroke({color: LSOA_COL.toRgba(0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE(LSOA_FEATURE),
		BOUNDARY_HOVER_OPTIONS(LSOA_COL, LSOA_OPACITY)
	));
};

/**
 * OA layer
 */
const OA_COL = "#400406"
const OA_OPACITY = 0.5
const OA_FEATURE = "siss:tyne_and_wear_oa"
export const OA = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Output Areas", 
			cluster: false,
			visible: false,
			maxResolution: 10,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 120,
            opacity: OA_OPACITY,
			switcherOpts: {
                icon: "literal:OA",
                feature: OA_FEATURE
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: OA_COL.toRgba(0.0)}),
					stroke: new Stroke({color: OA_COL.toRgba(0.0)})		
				}));
			}
		},
		GEOJSON_SOURCE(OA_FEATURE),
		BOUNDARY_HOVER_OPTIONS(OA_COL, OA_OPACITY, "code")
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