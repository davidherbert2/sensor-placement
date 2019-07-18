/**
 * @module GeoserverWfs
 */

import * as geoconst from "../utilities/GeoConstants";

/**
 * Loader function for getting features from a GeoJSON feed output by Geoserver WFS
 * @param {string} featureType - namespaced Geoserver feature type
 */
export const getFeatureLoader = featureType => {
    return(function(extent, resolution, projection) {        
        let source = this;
        source.clear();
        fetch(`${geoconst.GEOSERVER_WFS}&typename=${featureType}&bbox=${extent.join(",")},${projection.getCode()}`)
            .then(r => r.json())
            .then(jsonResponse => {
                source.addFeatures(this.getFormat().readFeatures(jsonResponse));
            })
            .catch(error => {
                console.log(error);
            });		
    });
};
