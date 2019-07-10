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

        /* If control is active */
        this.active = false;

        /* Record of the layer legend is shown for */
        this._layer = null;

        /* Create header and body */
        this._legendHeaderDiv = document.createElement("div");
        this._legendHeaderDiv.classList.add("legend-header");
        this._legendHeaderDiv.innerHTML = `
            <div></div><div><a href="JavaScript:void(0)"><i class="fa fa-times"></i></a></div>
        `;
        this.element.appendChild(this._legendHeaderDiv);
        this._legendBodyDiv = document.createElement("div");
        this._legendBodyDiv.classList.add("legend-body");                    
        this.element.appendChild(this._legendBodyDiv);

        /* Close button handler */
        this._legendHeaderDiv.querySelector("a").addEventListener("click", this.hide.bind(this));
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
            "legend_options": "layout:horizontal;rowwidth:300;fontColor:ffffff;fontName=sans-serif;bgColor:000000"
        };        
        let queryString = Object.keys(parms).map(key => key + "=" + parms[key]).join("&");
        if (!this.element.classList.contains("active")) {
            this.element.classList.add("active");
        }        
        this._legendHeaderDiv.querySelector("div:first-child").innerHTML = this._getLegendCaption(layer);
        this._legendBodyDiv.innerHTML = `<img src="${geoconst.GEOSERVER_WMS}?${queryString}" alt="legend"/>`;
        this._layer = layer;
        this.active = true;        
    }

    /**
     * Hide the legend
     */
    hide() {
        if (this.element.classList.contains("active")) {
            this.element.classList.remove("active");
        } 
        this._layer = null; 
        this.active = false;
    }   

    get layer() {
        return(this._layer);
    }

    get active() {
        return(this.active);
    }

    addActivationCallback(cb) {
        this.on("propertychange", evt => {
            if (evt.key === "active") {
                console.log(evt);
            }
        });
    }

    removeActivationCallback(cb) {

    }
    
    /**
     * Get a caption from the layer's switcher options
     * @param {ol.Layer} layer
     * @return {string}
     */
    _getLegendCaption(layer) {
        let caption = "Legend";
        let opts = layer.get("switcherOpts");
        if (opts && opts.legend) {
            caption = opts.legend;
        }
        return(caption);
    }

}