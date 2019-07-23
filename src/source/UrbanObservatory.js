/**
 * @module UrbanObservatorySource
 */

import {fromLonLat} from "ol/proj";
import {bbox} from "ol/loadingstrategy";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import * as appconfig from "../appconfig";

/**
 * Urban Observatory API endpoint
 */
const UO_API = `${appconfig.AWS_INSTANCE}/sensor-placement/cgi-bin/uo_wrapper.py?url=http://uoweb3.ncl.ac.uk/api/v1.1`;
const UO_BOUNDING_BOX = [-2.4163, 54.7373, -0.8356, 55.2079];

/** 
 * @classdesc Class to provide sensor feature loading capability from the Urban Observatory
 */
export default class UrbanObservatorySource extends VectorSource {

    /**
	 * Source constructor
     * Possible options:
     *  - {string} sensorTheme - e.g. 'Air Quality'
     *  - {string} sensorType - e.g 'NO2'
     *  - {ol.extent} extent - Observatory bounding box in WGS84
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Defaults for source options */
        const SOURCE_DEFAULTS = {
            extent: UO_BOUNDING_BOX,
            format: new GeoJSON(),
            strategy: bbox,
		    overlaps: false,
            wrapX: false,
        };

        let merged = Object.assign({}, SOURCE_DEFAULTS, options);

        super(merged);

        this.set("sensorTheme", merged.sensorTheme);
        this.set("sensorType", merged.sensorType);
        this.set("extent", merged.extent);

        this.setLoader(this.sensorLocationsByTheme());
    }

    /**
     * Loader function for getting themed sensor location data from the NU Urban Observatory
     */
    sensorLocationsByTheme() {
        return(function(extent) {

            let source = this;
            let sensorInfo = `${UO_API}/sensors/json/`;
            let sensorArgs = {
                "theme": this.get("sensorTheme"),
                "sensor_type": this.get("sensorType")
            };                        

            sensorArgs = Object.assign(sensorArgs, this._ol2uo(this.get("extent")));
            let queryString = Object.keys(sensorArgs).map(key => key + "=" + sensorArgs[key]).join("&");
            source.clear();

            fetch(`${sensorInfo}?${queryString}`)
                .then(r => r.json())
                .then(jsonResponse => {
                    let features = jsonResponse.sensors.map(sensor => {
                        Object.assign(sensor, {
                            geometry: new Point(fromLonLat([
                                sensor["Sensor Centroid Longitude"], 
                                sensor["Sensor Centroid Latitude"]
                            ]))
                        });
                        let f = new Feature(sensor);
                        f.setId(String.prototype.uuid4());
                        return(f);
                    });
                    source.addFeatures(features);
                })
                .catch(error => {
                    console.log(error);
                });		
        });
    }

    /**
     * Convert an OL extent array to the object form required by the Urban Observatory
     * @param {ol.extent} olExtent 
     * @return {Object}
     */
   _ol2uo(olExtent) {
        return({
            "bbox_p1_x": olExtent[0],
            "bbox_p1_y": olExtent[1],
            "bbox_p2_x": olExtent[2],
            "bbox_p2_y": olExtent[3]
        });
    }

};
