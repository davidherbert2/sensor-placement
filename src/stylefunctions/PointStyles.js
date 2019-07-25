/**
 * @module PointStyles
 */

import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import CircleStyle from "ol/style/Circle";
import Chart from "ol-ext/style/Chart";

/* Local style cache for performance */
const styleCache = {};

/**
 * Draw a sensor/sensor cluster as a dartboard of the supplied colour
 * Radius of the dartboard proportional to the number of sensors in a cluster
 * @param {string} color - as #rrggbb
 * @param {boolean} expanded 
 * @param {int} zIndex
 */
export const sensorDartboard = (color = "#ff0000", expanded = false, zIndex = Infinity) => {
    return((feature, res) => {

        let styles = [];

        let	clusterFeats = feature.get("features");
        let size = clusterFeats ? clusterFeats.length : 1;
        cacheKey = `${size}-${color}-dartboard-${expanded ? "exp" : "unexp"}`;

        if (!styleCache[cacheKey]) {
            
            let baseRadius = 2;
            if (size > 1 && size <= 10) {
                baseRadius = 4;
            } else if (size > 10 && size <= 20) {
                baseRadius = 6;
            } else if (size > 20 && size <= 30) {
                baseRadius = 8;
            } else if (size > 30) {
                baseRadius = 10;
            }
            if (expanded) {
                baseRadius *= 1.2;
            }

            let col1 = color.toRgba(1.0);
            let col2 = "#ffffff".toRgba(0.5);    
            
            styles.push(new Style({
                image: new CircleStyle({
                    radius: baseRadius,
                    fill: new Fill({color: col1}),
                    stroke: new Stroke({color: "#ffffff".toRgba(0.5), width: 2})
                }),
                zIndex: zIndex
            }));                        
            styles.push(new Style({
                image: new CircleStyle({
                    radius: baseRadius + 2,
                    fill: new Fill({color: color.toRgba(0.0)}),
                    stroke: new Stroke({color: col1, width: 2})
                }),
                zIndex: zIndex
            }));   
            styles.push(new Style({
                image: new CircleStyle({
                    radius: baseRadius + 4,
                    fill: new Fill({color: color.toRgba(0.0)}),
                    stroke: new Stroke({color: col2, width: 2})
                }),
                zIndex: zIndex
            }));   
            styles.push(new Style({
                image: new CircleStyle({
                    radius: baseRadius + 6,
                    fill: new Fill({color: color.toRgba(0.0)}),
                    stroke: new Stroke({color: col1, width: 2})
                }),
                zIndex: zIndex
            }));      
            styles.push(new Style({
                image: new CircleStyle({
                    radius: baseRadius + 8,
                    fill: new Fill({color: color.toRgba(0.0)}),
                    stroke: new Stroke({color: col2, width: 2})
                })
            }));                        
            if (size > 1) {
                styles.push(new Style({
                    text: new Text({
                        text: size.toString(),
                        offsetY: 1,
                        font: "bold 12px sans-serif",
                        stroke: new Stroke({color: col1, width: 4}),
                        fill: new Fill({color: "#ffffff".toRgba(1.0)})
                    }),
                    zIndex: zIndex
                }));                    
            }
            styleCache[cacheKey] = styles;
        } else {
            styles = styleCache[cacheKey];
        }
        return(styles);
    });
}
