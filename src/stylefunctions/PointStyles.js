/**
 * @module PointStyles
 */

import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Chart from "ol-ext/style/Chart";

/* Local style cache for performance */
const styleCache = {};

/**
 * Draw an optionally labelled pie/donut chart at point
 * @param {Object} chartOpts 
 * - {string} type         - Chart type pie|donut (default "pie")
 * - {int} minRadius       - Minimum radius of the rendered chart (default 8)
 * - {int} maxRadius       - Maximum radius of the rendered chart (default 20)
 * - {float} minResolution - Minimum map resolution chart will be rendered at (default 2)
 * - {float} maxResolution - Maximum map resolution chart will be rendered at (default 20)
 * - {boolean} labels      - Do we want percentage labels?
 * - {float} multiplier    - How much bigger to make the chart when labels are shown (default 1.2)
 * @param {Object} dataOpts
 * - {Array} attrs         - Array of attribute names containing the data values
 * - {Array} colors        - Array of colour values corresponding to each attribute
 * - {string} totalAttr    - Name of the sum/total attribute, if any (default null, which sums the values automatically)
 * @param {int} zIndex
 */
export const percentageLabelledChart = (chartOpts, dataOpts, zIndex) => {

    const CHART_DEFAULTS = {
        type: "pie", 
        minRadius: 9, 
        maxRadius: 20,
        minResolution: 2, 
        maxResolution: 20,
        labels: true, 
        multiplier: 1.2
    };

    const DATA_DEFAULTS = {
        attrs: [],
        colors: [],
        totalAttr: null
    };

    /* Merge in option defaults */
    let mergedChartOpts = Object.assign({}, CHART_DEFAULTS, chartOpts);
    let mergedDataOpts = Object.assign({}, DATA_DEFAULTS, dataOpts);

    return((feature, res) => {

        let styles = [];        

        let cacheKey = `${feature.getId()}-${res}-pclc${mergedChartOpts.labels ? "-labels" : ""}`;
        if (!styleCache[cacheKey]) {
            
            /* Get data from feature */
            let data = mergedDataOpts.attrs.map(attr => isNaN(feature.get(attr)) ? 0 : parseFloat(feature.get(attr)));

            /* Get the sum of all the requisite data values */
            let sum = 0;
            if (!mergedDataOpts.totalAttr || !feature.get(mergedDataOpts.totalAttr)) {
                data.forEach(item => sum += item);
            } else {
                sum = isNaN(feature.get(mergedDataOpts.totalAttr)) ? 0 : parseFloat(feature.get(mergedDataOpts.totalAttr));
            }

            /* Compute the radius of the chart from the map resolution and the bounds given */
            let r0 = mergedChartOpts.minRadius, r1 = mergedChartOpts.maxRadius;
            let R0 = mergedChartOpts.minResolution, R1 = mergedChartOpts.maxResolution
            let radius = r1;
            if (r1 > r0) {
                /* Judged to be a resolution-specific radius required */
                try {
                    radius = Math.min(r1, Math.max(r0, r1 + (res - R0) * (r1 - r0) / (R0 - R1)));
                } catch(e) {}                
            }

            if (mergedChartOpts.labels) {
                radius *= mergedChartOpts.multiplier;
            }
            styles.push(new Style({                                        
                image: new Chart({
                    type: mergedChartOpts.type,
                    radius: radius,
                    data: data,
                    rotateWithView: true,
                    colors: mergedDataOpts.colors,
                    stroke: new Stroke({
                        color: "black",
                        width: radius < 10 ? 1 : 2
                    })
                }),
                zIndex: zIndex
            }));
            if (mergedChartOpts.labels) {
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
                            zIndex: zIndex                       
                        }));
                    }
                    arc += dataSlice;
                }
            }
            styleCache[cacheKey] = styles;
        } else {
            styles = styleCache[cacheKey];
        }
        return(styles);
    });
} 
