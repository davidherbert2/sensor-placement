/**
 * @module UrbanObservatorySensorStyle
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
export default class UrbanObservatorySensorStyle extends Style {

    /**
	 * Style constructor 
	 * @param {Object} options - options passed directly to base class constructor
     * Options can be:
     *  - color1 {string} - colour, default 'red'
     *  - color2 {string} - alternate colour, default 'white'
     *  - baseRadius {float} - radius of the centre of the dartboard, default 2
     *  - multiplier {float} - symbol size multiplier, default 1
     *  - zIndex - z-index for the style
	 */
	constructor(options) {

        const SENSOR_DEFAULTS = {
            color1: "#ff0000",
            color2: "#ffffff", 
            baseRadius: 2,
            multiplier: 1.0, 
            zIndex: Infinity
        };

        super({});

        this._options = Object.assign({}, SENSOR_DEFAULTS, options);
        
        /* Set directives for legend rendering */
        this._legendOptions = {
            method: "unclassified",
            geometryType: "point"
        };
    }

    get legendOptions() {
        return(this._legendOptions);
    }

     /**
     * Return the style function for the sensor points    
     * @param {boolean} options - anything from the above
     */
    sensorDartboard(options) { 

        options = Object.assign({}, this._options, options);

        return((feature, res) => {

            let styles = [];
    
            let	clusterFeats = feature.get("features");
            let size = clusterFeats ? clusterFeats.length : 1;
            let symbolRadius = options.multiplier * Math.min(10, options.baseRadius + 2 + Math.floor(size / 5));

            cacheKey = `${size}-${options.color1}-${options.color2}-${symbolRadius}-${options.multiplier}`;
    
            if (!_styleCache[cacheKey]) {   

                let col1 = options.color1.toRgba(1.0), col2 = options.color2.toRgba(0.5), transp = options.color1.toRgba(0.0);
                
                for (let i = 0; i < 5; i++) {
                    styles.push(new Style({
                        image: new CircleStyle({
                            radius: symbolRadius + 2 * i,
                            fill: new Fill({color: i == 0 ? col1 : transp}),
                            stroke: new Stroke({color: i % 2 == 0 ? col2 : col1, width: 2})
                        }),
                        zIndex: options.zIndex
                    }));   
                }                
                if (size > 1) {
                    styles.push(new Style({
                        text: new Text({
                            text: size.toString(),
                            offsetY: 1,
                            font: "bold 12px sans-serif",
                            stroke: new Stroke({color: col1, width: 4}),
                            fill: new Fill({color: "#ffffff".toRgba(1.0)})
                        }),
                        zIndex: options.zIndex
                    }));                    
                }
                _styleCache[cacheKey] = styles;
            } else {
                styles = _styleCache[cacheKey];
            }
            return(styles);
        });
    }

    sensorExplode() {
        return((feature, res) => {
            return(new Style({
                image: new CircleStyle({
                    radius: 8,
                    stroke: new Stroke({color: "#ff0000", width: 1}),
                    fill: new Fill({color: "#ff0000"})
                }),
                stroke: new Stroke({color: "#ffffff", width: 1})
            }));
        });
    }

};

