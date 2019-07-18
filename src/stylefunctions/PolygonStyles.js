/**
 * @module PolygonStyles
 */

import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";

/**
 * Invisible (unlabelled) polygon style using opacity 0 for stroke and fill
 * @param {*} zIndex 
 */
export const invisible = (zIndex = Infinity) => {
    return((feature, res) => {
        return(new Style({
            fill: new Fill({color: "#000000".toRgba(0.0)}),
            stroke: new Stroke({color: "#000000".toRgba(0.0)}),
            zIndex: zIndex
        }));            
    });
}   

/**
 * Style function for a boundaried polygon labelled at its centroid
 * @param {Object} strokeOpts
 *  - {string} color  - stroke colour/opacity as rgba, default rgba(0, 0, 0, 1.0)
 *  - {int} width     - stroke width, default 1
 * @param {Object} fillOpts
 *  - {string} color  - fill colour/opacity as rgba, default rgba(255, 255, 255, 1.0)
 * @param {Object} textOpts  
 *  - {string} labelAttr - label attribute
 * @param {int} zIndex - style zIndex
 */
export const centroidLabelled = (strokeOpts, fillOpts, textOpts, zIndex = Infinity) => {

    /* Set stroke defaults */
    const STROKE_DEFAULTS = {
        color: "#000000".toRgba(1.0),
        width: 1
    };

    /* Set fill defaults */
    const FILL_DEFAULTS = {
        color: "#ffffff".toRgba(1.0),
    };

    /* Set labelling defaults */
    const TEXT_DEFAULTS = {
        font: "14px sans-serif",
        placement: "point",
        overflow: true,
        stroke: new Stroke({color: "#ffffff".toRgba(1.0), width: 3}),
        fill: new Fill({color: "#000000".toRgba(1.0)}),
        padding: [10, 10, 10, 10]
    };

    let mergedStrokeOpts = Object.assign({}, STROKE_DEFAULTS, strokeOpts);
    let mergedFillOpts = Object.assign({}, FILL_DEFAULTS, fillOpts);

    return((feature, res) => {
        let style = null;
        let layer = feature.get("layer");
        if (layer && res >= layer.getMinResolution() && (!isFinite(layer.getMaxResolution()) || res <= layer.getMaxResolution())) {
            /* Layer in range */
            style = new Style({
                stroke: new Stroke(mergedStrokeOpts),
                fill: new Fill(mergedFillOpts),
                text: new Text(Object.assign({}, TEXT_DEFAULTS, {
                    text: feature.get(textOpts.labelAttr || "name")
                })),                
                zIndex: zIndex
            });
        }       
        return(style);
	});
};
