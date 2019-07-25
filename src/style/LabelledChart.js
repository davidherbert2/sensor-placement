/**
 * @module LabelledChartStyle
 */
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Chart from "ol-ext/style/Chart";

/* Local style cache for performance */
const _styleCache = {};

/** 
 * @classdesc Class to style pie/donut charts from feature data
 */
export default class LabelledChartStyle extends Style {

    /**
	 * Style constructor 
	 * @param {Object} options - options passed directly to base class constructor
     * Options can be:
     *  - type {string} - pie|donut
     *  - minRadius {float} - minimum radius for the chart
     *  - maxRadius {float} - maximum radius (if different to the above, implies that symbol will scale with resolution)
     *  - minResolution {float} - minimum map resolution for chart visibility
     *  - maxResolution {float} - maximum map resolution for chart visibility
     *  - labels {boolean} - whether to plot labels
     *  - multiplier {float} - symbol size multiplier for when labels are displayed
     *  - attrs {Array<string>} - list of feature attributes to use in the chart (must be int/float types)
     *  - colors {Array<string>} - list of colours (names or #rrggbb) corresponding to above attributes
     *  - totalAttr - the attribute representing the sum of all the relevant ones for charting, default null
     *  - zIndex - z-index for the style
	 */
	constructor(options) {

        const CHART_DEFAULTS = {
            type: "pie", 
            minRadius: 9, 
            maxRadius: 20,
            minResolution: 2, 
            maxResolution: 20,
            labels: true, 
            multiplier: 1.2,
            attrs: [],
            colors: [],
            totalAttr: null,
            zIndex: Infinity
        };

        super({});

        this._options = Object.assign({}, CHART_DEFAULTS, options);
        
        /* Set directives for legend rendering */
        this._legendOptions = {
            method: "classified",
            attributes: options.attrs,
            colors: options.colors
        };
    }

    get legendOptions() {
        return(this._legendOptions);
    }

    /**
     * Return the style function for the percentage labelled chart     
     * @param {boolean} options - anything from the above
     */
    percentageLabelledChart(options) { 

        options = Object.assign({}, this._options, options);

        return((feature, res) => {

            let styles = [];        
    
            let fid = feature.getId(), cacheKey = null;
            if (fid) {
                cacheKey = `${fid}-${res}-${options.labels === true ? "-labels" : ""}`;
            }
            if (!cacheKey || !_styleCache[cacheKey]) {
                
                /* Get data from feature */
                let data = options.attrs.map(attr => isNaN(feature.get(attr)) ? 0 : parseFloat(feature.get(attr)));
    
                /* Get the sum of all the requisite data values */
                let sum = 0;
                if (!options.totalAttr || !feature.get(options.totalAttr)) {
                    data.forEach(item => sum += item);
                } else {
                    sum = isNaN(feature.get(options.totalAttr)) ? 0 : parseFloat(feature.get(options.totalAttr));
                }
    
                /* Compute the radius of the chart from the map resolution and the bounds given */
                let r0 = options.minRadius, r1 = options.maxRadius;
                let R0 = options.minResolution, R1 = options.maxResolution
                let radius = r1;
                if (r1 > r0) {
                    /* Judged to be a resolution-specific radius required */
                    try {
                        radius = Math.min(r1, Math.max(r0, r1 + (res - R0) * (r1 - r0) / (R0 - R1)));
                    } catch(e) {}                
                }
    
                if (options.labels === true) {
                    radius *= options.multiplier;
                }
                styles.push(new Style({                                        
                    image: new Chart({
                        type: options.type,
                        radius: radius,
                        data: data,
                        rotateWithView: true,
                        colors: options.colors,
                        stroke: new Stroke({
                            color: "black",
                            width: radius < 10 ? 1 : 2
                        })
                    }),
                    zIndex: options.zIndex
                }));
                if (options.labels === true) {
                    /* Do the labelling */
                    let arc = 0;
                    for (let dataSlice of data) {
                        let angle = (2.0 * arc + dataSlice) / sum*Math.PI - Math.PI/2.0;
                        let pc = Math.round(dataSlice / sum * 1000.0);
                        if (pc > 100) {
                            /* Ignore anything < 10% as labels will inevitably conflict and be unreadable */
                            styles.push(new Style({
                                text: new Text({
                                    text: `${pc/10}%`,
                                    font: "14px sans-serif",
                                    offsetX: Math.cos(angle) * (radius + 6),
                                    offsetY: Math.sin(angle) * (radius + 6),
                                    textAlign: (angle < Math.PI/2.0 ? "left" : "right"),
                                    textBaseline: "middle",
                                    stroke: new Stroke({color: "#ffffff".toRgba(1.0), width: 3}),
                                    fill: new Fill({color: "#000000".toRgba(1.0)})
                                }),
                                zIndex: options.zIndex                       
                            }));
                        }
                        arc += dataSlice;
                    }
                }
                _styleCache[cacheKey] = styles;
            } else {
                styles = _styleCache[cacheKey];
            }
            return(styles);
        });
    } 

};

