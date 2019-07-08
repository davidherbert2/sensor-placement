/**
 * @module LayerSwitcher
 */
 
import {fromLonLat} from "ol/proj";
import TileWMS from "ol/source/TileWMS"
import Cluster from "ol/source/Cluster";
import Control from "ol/control/Control";
import LayerGroup from "ol/layer/Group";
import VectorSource from "ol/source/Vector";
import * as geoconst from "../GeoConstants.js";
import * as utils from "../Utilities.js";

/** 
 * @classdesc Class for a more fully-functional layer switcher
 */
export default class LayerSwitcher extends Control {

	/**
	 * Create layer tree switcher
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
     *  - layers  Array              - list of layer groups/layers (nesting > 1 level not supported)
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = "ol-layerswitcher-control ol-unselectable ol-control";

        super({
            element: element,
            target: options.target
        });

        /* Unpack custom options */
        this._layers = options.layers;

        /* Layer mapping by id */
        this._layerMapping = {};

        /* Get the first expanded layer group, if any */
        this._expanded = this._initialExpandedGroup();

        /* Get the base layer group, if any */
        this._baseGroup = this._baseGroup();

        /* Get the first visible base layer, if any */
        this._visibleBase = this._initialVisibleBaseLayer();

        /* Create the switcher header and footer */
        this.element.innerHTML = `
            <div class="box-row">
                <a>
                    <div class="box-cell left-cell"></div>
                    <div class="box-cell right-cell header-element"></div>                    
                </a>
                <div class="box-cell"></div>
            </div>            
            <div class="box-row">
                <a class="tools-extension-button" title="Show layer tools...">
                    <div class="box-cell left-cell"></div>
                    <div class="box-cell right-cell footer-element">
                        <div class="icon-wrapper"><i class="fa fa-cog" style="vertical-align:bottom"></i></div>
                    </div>                    
                </a>
                <div class="box-cell"></div>
            </div>
        `;
        
        if (Array.isArray(this._layers)) {
            this._layers.forEach(layer => {
                this._insertRow(layer);                        
            });            
        }

