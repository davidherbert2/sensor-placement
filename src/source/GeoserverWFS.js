/**
 * @module GeoserverWFSSource
 */
import * as appconfig from "../appconfig";

/** 
 * @classdesc Class to provide sensor feature loading capability from Geoserver WFS services
 */
export default class GeoserverWFSSource extends VectorSource {

    /**
	 * Source constructor
     * Possible options:
     *  - {string} featureType - e.g. 'siss:tyne_and_wear_la'
     *  - {string} workspace - e.g. 'siss'
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options = {}) {

        /* Defaults for source options */
        const SOURCE_DEFAULTS = {
            format: new GeoJSON(),
            strategy: bboxStrategy,
		    overlaps: false,
            wrapX: false,
        };

        super(Object.assign({}, SOURCE_DEFAULTS, options));

        this.setLoader(this.getFeatureLoader());
    }

    /**
     * Loader function for getting features from a GeoJSON feed output by Geoserver WFS
     */
    getFeatureLoader = () => {

        let featureType = this.get("featureType");
        let workspace = this.get("workspace");
        let wfsEndpoint = `${appconfig.AWS_INSTANCE}/geoserver/${workspace}/wfs`;

        return(function(extent, resolution, projection) {        
            let source = this;
            source.clear();
            let parms = {
                "service": "WFS",
                "request": "GetFeature",
                "version": "2.0.0",
                "outputFormat": "application/json",
                "srsname": projection,
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

