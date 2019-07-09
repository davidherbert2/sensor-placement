/**
 * @module Legend
 */

import Control from "ol/control/Control";
import * as geoconst from "../GeoConstants.js";
import * as common from "./Common.js";

/** 
 * @classdesc Class to render a layer legend
 */
export default class Legend extends Control {

	/**
	 * Create layer legend control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = "ol-legend-control ol-unselectable ol-control";

        super({
            element: element,
            target: options.target
        });

        /* Create header and body */
        this._legendHeaderDiv = document.createElement("div");
        this._legendHeaderDiv.classList.add("legend-header");
        this.element.appendChild(this._legendHeaderDiv);
        this._legendBodyDiv = document.createElement("div");
        this._legendBodyDiv.classList.add("legend-body");                    
        this.element.appendChild(this._legendBodyDiv);
    }

    /**
     * Show a legend for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {
        let source = featureType = null;
        [source, featureType] = common.sourceFeature(layer);
        let parms = {
            "request": "GetLegendGraphic",
            "version": "1.3",
            "format": "image/png",
            "width": 30,
            "height": 30,
            "layer": featureType,
            "legend_options": "layout:horizontal;rowwidth:300;fontColor:ffffff;fontName=sansserif;bgColor:000000"
        };        
        let queryString = Object.keys(parms).map(key => key + "=" + parms[key]).join("&");
        if (!this.element.classList.contains("active")) {
            this.element.classList.add("active");
        }        
        this._legendHeaderDiv.innerHTML = layer.get("legend") || "Legend";
        this._legendBodyDiv.innerHTML = `<img src="${geoconst.GEOSERVER_WMS}?${queryString}" alt="legend"/>`;            
    }

    /**
     * Hide the legend
     */
    hide() {
        if (this.element.classList.contains("active")) {
            this.element.classList.remove("active");
        }  
    }      

}