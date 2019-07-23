/**
 * @module GeoserverWmsSource
 */
import TileWMS from "ol/source/TileWMS"
import * as appconfig from "../appconfig";

/** 
 * @classdesc Class to provide sensor feature loading capability from Geoserver WFS services
 */
export default class GeoserverWfsSource extends TileWMS {

    /**
	 * Source constructor
     * Possible options:
     *  - {string} layers - e.g. 'siss:imd_2015_by_lsoa'
     *  - {string} workspace - e.g. 'siss'
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options = {}) {

        super({
            url: `${appconfig.AWS_INSTANCE}/geoserver/${options.workspace}/wms`,
            params: Object.assign({}, {
                serverType: "geoserver",
                wrapX: false
            }, options)
        });
    }

};

