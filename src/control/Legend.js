/**
 * @module Legend
 */

import {getCenter} from "ol/extent";
import Projection from "ol/proj/Projection"
import Map from "ol/Map";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
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

        /* Mini-map to show a legend for some vector layers */
        this._legendMap = null;
        this._legendLayer = null;

        /* Create tile and vector layer divs */
        this._bodyDiv.innerHTML = `
            <div class="html-legend-container invisible"></div>
            <div class="map-legend-container invisible"></div>
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
     * It is assumed that the layer switcher options entry 'legend' is an object with the following members:
     *  - geometryType {string} - point|line|polygon|chart
     *  - caption {string} - the caption for the legend control title (optional, defaults to the layer title)
     *  - attrs {Array<string>} - attributes figuring in the legend (geometryType = 'chart' only)
     *  - colors {Array<string>} - corresponding colours figuring in the legend (geometryType = 'chart' only)
     * @param {ol.Layer} layer
     */
    _vectorLegend(layer) {        
        let opts = layer.get("switcherOpts");
        switch(this._determineVectorLegendType(opts)) {

            case "manual":
                /* Construct legend manually from option arrays 'attr' and 'colors' contained in opts.legend */
                let attrs = opts.legend.attrs, colors = opts.legend.colors;
                let legendMarkup = `<table class="manual-legend-table">`;
                let ncols = 2, nrows = Math.ceil(attrs.length / ncols);
                for (let row = 0, i = 0; row < nrows; row++) {  
                    legendMarkup += `<tr>`;
                    for (col = 0; col < ncols; col++) {
                        legendMarkup += `
                            <td class="swatch"><div style="background-color:${i == attrs.length ? "transparent;border:0" : colors[i]}">&nbsp;</div></td>
                            <td class="caption">${i == attrs.length ? "&nbsp;" : attrs[i]}</td>`;
                        i++;
                    } 
                    legendMarkup += `</tr>`;
                }
                legendMarkup += `</table>`;
                this._selectContainer("html").innerHTML = legendMarkup;                
                break;

            case "feature":
                let legendContainer = this._selectContainer("map");
                let geometry = null;
                switch (opts.legend.geometryType) {
                    case "point":
                        geometry = new Point([16, 16]);
                        break;
                    case "line":
                        let lineCoords = [];                
                        lineCoords.push([15.6, 15.6]);
                        lineCoords.push([16, 16]);
                        lineCoords.push([16, 15.8]);
                        lineCoords.push([16.4, 16.2]);
                        geometry = new LineString(lineCoords);
                        break;
                    case "polygon":
                        let polyCoords = [];
                        polyCoords.push([15.7, 15.7]);
                        polyCoords.push([16.3, 15.7]);
                        polyCoords.push([16.3, 16.3]);
                        polyCoords.push([15.7, 16.3]);
                        polyCoords.push([15.7, 15.7]);
                        geometry = new Polygon([polyCoords]);
                        break;
                    default:
                        break;
                }
                if (geometry != null) {                    
                    if (!this._legendMap) {
                        /* The legend map doesn't exist, so create it */
                        let extent = [0, 0, 32, 32];
                        var projection = new Projection({
                            units: "pixels",
                            extent: extent
                        });
                        let legendSource = new VectorSource({wrapX: false});
                        this._legendLayer = new VectorLayer({
                            source: legendSource,
                            style: layer.getStyle()
                        });
                        this._legendMap = new Map({
                            controls: [],
                            layers: [                   
                                this._legendLayer
                            ],
                            target: legendContainer,
                            view: new View({
                                projection: projection,
                                center: getCenter(extent),
                                zoom: 2,
                                maxZoom: 2
                            })
                        });
                    } else {
                        this._legendLayer.setStyle(layer.getStyle());
                        this._legendLayer.getSource().clear();
                    }         
                    let feature = new Feature({geometry: geometry});      
                    console.log(feature);
                    this._legendLayer.getSource().addFeature(feature);
                    this._legendLayer.getSource().changed();
                } else {
                    this._selectContainer("html").innerHTML = "Incorrectly specified legend information";
                }                
                break;
            
            default:
                this._selectContainer("html").innerHTML = "Incorrectly specified legend information";
                break;
        }           
        this._positioningCallback();        
    }

    /**
     * Get a caption from the layer's switcher options
     * @param {ol.Layer} layer
     * @return {string}
     */
    _getLegendCaption(layer) {
        let caption = null;
        let opts = layer.get("switcherOpts");
        switch (typeof opts.legend) {
            case "string":
                caption = opts.legend;
                break;
            case "object":
                caption = opts.legend.caption || layer.get("title");
                break;
            default:
                caption = layer.get("title");
                break;
        }       
        return(caption);
    }

    /**
     * Make the relevant container visible and return it, hiding the non-relevant one in the process
     * @param {string} containerType (html|map) 
     */
    _selectContainer(containerType) {
        let selectedContainer = this._bodyDiv.querySelector(`div.${containerType}-legend-container`);
        let deselectedContainer = this._bodyDiv.querySelector(`div.${containerType == "html" ? "map" : "html"}-legend-container`);
        selectedContainer.classList.remove("invisible");
        deselectedContainer.classList.add("invisible");
        return(selectedContainer);
    }

    /**
     * Determine how to construct vector legend:
     * - manual - manually from options 'attrs' and 'colors'
     * - feature - from a dummy feature of the correct geometry type
     * - null - indicates incorrectly specified options
     * @param {object} opts 
     */
    _determineVectorLegendType(opts) {
        let vectorLegendType = null;
        if (opts && typeof opts.legend == "object") {
            if (opts.legend.geometryType == "chart" && 
                Array.isArray(opts.legend.attrs) && 
                Array.isArray(opts.legend.colors) && 
                opts.legend.attrs.length > 0 && 
                opts.legend.attrs.length == opts.legend.colors.length) {
                vectorLegendType = "manual";
            } else if (["point", "line", "polygon"].findIndex(x => x == opts.legend.geometryType) != -1) {
                vectorLegendType = "feature";
            }
        }
        return(vectorLegendType);
    }

}