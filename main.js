import Map from "ol/Map";
import View from "ol/View";
import LayerGroup from "ol/layer/Group";
import {fromLonLat} from "ol/proj";
import MousePosition from "ol/control/MousePosition";
import ScaleLine from "ol/control/ScaleLine";
import Zoom from "ol/control/Zoom";
import Select from "ol/interaction/Select";
import {pointerMove, singleClick} from "ol/events/condition";

import * as utils from "./src/utilities/String";
import * as geoconst from "./src/utilities/GeoConstants";
import * as layerspec from "./src/LayerSetup";
import LayerSwitcher from "./src/control/LayerSwitcher";
import Legend from "./src/control/Legend";
import OpacitySlider from "./src/control/OpacitySlider";
import SourceMetadata from "./src/control/SourceMetadata";

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
                layerspec.SENSORS('Air Quality', 'NO2', 500, true, "car-alt"),
                layerspec.SENSORS('Air Quality', 'PM2.5', 501, false, "smog"), 
                layerspec.SENSORS('Air Quality', 'PM10', 502, false, "smog")
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

    /* Map hover interactions */
    let hoverSelect = new Select({
        condition: pointerMove,
        multi: true,
        layers: lyr => lyr.hoverInteractive === true,
        style: feat => {
            let layer = feat.get("layer");
            return(layer ? layer.hoverStyle(feat, map.getView().getResolution()) : null);            
        }
    });
    map.addInteraction(hoverSelect);

    /* Map click interactions */
    let clickSelect = new Select({
        condition: singleClick,
        multi: true,
        layers: lyr => lyr.clickInteractive === true,
        style: feat => {
            let layer = feat.get("layer");
            return(layer ? layer.clickStyle(feat, map.getView().getResolution()) : null);    
        }
    });
    map.addInteraction(clickSelect);
        	
}
