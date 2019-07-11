import Map from "ol/Map";
import View from "ol/View";
import LayerGroup from "ol/layer/Group";
import {fromLonLat} from "ol/proj";
import MousePosition from "ol/control/MousePosition";
import ScaleLine from "ol/control/ScaleLine";
import Zoom from "ol/control/Zoom";

import * as utils from "./src/utilities/String";
import * as geoconst from "./src/utilities/GeoConstants";
import * as layerspec from "./src/LayerSetup";
import LayerSwitcher from "./src/controls/LayerSwitcher";
import Legend from "./src/controls/Legend";
import OpacitySlider from "./src/controls/OpacitySlider";
import SourceMetadata from "./src/controls/SourceMetadata";

window.onload = () => {

    /**
     * List of map layers/groups
     */
    let layers = [        	               
        new LayerGroup({
            title: "Urban Observatory",
            switcherOpts: {
                expanded: true,
                icon: "satellite-dish"
            },
            layers: [
                layerspec.SENSORS('Air Quality', 'NO2', 200, true, "car-alt"),
                layerspec.SENSORS('Air Quality', 'PM2.5', 201, false, "smog"), 
                layerspec.SENSORS('Air Quality', 'PM10', 202, false, "smog")
            ]
        }),
        new LayerGroup({
            title: "Boundaries",
            switcherOpts: {
                expanded: false,
                icon: "draw-polygon"
            },
            layers: [
                layerspec.LA(),
                layerspec.LSOA(), 
                layerspec.OA()
            ]
        }),	
        new LayerGroup({
            title: "Office of National Statistics",
            switcherOpts: {
                expanded: false,
                icon: "user"
            },
            layers: [
                layerspec.IMD(), 
                layerspec.DISABILITY()
            ]
        }), 
        new LayerGroup({
            title: "Base maps",
            switcherOpts: {
                expanded: false,
                icon: "map",
                base: true
            },
            layers: [layerspec.OPENSTREETMAP()]
        })		
    ];

	/**
	 * Create the map
	 */
	let map = new Map({
		target: "map",
		layers: layers,
		view: new View({
			center: fromLonLat(geoconst.NEWCASTLE_CENTROID),
            zoom: 12,
            minZoom: 10
		}),
		controls: [
			new MousePosition({
				projection: "EPSG:4326",
				coordinateFormat: (coord) => {
					return(`<strong>${coord[0].toFixed(4)},${coord[1].toFixed(4)}</strong>`);
				}
            }), 
            new ScaleLine({
                units: "metric"
            }),
            new Zoom(),
            new LayerSwitcher({
                layers: layers,
                controls: [
                    new Legend({}),
                    new OpacitySlider({}),
                    new SourceMetadata({})
                ]
            })            
		]
    });

    /* Check in range of visibility and clear highlight if out of range */
    map.getView().on("change:resolution", evt => {
        let res = evt.oldValue;
        map.getLayers().forEach(lyr => {
            if (lyr.hoverInteractive === true) {
                lyr.hideHover(res);
            }
        });        		
    });

    /* Map hover interactions */
    map.on("pointermove", evt => {
        if (!evt.dragging) {
            console.log("pointermove : not dragging");
            map.forEachFeatureAtPixel(map.getEventPixel(evt.originalEvent),
                (feat, layer) => {
                    console.log(layer);
                    if (layer != null && layer.hoverInteractive === true) {
                        console.log("about to show hover");
                        layer.showHover(feat);
                    }
                }, {
                    layerFilter: layerCandidate => {
                        console.log("layerFilter");
                        console.log(layerCandidate);
                        console.log(layerCandidate.hoverInteractive);
                        console.log("Done");
                        return(layerCandidate.hoverInteractive === true);
                    }
                }
            );            
        }
    });

    /* Map click interactions */
    map.on("singleclick", evt => {
        map.forEachFeatureAtPixel(evt.pixel, 
            (feat, layer) => {
                console.log(layer);
                if (layer != null && layer.clickInteractive === true) {
                    console.log("about to show popup");
                    layer.showPopup(feat);
                    return(true);   /* Only respond to the first one, otherwise confusing */
                }
            }, {
                layerFilter: layerCandidate => {
                    return(layerCandidate.clickInteractive === true);
                }
            }
        );       
    });

        	
}
