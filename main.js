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

    /* Check in range of visibility and clear highlight if out of range */
    map.getView().on("change:resolution", evt => {
        map.getLayers().forEach(lyr => lyr.hoverInteractive === true && lyr.hideHover(evt.oldValue))
    });

    /* Map hover interactions */
    map.on("pointermove", evt => {
        if (!evt.dragging) {
            map.forEachFeatureAtPixel(map.getEventPixel(evt.originalEvent),
                (feat, layer) => layer != null && layer.hoverInteractive === true && layer.showHover(feat, map), 
                {layerFilter: layerCandidate => layerCandidate.hoverInteractive === true}
            );            
        }
    });

    /* Map click interactions */
    map.on("singleclick", evt => {
        map.forEachFeatureAtPixel(evt.pixel, 
            (feat, layer) => {
                if (layer != null && layer.clickInteractive === true) {
                    layer.showPopup(feat, evt.coordinate);
                    return(true);   /* Only respond to the first one, otherwise confusing */
                }
            }, 
            {layerFilter: layerCandidate => layerCandidate.clickInteractive === true}
        );       
    });
        	
}
