/**
 * @module Legend
 */

import {GEOSERVER_WMS} from "../appconfig";
import {toContext} from "ol/render";
import Feature from "ol/Feature";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
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
        legendImage.setAttribute("src", `${GEOSERVER_WMS}?${queryString}`);
    }

    /**
     * Create a legend from a vector layer's style    
     * @param {ol.Layer} layer
     */
    _vectorLegend(layer) {
        let legendOpts = layer.legendOptions || {method: "unclassified"};
        let legendCanvas = this._selectContainer("canvas").firstElementChild;
        switch(legendOpts.method) {
            case "classified":
                this._classified(legendCanvas, legendOpts);
                break;
            default:
                let style = layer.getStyle();
                if (legendOpts.styleOverride) {
                    style = new Style({
                        stroke: new Stroke(legendOpts.styleOverride.stroke),
                        fill: new Fill(legendOpts.styleOverride.fill)
                    })
                }
                this._unclassified(legendCanvas, legendOpts.geometryType, style);
                break;
        }
        this._positioningCallback();        
    }

    /**
     * Render an unclassified legend from layer vector style
     * @param {HTMLElement} canvas 
     * @param {string} geomType - point|line|polygon
     * @param {ol.Style} style - style to apply to displayed geometry
     */
    _unclassified(canvas, geomType, style) {
        let swatchSize = 20, padding = 8;
        let w = canvas.scrollWidth, h = 2 * padding + swatchSize;   
        canvas.height = h;
        let context = canvas.getContext("2d");
        context.clearRect(0, 0, w, h);
        let vectorContext = toContext(context, {size: [w, h]});             
        let x0 = padding, y0 = padding;
        let geom = null;
        switch(geomType) {
            case "polygon":
                geom = new Polygon([[
                    [x0, y0],
                    [x0 + swatchSize, y0],
                    [x0 + swatchSize, y0 + swatchSize],
                    [x0, y0 + swatchSize],
                    [x0, y0]
                ]]);
                break;
            case "line":
                geom = new LineString([
                    [x0, y0],
                    [x0 + swatchSize, y0 + swatchSize]
                ]);
                break;
            default: 
                geom = new Point([x0 + 0.5 * swatchSize, y0 + 0.5 * swatchSize]);
                break;        
        }
        if (geom != null) {
            if (typeof style == "function") {
                style = style(new Feature(geom));                
            }
            style = Array.isArray(style) ? style : [style];
            style.forEach(s => {
                vectorContext.setStyle(s);   
                vectorContext.drawGeometry(geom);
            });             
        }           
    }

    /**
     * Render a vector legend to the given canvas
     * @param {HTMLElement} canvas
     * @param {Object} options
     */
    _classified(canvas, options) {
        let attrs = options.attributes, colors = options.colors;        
        let swatchSize = 20, padding = 8;
        let colWidth = 90, rowHeight = swatchSize + 2 * padding;
        let nrows = Math.ceil(attrs.length / 2), ncols = Math.floor(w / colWidth);
        let w = canvas.scrollWidth, h = padding + nrows * rowHeight;        
        let baseStyle = new Style({
            fill: new Fill(),
            stroke: new Stroke({
                color: "darkslategray"
            }),
            text: new Text({
                font: "14px sans-serif",
                offsetX: swatchSize + 2 * padding,
                textBaseline: "middle",
                fill: new Fill({color: "#ffffff".toRgba(1.0)})
            })
        });
        canvas.height = h; 
        let context = canvas.getContext("2d");
        context.clearRect(0, 0, w, h);
        let vectorContext = toContext(context, {size: [w, h]});        

        /* Get attributes and colours for rendering */
        for (let row = 0, i = 0; row < nrows; row++) {
            for (let col = 0; col < ncols; col++) {
                if (i < attrs.length) {
                    baseStyle.getFill().setColor(colors[i]);
                    baseStyle.getText().setText(attrs[i]);
                    vectorContext.setStyle(baseStyle);
                    let x0 = padding + col * colWidth, y0 = padding + row * rowHeight;
                    vectorContext.drawGeometry(new Polygon([[
                        [x0, y0],
                        [x0 + swatchSize, y0],
                        [x0 + swatchSize, y0 + swatchSize],
                        [x0, y0 + swatchSize],
                        [x0, y0]
                    ]]));
                    i++;
                }                
            }
        } 
        
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