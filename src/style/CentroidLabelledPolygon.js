/**
 * @module CentroidLabelledPolygonStyle
 */
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import CircleStyle from "ol/style/Circle";

/* Local style cache for performance */
const _styleCache = {};

/** 
 * @classdesc Class to style UO sensors
 */
export default class CentroidLabelledPolygonStyle extends Style {

    /**
	 * Style constructor 
	 * @param {Object} options - options passed directly to base class constructor
     * Options can be:
     *  - outline {string} - outline (stroke) colour (could be supplied as rgba() to indicate opacity), default 'red'
     *  - outlineWidth {string} - outline width
     *  - fill {string} - fill colour (could be supplied as rgba() to indicate opacity), default 'white'
     *  - label {string} - feature attribute to use as the label
     *  - zIndex - z-index for the style
	 */
	constructor(options) {

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
            textAlign: "end",
            overflow: true,
            stroke: new Stroke({color: "#ffffff".toRgba(1.0), width: 3}),
            fill: new Fill({color: "#000000".toRgba(1.0)}),
            padding: [10, 10, 10, 10]
        };

        let mergedStrokeOpts = Object.assign({}, STROKE_DEFAULTS, strokeOpts);
        let mergedFillOpts = Object.assign({}, FILL_DEFAULTS, fillOpts);

        super({            
            stroke: new Stroke(Object.assign({}, STROKE_DEFAULTS, {color: options.outline, width: options.outlineWidth})),
            fill: new Fill(Object.assign({}, FILL_DEFAULTS, {color: options.fill})),
            text: new Text({
// TODO
            }),
            zIndex: 
        });

        this._options = Object.assign({}, SENSOR_DEFAULTS, options);
        
        /* Set directives for legend rendering */
        this._legendOptions = {
            method: "unclassified",
            geometryType: "polygon"
        };
    }

    get legendOptions() {
        return(this._legendOptions);
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
    centroidLabelled = (strokeOpts, fillOpts, textOpts, zIndex = Infinity) => {
       return((feature, res) => {
            return(new Style({
                stroke: new Stroke(mergedStrokeOpts),
                fill: new Fill(mergedFillOpts),
                text: new Text(Object.assign({}, TEXT_DEFAULTS, {
                    text: feature.get(textOpts.labelAttr || "name")
                })),                
                zIndex: zIndex
            }));
       });
    }

};

