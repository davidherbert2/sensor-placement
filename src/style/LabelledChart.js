/**
 * @module LabelledChartStyle
 */
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import {toContext} from "ol/render";
import Polygon from "ol/geom/Polygon";
import Chart from "ol-ext/style/Chart";

/* Local style cache for performance */
const _styleCache = {};

/** 
 * @classdesc Class to style pie/donut charts from feature data
 */
export default class LabelledChartStyle extends Style {

    /**
	 * Source constructor 
	 * @param {Object} options - options passed directly to base class constructor
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

        /* Merge in option defaults */
        let mergedOptions = Object.assign({}, CHART_DEFAULTS, options);

        super({});
        this.StyleFunction = this.percentageLabelledChart(mergedOptions);
        this.LegendFunction = this.drawLegend(mergedOptions).bind(this);        
    }

    /**
     * Return the style function for the percentage labelled chart
     * @param {Object} mergedOptions
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
    percentageLabelledChart(mergedOptions) { 
        return((feature, res) => {
    
            let styles = [];        
    
            let fid = feature.getId(), cacheKey = null;
            if (fid) {
                cacheKey = `${fid}-${res}-pclc${mergedOptions.labels ? "-labels" : ""}`;
            }
            if (!cacheKey || !_styleCache[cacheKey]) {
                
                /* Get data from feature */
                let data = mergedOptions.attrs.map(attr => isNaN(feature.get(attr)) ? 0 : parseFloat(feature.get(attr)));
    
                /* Get the sum of all the requisite data values */
                let sum = 0;
                if (!mergedOptions.totalAttr || !feature.get(mergedOptions.totalAttr)) {
                    data.forEach(item => sum += item);
                } else {
                    sum = isNaN(feature.get(mergedOptions.totalAttr)) ? 0 : parseFloat(feature.get(mergedOptions.totalAttr));
                }
    
                /* Compute the radius of the chart from the map resolution and the bounds given */
                let r0 = mergedOptions.minRadius, r1 = mergedOptions.maxRadius;
                let R0 = mergedOptions.minResolution, R1 = mergedOptions.maxResolution
                let radius = r1;
                if (r1 > r0) {
                    /* Judged to be a resolution-specific radius required */
                    try {
                        radius = Math.min(r1, Math.max(r0, r1 + (res - R0) * (r1 - r0) / (R0 - R1)));
                    } catch(e) {}                
                }
    
                if (mergedOptions.labels) {
                    radius *= mergedOptions.multiplier;
                }
                styles.push(new Style({                                        
                    image: new Chart({
                        type: mergedOptions.type,
                        radius: radius,
                        data: data,
                        rotateWithView: true,
                        colors: mergedOptions.colors,
                        stroke: new Stroke({
                            color: "black",
                            width: radius < 10 ? 1 : 2
                        })
                    }),
                    zIndex: mergedOptions.zIndex
                }));
                if (mergedOptions.labels) {
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
                                zIndex: mergedOptions.zIndex                       
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

    /**
     * Render a vector legend to the given canvas
     * @param {Object} mergedOptions 
     */
    drawLegend(mergedOptions) {
        let attrs = mergedOptions.attrs, colors = mergedOptions.colors;
        return((canvas) => {
            let swatchSize = 20, padding = 8;
            let colWidth = 90, rowHeight = swatchSize + 2 * padding;
            let w = canvas.scrollWidth, h = canvas.scrollHeight;        
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
            let context = canvas.getContext("2d");
            context.clearRect(0, 0, w, h);
            let vectorContext = toContext(context, {size: [w, h]});
            let ncols = Math.floor(w / colWidth);

            /* Get attributes and colours for rendering */
            for (row = 0, i = 0; row < Math.ceil(attrs.length / 2); row++) {
                for (col = 0; col < ncols; col++) {
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
        });        
    }

};

