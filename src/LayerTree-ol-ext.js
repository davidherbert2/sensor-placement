/**
 * @module LayerTree
 */
 
import {fromLonLat} from "ol/proj";
import TileWMS from "ol/source/TileWMS"
import Cluster from "ol/source/Cluster";
import * as geoconst from "./GeoConstants.js";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";

/** 
 * @classdesc Class for a more fully-functional layer tree switcher
 */
export default class LayerTree extends LayerSwitcher {

	/**
	 * Create layer tree switcher
	 * @param {Object} switcherOpts - options passed directly to base class constructor
     * @param {Object} functionOpts - other custom options
	 */
	constructor(
        switcherOpts = {
            reordering: false,
            show_progress: false,
            mouseover: false  	/* Show switcher on mouseover */
        }, 
        functionOpts = {
            legendDivCls: "layer-legend"
        }) 
    {
        super(switcherOpts);

        /* Unpack custom options */
        this._legendDivCls = functionOpts.legendDivCls;

        /** 
         * List of tips for buttons - internationalisation purposes
         */
        LayerSwitcher.prototype.tip = {
            up: "Re-order layers in stack",
            down: "Re-order layers in stack",
            info: "Layer legend and metadata",
            extent: "Zoom to layer extent",
            trash: "Remove layer",
            plus: "Open/close group"
        };
    }

    /**
     * Assign the layer button handlers
     * @param {ol.Map} map 
     */
    assignHandlers(map) {
        this.on("drawlist", (evt) => {		
            let btnDiv = evt.li.querySelector(".ol-layerswitcher-buttons");
            let layer = evt.layer;
            /* Turn on any click/hover handlers */
            if (typeof layer.assignHandlers == "function") {
                layer.assignHandlers(map);
            }
            /* Whether to display an opacity slider */
            if (!layer.get("layerOpacity") !== true) {
                let opacitySlider = btnDiv.querySelector(".layerswitcher-opacity");
                if (opacitySlider) {
                    opacitySlider.style.display = "none";
                }
            }
            /* Whether to display the zoom to extent control */
            if (layer.get("layerExtent") === true) {
                let newBtn = document.createElement("div");
                newBtn.setAttribute("title", this.tip.extent);
                newBtn.classList.add("layerExtent");
                btnDiv.appendChild(newBtn);
                if (layer.getVisible()) {
                    newBtn.addEventListener("click", this.mapSizingFactory(map, layer, geoconst.NEWCASTLE_CENTRE_3857));
                } else {
                    newBtn.classList.add("layerExtent-disabled");
                }					
            }
            /* Whether to display the info (legend) button */
            if (layer.get("layerInfo") === true) {
                let newBtn = document.createElement("div");
                newBtn.setAttribute("title", this.tip.info);
                newBtn.classList.add(["layerInfo"]);
                btnDiv.appendChild(newBtn); 
                newBtn.addEventListener("mouseover", this.legendFactory(layer));			
                newBtn.addEventListener("mouseout", evt => {
                    let legendDiv = document.querySelector(`div.${this._legendDivCls}`);
                    if (legendDiv) {
                        legendDiv.style.display = "none";
                    }
                });
            }
            /* Layer group visibility controls */
            let cb = btnDiv.querySelector("input");
            console.log(btnDiv);
            console.log(cb);
            if (cb) {
                if (layer instanceof LayerGroup) {
                    /* Enable all layers on/off */
                    console.log("Layer group");
                    cb.addEventListener("change", evt => {
                        let isChecked = evt.currentTarget.checked;
                        console.log(`Listener, checked ${isChecked}`);
                        layer.getLayers().forEach(lyr => {
                            lyr.setVisible(isChecked);
                        });
                    });
                }
            }
            
        });
    };

    /**
     * Return feature source and feature type for a layer
     * @param {ol.Layer} layer 
     * @return {Array} source, feature type
     */
    sourceFeature(layer) {
        let source = layer.getSource();
        let featureType = null;
        if (source instanceof TileWMS) {
            /* Tile WMS layer */
            featureType = source.getParams()["layers"];
        } else {
            if (source instanceof Cluster) {
                /* Cluster layer */
                source = source.getSource();
            } 
            /* Vectors here */
            try {
                let url = source.getUrl();
                if (url) {
                    let qry = new URLSearchParams(url.substring(url.indexOf("?") + 1));
                    featureType = qry.get("typename");		
                }		
            } catch(e) {			
            }		
        }
        return([source, featureType]);
    };

    /**
     * Return a function to flash a legend for the given layer in a div.layer-legend
     * @param {ol.Layer} layer 
     */
    legendFactory(layer) {
        let source = featureType = null;
        [source, featureType] = this.sourceFeature(layer);
        let glg = `${geoconst.GEOSERVER_WMS}?request=GetLegendGraphic&version=1.3.0&format=image/png&width=30&height=30&layer=${featureType}`;
        return((evt) => {
            let legendDiv = document.querySelector(`div.${this._legendDivCls}`);
            let legendHeaderDiv = null;
            let legendBodyDiv = null;    
            if (legendDiv) {
                legendDiv.style.display = "block";
                if (legendDiv.children.length != 0) {
                    legendHeaderDiv = legendDiv.children[0];
                    legendBodyDiv = legendDiv.children[1];
                } else {
                    legendHeaderDiv = document.createElement("div");
                    legendHeaderDiv.classList.add(`${this._legendDivCls}-head`);
                    legendDiv.appendChild(legendHeaderDiv);
                    legendBodyDiv = document.createElement("div");
                    legendBodyDiv.classList.add(`${this._legendDivCls}-body`);                    
                    legendDiv.appendChild(legendBodyDiv);
                }                                
                legendHeaderDiv.innerHTML = layer.get("legendAnnotation") || "Legend";
                legendBodyDiv.innerHTML = `<img src="${glg}" alt="legend"/>`;
            }
        });
        
    };
    
    /**
     * Return a function to resize the map according to the extent of the supplied layer
     * @param {ol.Map} map 
     * @param {ol.Layer} layer 
     * @param {ol.Extent} defaultExtent in EPSG:3857
     */
    mapSizingFactory(map, layer, defaultExtent) {
        let source = featureType = null;
        [source, featureType] = this.sourceFeature(layer);
        return((evt) => {
            if (featureType) {
                /* Call Geoserver REST API to get layer extent */
                let nonNsFeatureType = featureType.split(":").pop();
                fetch(`${geoconst.GEOSERVER_REST}/featuretypes/${nonNsFeatureType}.json`)
                .then(r => r.json())
                .then(jsonResponse => {
                    let nbbox = jsonResponse["featureType"]["latLonBoundingBox"];
                    let extent = defaultExtent;
                    if (nbbox) {
                        /* Reproject the bounding box from lat/lon to Spherical Mercator */
                        extent = [fromLonLat([nbbox.minx, nbbox.miny]), fromLonLat([nbbox.maxx, nbbox.maxy])].flat();
                    }
                    return(map.getView().fit(extent, {
                        size: map.getSize(),
                        nearest: true,
                        padding: [20, 20, 20, 20]
                    }));
                })
                .catch(error => {
                    console.log(error);
                    alert("Failed to get metadata for layer");
                });		
            } else if (source && source instanceof VectorSource) {
                /* Extent from features if possible */
                return(map.getView().fit(source.getExtent(), {
                    size: map.getSize(),
                    nearest: true,
                    padding: [20, 20, 20, 20]
                }));
            }
        });
    };

}