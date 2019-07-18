/**
 * @module UrbanObservatory
 */

import {fromLonLat} from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import * as geoconst from "../utilities/GeoConstants";

/**
 * Loader function for getting themed sensor location data from the NU Urban Observatory
 * @param {string} theme - sensor theme e.g. 'Air Quality'
 * @param {string} sensorType - sensor type e.g. 'NO2'
 */
export const sensorLocationsByTheme = (theme, sensorType) => {
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
