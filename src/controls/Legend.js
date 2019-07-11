/**
 * @module Legend
 */

import * as geoconst from "../GeoConstants";
import SwitcherSubControl from "./base/SwitcherSubControl";

/** 
 * @classdesc Class to render a layer legend
 */
export default class Legend extends SwitcherSubControl {

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

        super({
            element: element,
            elementClass: "ol-legend-control",
            target: options.target,
            headerClass: "legend-header",
            bodyClass: "legend-body"
        });
    }

    /**
     * Show a legend for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {
        let parms = {
            "request": "GetLegendGraphic",
            "version": "1.3",
            "format": "image/png",
            "width": 30,
            "height": 30,
            "layer": this._getFeature(layer),
            "legend_options": "layout:horizontal;rows:4;rowwidth:200;fontColor:ffffff;fontName=sans-serif;fontAntiAliasing:true;bgColor:000000"
        };        
        let queryString = Object.keys(parms).map(key => key + "=" + parms[key]).join("&");
        if (!this.element.classList.contains("active")) {
            this.element.classList.add("active");
        }
        let titleDiv = this._headerDiv.querySelector("div:first-child");
        let caption = this._getLegendCaption(layer);
        titleDiv.setAttribute("title", caption);
        titleDiv.innerHTML = caption;
        this._bodyDiv.innerHTML = `<img src="${geoconst.GEOSERVER_WMS}?${queryString}" alt="legend"/>`;
        this._layer = layer;
        this.set("active", true);        
    }

    /**
     * Get a caption from the layer's switcher options
     * @param {ol.Layer} layer
     * @return {string}
     */
    _getLegendCaption(layer) {
        let caption = null;
        let opts = layer.get("switcherOpts");
        if (opts && opts.legend) {
            caption = opts.legend;
        } else {
            caption = layer.get("title");
        }
        return(caption);
    }

}