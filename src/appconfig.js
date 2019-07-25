/**
 * @module appconfig
 */

import {fromLonLat} from "ol/proj";

/**
 * Address of Amazon AWS instance and proxy to circumvent CORS for the UO API
 */
export const AWS_INSTANCE = "http://ec2-54-236-44-71.compute-1.amazonaws.com:8080";

/**
 * Project Geoserver
 */
export const GEOSERVER_WORKSPACE = "siss";
export const GEOSERVER_WMS = `${AWS_INSTANCE}/geoserver/${GEOSERVER_WORKSPACE}/wms`;
export const GEOSERVER_WFS = `${AWS_INSTANCE}/geoserver/${GEOSERVER_WORKSPACE}/wfs`;
export const GEOSERVER_REST = `${AWS_INSTANCE}/geoserver/rest/workspaces/${GEOSERVER_WORKSPACE}/datastores/pg_store`;

/**
 * Map projection (Google Spherical Mercator EPSG:3857)
 */
export const MAP_PROJECTION = "EPSG:3857";

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