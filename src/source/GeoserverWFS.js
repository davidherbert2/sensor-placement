/**
 * @module GeoserverWFSSource
 * 
 */
import {bbox} from "ol/loadingstrategy";
import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import {GEOSERVER_WFS} from "../appconfig";

/** 
 * @classdesc Class to provide feature loading capability from Geoserver WFS services
 */
export default class GeoserverWFSSource extends VectorSource {

    /**
	 * Source constructor
     * Possible options:
     *  - {string} featureType - e.g. 'siss:tyne_and_wear_la'
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Defaults for source options */
        const SOURCE_DEFAULTS = {
            format: new GeoJSON(),
            strategy: bbox,
		    overlaps: false,
            wrapX: false,
        };

        super(Object.assign({}, SOURCE_DEFAULTS, options));

        this.set("featureType", options.featureType);

        this.setLoader(this.getFeatureLoader());
    }

    /**
     * Loader function for getting features from a GeoJSON feed output by Geoserver WFS
     */
    getFeatureLoader() {

        let featureType = this.get("featureType");
        let wfsEndpoint = `${GEOSERVER_WFS}`;

        return(function(extent, resolution, projection) {        
            let source = this;
            let parms = {
                "service": "WFS",
                "request": "GetFeature",
                "version": "2.0.0",
                "outputFormat": "application/json",
                "srsname": projection.getCode(),
                "typename": featureType,
                "bbox": extent.join(",")
            };        
            let queryString = Object.keys(parms).map(key => key + "=" + parms[key]).join("&");
            fetch(`${wfsEndpoint}?${queryString},${projection.getCode()}`)
                .then(r => r.json())
                .then(jsonResponse => {
                    source.addFeatures(this.getFormat().readFeatures(jsonResponse));
                })
                .catch(error => {
                    console.log(error);
                });		
        });
    }

};

