import Map from "ol/Map";
import View from "ol/View";
import LayerGroup from "ol/layer/Group";
import {METERS_PER_UNIT, fromLonLat} from "ol/proj";
import MousePosition from "ol/control/MousePosition";
import ScaleLine from "ol/control/ScaleLine";
import Zoom from "ol/control/Zoom";
import Select from "ol/interaction/Select";
import {pointerMove, singleClick} from "ol/events/condition";

import * as utils from "./src/utilities/String";
import * as layerspec from "./src/LayerSetup";
import LayerSwitcher from "./src/control/LayerSwitcher";
import Legend from "./src/control/Legend";
import OpacitySlider from "./src/control/OpacitySlider";
import SourceMetadata from "./src/control/SourceMetadata";

window.onload = () => {

    /**
     * Get the scale of the supplied map, optionally using a dpi value
     * @param {ol.Map} map 
     * @param {float} dpi 
     * @return {int}
     */
    mapScale = (map, dpi = 96) => {
        return(Math.ceil(map.getView().getResolution() * 
            METERS_PER_UNIT[map.getView().getProjection().getUnits()] * 
            39.37 *     /* Inches in one metre */
            dpi         /* Dots per inch */
        ));
    }

    /**
     * Lon/lat of USB
     */
    const NEWCASTLE_CENTROID = [-1.6253, 54.9736];

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
                layerspec.SENSORS('Air Quality', 'NO2', 500, true, "car-alt", "#993300"),
                layerspec.SENSORS('Air Quality', 'PM2.5', 501, false, "smog", "#404040"), 
                layerspec.SENSORS('Air Quality', 'PM10', 502, false, "smog", "#000000")
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
                layerspec.DISABILITY(),
                layerspec.ETHNICITY()
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
			center: fromLonLat(NEWCASTLE_CENTROID),
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
            new Zoom()                    
		]
    });

    /* Create a layer switcher */
    let switcher = new LayerSwitcher({
        layers: layers,
        controls: [
            new Legend(),
            new OpacitySlider(),
            new SourceMetadata()
        ]
    });
    map.addControl(switcher);
    switcher.init();

    /* Display map scale as a tooltip on the scale bar */
    let scaleBar = document.querySelector(".ol-scale-line");
    if (scaleBar) {
        scaleBar.setAttribute("title", `Map scale 1 : ${mapScale(map)}`);
        map.getView().on("change:resolution", () => {
            scaleBar.setAttribute("title", `Map scale 1 : ${mapScale(map)}`);
        });
    }
            
    /* Map hover interactions */
    let hoverSelect = new Select({
        condition: pointerMove,
        multi: true,
        layers: lyr => lyr.hoverInteractive === true,
        style: feat => {
            let style = null, layer = feat.get("layer");
            if (layer) {
                style = layer.hoverStyle(feat, map.getView().getResolution());
            }
            return(style);            
        }
    });
    map.addInteraction(hoverSelect);

    /* Map click interactions */
    let clickSelect = new Select({
        condition: singleClick,
        multi: true,
        layers: lyr => lyr.clickInteractive === true,
        style: feat => {
            console.log(feat);
            let style = null, layer = feat.get("layer");
            if (layer) {
                style = layer.clickStyle(feat, map.getView().getResolution());
            }
            return(style);    
        }
    });
    map.addInteraction(clickSelect);
        	
}
