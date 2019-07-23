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
