/**
 * @module GeoConstants
 */

import {METERS_PER_UNIT, fromLonLat} from "ol/proj";

/**
 * Map projection (Google Spherical Mercator EPSG:3857)
 */
export const MAP_PROJECTION = "EPSG:3857";

/**
 * Address of Amazon AWS instance and proxy to circumvent CORS for the UO API
 */
export const AWS_INSTANCE = "http://ec2-54-236-44-71.compute-1.amazonaws.com:8080";
export const PROXY = `${AWS_INSTANCE}/sensor-placement/cgi-bin/uo_wrapper.py`;

/**
 *  Geoserver params 
 */
export const GEOSERVER_ENDPOINT  = `${AWS_INSTANCE}/geoserver`;
export const GEOSERVER_WORKSPACE = "siss";
export const GEOSERVER_PG_STORE  = "pg_store";
export const GEOSERVER_WMS  = `${GEOSERVER_ENDPOINT}/${GEOSERVER_WORKSPACE}/wms`				
export const GEOSERVER_WFS  = `${GEOSERVER_ENDPOINT}/${GEOSERVER_WORKSPACE}/wfs?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&srsname=${MAP_PROJECTION}`
export const GEOSERVER_REST = `${GEOSERVER_ENDPOINT}/rest/workspaces/${GEOSERVER_WORKSPACE}/datastores/${GEOSERVER_PG_STORE}`
 
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
 * World extent for sensor map in WGS 84
 */
export const NEWCASTLE_CENTRE = [-2.4163, 54.7373, -0.8356, 55.2079];

/**
 * Bounding box of interest for sensor map, in EPSG:3857
 */
export const NEWCASTLE_CENTRE_3857 = 
	fromLonLat([NEWCASTLE_CENTRE[0], NEWCASTLE_CENTRE[1]], MAP_PROJECTION).concat(
    fromLonLat([NEWCASTLE_CENTRE[2], NEWCASTLE_CENTRE[3]], MAP_PROJECTION));
    
/**
 * Convert an OL extent array to the object form required by the Urban Observatory
 * @param {ol.extent} olExtent 
 * @return {Object}
 */
export const OL2UO = (olExtent) => {
    return({
        "bbox_p1_x": olExtent[0],
        "bbox_p1_y": olExtent[1],
        "bbox_p2_x": olExtent[2],
        "bbox_p2_y": olExtent[3]
    });
};

/**
 * Get the scale of the supplied map, optionally using a dpi value
 * @param {ol.Map} map 
 * @param {float} dpi 
 * @return {int}
 */
export const MAP_SCALE = (map, dpi = 96) => {
    return(Math.ceil(map.getView().getResolution() * 
        METERS_PER_UNIT[map.getView().getProjection().getUnits()] * 
        39.37 *     /* Inches in one metre */
        dpi         /* Dots per inch */
    ));
};