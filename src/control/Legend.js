/**
 * @module Legend
 */

import * as geoconst from "../utilities/GeoConstants";
import SwitcherSubControl from "./base/SwitcherSubControl";
import InteractiveVectorLayer from "../layer/InteractiveVectorLayer";

/** 
 * @classdesc Class to render a layer legend
 */
export default class Legend extends SwitcherSubControl {

	/**
	 * Create layer legend control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} [options = {}] - options passed directly to base class constructor
	 */
	constructor(options = {}) {

        /* Create the element div */
        let element = document.createElement("div");

        super({
            element: element,
            elementClass: "ol-legend-control",
            target: options.target,
            headerClass: "legend-header",
            bodyClass: "legend-body"
        });

        /* Create tile and vector layer divs */
        this._bodyDiv.innerHTML = `
            <div class="html-legend-container invisible"></div>
            <div class="canvas-legend-container invisible">
                <canvas></canvas>
            </div>
        `;
    }

    /**
     * Show a legend for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {    
        
        this.activate(layer);
        this.setTitle(this._getLegendCaption(layer));

        if (layer instanceof InteractiveVectorLayer) {
            /* Vector layer => use a map hack base on https://stackoverflow.com/questions/5267554/create-map-legend-to-match-openlayers-style */
            this._vectorLegend(layer);
        } else {
            /* WMS layer => use GetLegendGraphic */
            this._tileLegend(layer);
        }                
    }

    /**
     * Create a legend from a tile layer's WMS style
     * @param {ol.Layer} layer
     */
    _tileLegend(layer) {
        let legendContainer = this._selectContainer("html");
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

        legendContainer.innerHTML = `<img alt="legend"/>`;
        let legendImage = legendContainer.querySelector("img");
        legendImage.addEventListener("load", () => {
            this._positioningCallback();
        });
        legendImage.addEventListener("error", () => {
            legendContainer.innerHTML = "No legend available";
            this._positioningCallback();
        });
        legendImage.setAttribute("src", `${geoconst.GEOSERVER_WMS}?${queryString}`);
    }

    /**
     * Create a legend from a vector layer's style    
     * @param {ol.Layer} layer
     */
    _vectorLegend(layer) {
        if (typeof layer.legend == "function") {
            layer.legend(this._selectContainer("canvas").firstElementChild);
        } else {
            this._selectContainer("html").innerHTML = "No drawLegend function defined for layer";
        }
        this._positioningCallback();        
    }

    /**
     * Get a caption from the layer's switcher options
     * @param {ol.Layer} layer
     * @return {string}
     */
    _getLegendCaption(layer) {
        let opts = layer.get("switcherOpts");
        return(typeof opts.legend == "string" ? opts.legend : layer.get("title"));
    }

    /**
     * Make the relevant container visible and return it, hiding the non-relevant one in the process
     * @param {string} containerType (html|canvas) 
     */
    _selectContainer(containerType) {
        let selectedContainer = this._bodyDiv.querySelector(`div.${containerType}-legend-container`);
        let deselectedContainer = this._bodyDiv.querySelector(`div.${containerType == "html" ? "canvas" : "html"}-legend-container`);
        selectedContainer.classList.remove("invisible");
        deselectedContainer.classList.add("invisible");
        return(selectedContainer);
    }

}