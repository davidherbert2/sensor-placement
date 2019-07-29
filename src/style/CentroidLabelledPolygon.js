/**
 * @module CentroidLabelledPolygonStyle
 */
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";

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

        super({});

        this._options = {
            stroke: Object.assign({}, STROKE_DEFAULTS, {color: options.outline, width: options.outlineWidth}),
            fill: Object.assign({}, FILL_DEFAULTS, {color: options.fill}),
            text: Object.assign({}, TEXT_DEFAULTS),
            zIndex: options.zIndex || Infinity
        };
        
        /* Set directives for legend rendering */
        this._legendOptions = {
            method: "unclassified",
            geometryType: "polygon",
            /* Used to render a legend successfully if the default style is transparent, as for a layer made visible on hover */
            styleOverride: {
                stroke: this._options.stroke,
                fill: this._options.fill
            }
        };
    }

    get legendOptions() {
        return(this._legendOptions);
    }

    /**
     * Create the polygon style
     * @param {string} label - feature attribute to use for label
     * @param {boolean} visible - false for a completely transparent (i.e. invisible) style
     */
    centroidLabelled(label = null, visible = true) {
       return((feature, res) => {
            let style = new Style({
                stroke: new Stroke(visible ? this._options.stroke : {color: "#000000".toRgba(0.0)}),
                fill: new Fill(visible ? this._options.fill : {color: "#000000".toRgba(0.0)}),                            
                zIndex: this._options.zIndex
            });
            if (visible && label != null) {
                style.setText(new Text(Object.assign({}, this._options.text, {text: feature.get(label) || `No such attribute ${label}`})));    
            }
            return(style);
       });
    }

};