        let teb = this.element.querySelector("a.tools-extension-button");
        if (teb) {
            teb.addEventListener("click", evt => {
                this.element.classList.toggle("show-tools");
                if (this.element.classList.contains("show-tools")) {
                    /* Button shows the 'minimise tools' option */
                    teb.setAttribute("title", "Hide layer tools...");
                    teb.querySelector("i").classList.remove("fa-cog");
                    teb.querySelector("i").classList.add("fa-angle-right");
                } else {
                    /* Button shows the 'show settings' icon */
                    teb.setAttribute("title", "Show layer tools...");
                    teb.querySelector("i").classList.remove("fa-angle-right");
                    teb.querySelector("i").classList.add("fa-cog");
                }
                this.element.querySelectorAll(".tools-extension-cell").forEach(tec => {
                    tec.classList.toggle("active");
                    /* Determine statuses of layer manipulation tools (some only available if layer is visible) */
                    let toolsDivId = tec.getAttribute("id").replace(/^tools-/, "");
                    let layer = this._layerMapping[toolsDivId];
                    if (layer) {
                        tec.querySelector("a.tool-opacity").classList.toggle("disabled", !layer.getVisible());
                        tec.querySelector("a.tool-ztl").classList.toggle("disabled", !layer.getVisible());
                    }
                })
            });
        }
    };

    /**
     * Decide which layer group to display expanded on initial render
     * Will be the first one with switcherOpts.expanded === true, the first layer group if none, or null if no layer groups exist
     * @return {ol.LayerGroup|null}
     */
    _initialExpandedGroup() {
        let expGroup = null;
        if (Array.isArray(this._layers)) {
            for (let layer of this._layers) {
                if (layer instanceof LayerGroup) {
                    let opts = layer.get("switcherOpts") || {};
                    if (opts.expanded === true) {
                        expGroup = layer;
                        break;
                    } else if (expGroup == null) {
                        expGroup = layer;
                    }
                }
            }                  
        }
        return(expGroup);
    }

    /**
     * Get the base layer group, if any
     */
    _baseGroup() {
        let baseGroup = null;
        if (Array.isArray(this._layers)) {
            for (let layer of this._layers) {
                if (layer instanceof LayerGroup) {
                    let opts = layer.get("switcherOpts") || {};
                    if (opts.base === true) {
                        baseGroup = layer;
                        break;
                    }                    
                }
            }                  
        }
        return(baseGroup);
    }

    /**
     * Decide which base layer, if any, is to be the one displayed - return null if no base layers defined
     */
    _initialVisibleBaseLayer() {
        let visBase = null;
        if (this._baseGroup != null) {
            let childLayers = this._baseGroup.getLayers().getArray();
            for (let childLayer of childLayers) {
                if (childLayer.get("visible")) {
                    visBase = childLayer;
                    break;
                }                
            }
            if (visBase == null) {
                visBase = childLayers[0];
            }
        }       
        return(visBase);
    }

    /**
     * Insert a switcher row for a layer/group into the DOM
     * @param {ol.Layer|ol.LayerGroup} layer - layer|group
     * @param {boolean} visible - if the row should be visible
     * @param {integer} level   - top-level = 1, second level = 2 NOTE: only 2 levels supported (more make little sense)
     */
    _insertRow(layer, visible = true, level = 1) {

        let title    = layer.get("title");        
        let type     = layer.get("type") || "overlay";
        let opts     = layer.get("switcherOpts") || {};
        let isGroup  = layer instanceof LayerGroup;
        let expanded = isGroup && layer == this._expanded;

        /* Assign layer/group a unique id */
        let layerId = utils.UUID4();
        layer.set("id", layerId);
        this._layerMapping[layerId] = layer;

        /* Insert a row */
        let insertAt = this.element.querySelector(".box-row:last-child");
        let rowDiv = document.createElement("div");
        rowDiv.classList.add("box-row");
        rowDiv.setAttribute("id", `entry-${layerId}`);        
        if (!visible) {
            rowDiv.classList.add("row-hidden");
        }
        this.element.insertBefore(rowDiv, insertAt);   

        /* Populate row */
        rowDiv.innerHTML = `
            <a class="level${level}" href="Javascript:void(0)" title="${title}">
                <div class="box-cell left-cell general-element">${title}</div>
                <div class="box-cell right-cell">
                    <div class="icon-wrapper">${this._getIconMarkup(opts.icon || "question")}</div>
                </div>                
            </a>
            <div id="tools-${layerId}" class="box-cell"></div>
           `;
        if (expanded) {
            rowDiv.querySelector("div.left-cell").classList.add("group-opened");
        }
        let anchor = rowDiv.querySelector("a");
            
        if (isGroup) {
            /* Create all child layer row markup */
            layer.getLayers().forEach((childLayer => {
                this._insertRow(childLayer, expanded, 2);
            }));
            anchor.addEventListener("click", this._toggleGroupStatesFactory(layer));
        } else {
            /* Create individual layer row markup */
            anchor.addEventListener("click", this._toggleLayerVisibilityFactory(layer, anchor));
            if ((type == "overlay" && layer.getVisible()) || (type == "base" && layer == this._visibleBase)) {
                /* Set visibility indicator class on row */
                anchor.querySelector("div.icon-wrapper").classList.add("layer-visible");
            }
            /* Create layer tools markup */
            let toolsDiv = rowDiv.querySelector("[id^='tools-']");
            toolsDiv.classList.add("tools-extension-cell");
            toolsDiv.innerHTML = `
                <a class="tool-info"><i class="fa fa-info-circle"></i></a>                
                <a class="tool-legend"><i class="fa fa-th-list"></i></a>
                <a class="tool-opacity"><i class="fa fa-adjust"></i></a>
                <a class="tool-ztl"><i class="fa fa-expand"></i></a>
                `;
            /* Add info (metadata/attribution) handler */
            toolsDiv.querySelector("a.tool-info").addEventListener("click", evt => {
                console.log(this.getMap());
            });
            /* Add opacity change handler */
            toolsDiv.querySelector("a.tool-opacity").addEventListener("click", evt => {
                console.log(this.getMap());
            });
            /* Add legend handler */
            toolsDiv.querySelector("a.tool-legend").addEventListener("click", this._legendFactory(layer));

            /* Add zoom-to-layer-extent handler */
            toolsDiv.querySelector("a.tool-ztl").addEventListener("click", this._mapSizingFactory(layer));

            console.log(layer);
        }
    }

    /**
     * Layer group click event handler factory
     * Click on a non-open group opens it and closes the existing opened one
     * Click on an already open group has no effect
     * @param {ol.LayerGroup} group
     */
    _toggleGroupStatesFactory(group) {        
        return(evt => {
            for (let grp of this._layers) {
                if (grp instanceof LayerGroup) {
                    let titleCell = this.element.querySelector(`div[id='entry-${grp.get("id")}'] div.left-cell`);
                    let grpOpen = titleCell.classList.contains("group-opened");
                    if (grpOpen != (grp == group)) {
                        /* Change open state */
                        grp.getLayers().forEach(lyr => {
                            let lyrDiv = this.element.querySelector(`div[id='entry-${lyr.get("id")}']`);
                            if (lyrDiv) {
                                lyrDiv.classList.toggle("row-hidden");                        
                            }
                        });
                        titleCell.classList.toggle("group-opened");
                    }                    
                }   
            }
        });        
    }

    /**
     * Layer visiblity toggle event handler
     * @param {ol.Layer} layer 
     * @param {HTMLElement} anchor
     */
    _toggleLayerVisibilityFactory(layer, anchor) {
        return(evt => {
            let type = layer.get("type") || "overlay";
            if (type == "overlay") {
                /* Toggle layer visibility and indicator */
                layer.setVisible(!layer.getVisible());
                anchor.querySelector("div.icon-wrapper").classList.toggle("layer-visible");
            } else if (type == "base" && !layer.getVisible()) {
                /* Toggle layer visibility and turn off all others in base group */
                this._baseGroup.getLayers().forEach(baseLayer => {
                    layer.setVisible(baseLayer == layer);                    
                    anchor.querySelector("div.icon-wrapper").classList.toggle("layer-visible");
                });
            }
            /* Update tools icon visibility */
            let toolsDiv = anchor.parentNode.querySelector("div.tools-extension-cell.active");
            if(toolsDiv) {
                toolsDiv.querySelector("a.tool-opacity").classList.toggle("disabled", !layer.getVisible());
                toolsDiv.querySelector("a.tool-ztl").classList.toggle("disabled", !layer.getVisible());
            }            
        })        
    }

    /**
     * Create the icon markup for a switcher entry
     * @param {string} icon - the fa icon name (without 'fa fa-'), or literal:<some_string> for a text literal
     * @return {string}
     */
    _getIconMarkup(icon) {
        return(icon.startsWith("literal:") 
            ? `<span class="icon-string" style="vertical-align:bottom">${icon.replace(/^literal:/, "")}</span>`
            : `<i class="fa fa-${icon}" style="vertical-align:bottom"></i>`
        );
    }

    /**
     * Return a function to resize the map according to the extent of the supplied layer
     * @param {ol.Layer} layer 
     */
    _mapSizingFactory(layer) {
        return((evt) => {
            if (layer.getVisible()) {
                [source, featureType] = this._sourceFeature(layer);
                if (featureType) {
                    /* Call Geoserver REST API to get layer extent */
                    let nonNsFeatureType = featureType.split(":").pop();
                    console.log(nonNsFeatureType);
                    fetch(`${geoconst.GEOSERVER_REST}/featuretypes/${nonNsFeatureType}.json`)
                    .then(r => r.json())
                    .then(jsonResponse => {
                        let nbbox = jsonResponse["featureType"]["latLonBoundingBox"];
                        let extent = null;
                        if (nbbox) {
                            /* Reproject the bounding box from lat/lon to Spherical Mercator */
                            extent = [fromLonLat([nbbox.minx, nbbox.miny]), fromLonLat([nbbox.maxx, nbbox.maxy])].flat();
                            this.getMap().getView().fit(extent, {
                                size: this.getMap().getSize(),
                                nearest: true,
                                padding: [20, 20, 20, 20]
                            });
                        }
                    })
                    .catch(error => {
                        console.log(error);
                        alert("Failed to get metadata for layer");
                    });		
                } else if (source && source instanceof VectorSource) {
                    /* Extent from features if possible */
                    this.getMap().getView().fit(source.getExtent(), {
                        size: this.getMap().getSize(),
                        nearest: true,
                        padding: [20, 20, 20, 20]
                    });
                }
            }            
        });
    }

    /**
     * Return feature source and feature type for a layer
     * @param {ol.Layer} layer 
     * @return {Array} source, feature type
     */
    _sourceFeature(layer) {
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
    }
    
}