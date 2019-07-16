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

import Chart from "ol-ext/style/Chart";

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
const BOUNDARY_HOVER_STYLE = (col, opacity = 0.4, nameAttr = "name") => {
	return((feature, res) => {
        let layer = feature.get("layer"), style = null;
        if (layer) {
            if (res >= layer.getMinResolution() && (!isFinite(layer.getMaxResolution()) || res <= layer.getMaxResolution())) {
                /* Layer in range */
                style = new Style({
                    stroke: new Stroke({color: col.toRgba(1.0)}),
                    fill: new Fill({color: col.toRgba(opacity)}),
                    text: new Text({
                        font: "14px sans-serif",
                        text: feature.get(nameAttr),
                        placement: "point",
                        overflow: true,
                        stroke: new Stroke({color: "#ffffff".toRgba(1.0), width: 3}),
                        fill: new Fill({color: col.toRgba(1.0)}),
                        padding: [10, 10, 10, 10]
                    })
                });
            }
        }
        return(style);
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
            opacity: LA_OPACITY,
			switcherOpts: {
                icon: "literal:LA",
                feature: LA_FEATURE,
                opacity: false
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: LA_COL.toRgba(0.0)}),
                    stroke: new Stroke({color: LA_COL.toRgba(0.0)}),
                    zIndex: 100
				}));
			}
		},
        GEOJSON_SOURCE(LA_FEATURE),
        {
            style: BOUNDARY_HOVER_STYLE(LA_COL, LA_OPACITY)
        }		
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
            opacity: LSOA_OPACITY,
			switcherOpts: {
                icon: "literal:LSOA",
                feature: LSOA_FEATURE,
                opacity: false
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: LSOA_COL.toRgba(0.0)}),
                    stroke: new Stroke({color: LSOA_COL.toRgba(0.0)}),
                    zIndex: 110		
				}));
			}
		},
        GEOJSON_SOURCE(LSOA_FEATURE),
        {
            style: BOUNDARY_HOVER_STYLE(LSOA_COL, LSOA_OPACITY)
        }		
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
            opacity: OA_OPACITY,
			switcherOpts: {
                icon: "literal:OA",
                feature: OA_FEATURE,
                opacity: false
            },
			style: (feature) => {
				return(new Style({
					fill: new Fill({color: OA_COL.toRgba(0.0)}),
                    stroke: new Stroke({color: OA_COL.toRgba(0.0)}),
                    zIndex: 120	
				}));
			}
		},
        GEOJSON_SOURCE(OA_FEATURE),
        {
            style: BOUNDARY_HOVER_STYLE(OA_COL, OA_OPACITY, "code")
        }		
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
 * Ethnicity layer
 */
const ETHNICITY_FEATURE = "siss:tyne_and_wear_ethnicity_summary"
const ETHNICITY_OPACITY = 1.0;
const ETHNICITY_STYLE = sel => {
    return((f, res) => {
        let styles = [];
        let data = [
            isNaN(f.get("white")) ? 0 : parseInt(f.get("white")),            
            isNaN(f.get("asian")) ? 0 : parseInt(f.get("asian")),
            isNaN(f.get("black")) ? 0 : parseInt(f.get("black")),
            isNaN(f.get("mixed")) ? 0 : parseInt(f.get("mixed")),
            isNaN(f.get("other")) ? 0 : parseInt(f.get("other"))
        ];
        let sum = isNaN(f.get("total_residents")) ? 0 : parseInt(f.get("total_residents"));
        let radius = (20 - 0.5 * res) * (sel ? 1.2 : 1.0);
        styles.push(new Style({                                        
            image: new Chart({
                type: "pie",
                radius: radius,
                data: data,
                rotateWithView: true,
                colors: ["cornsilk", "brown", "black", "goldenrod", "gray"],
                stroke: new Stroke({
                    color: "black",
                    width: 2 - 0.05 * res
                })
            })
        }));
        if (sel) {
            let arc = 0;
            for (let dataSlice of data) {
                let angle = (2.0 * arc + dataSlice) / sum*Math.PI - Math.PI/2.0;
                let pc = Math.round(dataSlice / sum * 1000.0);
                if (pc > 100) {
                    /* Ignore anything < 10% as labels will inevitably conflict and be unreadable */
                    styles.push(new Style({
                        text: new Text({
                            text: `${pc/10}%`,
                            offsetX: Math.cos(angle) * (radius + 6),
                            offsetY: Math.sin(angle) * (radius + 6),
                            textAlign: (angle < Math.PI/2.0 ? "left" : "right"),
                            textBaseline: "middle",
                            stroke: new Stroke({
                                color: "white",
                                width: 2.5
                            }),
                            fill: new Fill({
                                color: "black"
                            })
                        })
                    }));
                }
                arc += dataSlice;
            }
        }
        return(styles);
    });
}
export const ETHNICITY = () => {
	return(new InteractiveVectorLayer(
		{ /* Layer options */
			title: "Ethnic composition", 
			cluster: false,
			visible: false,
			minResolution: 2,
			maxResolution: 20,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: 200,
            opacity: ETHNICITY_OPACITY,
			switcherOpts: {
                icon: "users",
                feature: ETHNICITY_FEATURE
            },
			style: ETHNICITY_STYLE(false)
		},
        GEOJSON_SOURCE(ETHNICITY_FEATURE), {},
        {
            style: ETHNICITY_STYLE(true)
        }
	));
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