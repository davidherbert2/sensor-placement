/**
 * @module LayerSwitcher
 */
 
import {fromLonLat} from "ol/proj";
import Control from "ol/control/Control";
import LayerGroup from "ol/layer/Group";
import TileWMS from "ol/source/TileWMS";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import * as geoconst from "../utilities/GeoConstants";
import Legend from "./Legend";
import OpacitySlider from "./OpacitySlider";
import SourceMetadata from "./SourceMetadata";

/** 
 * @classdesc Class for a more fully-functional layer switcher
 */
export default class LayerSwitcher extends Control {

	/**
	 * Create layer tree switcher
     * Possible options:
     *  - element  HTMLElement        - container element
     *  - target   HTMLElement|string - (id of) target if required outside of map viewport
     *  - layers   Array              - list of layer groups/layers (nesting > 1 level not supported)
     *  - controls Array              - list of ol sub-controls belonging to this switcher
     *  - controlStackBl Array        - [left, bottom] offset (in em units) into the map of control stack bottom-left corner
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

        /**
         * Unpack custom options
         * 
         * Controls can be:
         * - info     => SourceMetadata
         * - legend   => Legend
         * - opacity  => OpacitySlider
         * Zoom to layer is included in basic switcher functionality 
         */      
        this.controls = options.controls || [];
        this.controlStackBl = options.controlStackBl || [1, 7];

        this._layers = options.layers || [];

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
                    this.controls.map(c => c.hide());
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
     * Initialisation required once control added to map
     */
    init() {
        this.getMap() && this._setLayerVisibilityControlStatus(this.getMap().getView().getResolution());
        this.getMap() && this.getMap().getView().on("change:resolution", evt => this._setLayerVisibilityControlStatus(evt.oldValue));
    }

    /**
     * Callback for map resolution change - disable the visibility toggle for out-of-range layers
     * @param {float} resolution - the new map resolution 
     */
    _setLayerVisibilityControlStatus(resolution) {
        for (let layerDiv of this.element.querySelectorAll("div[id^='entry-']")) {
            let layerId = layerDiv.getAttribute("id").replace(/^entry-/, "");
            let layer = this._layerMapping[layerId];
            let anchor = layerDiv.querySelector("a");
            if (layer && anchor) {
                /* Check the viewability of the layer w.r.t current map resolution supplied */
                let inRange = this._layerInRange(layer, resolution);
                anchor.classList.toggle("disabled", inRange);
                anchor.querySelector("div.general-element").classList.toggle("layer-disabled", inRange);
                anchor.querySelector("div.icon-wrapper").classList.toggle("layer-disabled", inRange);
            }
        }
    }

    /**
     * Is given layer in range, given a resolution (or current map resolution)
     * @param {ol.Layer} layer  
     * @param {float} [resolution = null] - resolution
     */
    _layerInRange(layer, resolution = null) {
        resolution = resolution || this.getMap().getView().getResolution();
        return(resolution < layer.getMinResolution() || resolution > layer.getMaxResolution());
    }

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
        return(this._layers.find(layer => layer instanceof LayerGroup && layer.get("switcherOpts") && layer.get("switcherOpts")["base"] === true));                           
    }

    /**
     * Decide which base layer, if any, is to be the one displayed - return null if no base layers defined
     */
    _initialVisibleBaseLayer() {
        let visBase = null;
        if (this._baseGroup != null) {
            let childLayers = this._baseGroup.getLayers().getArray();
            visBase = childLayers.find(cl => cl.get("visible"));            
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
        let layerId = String.prototype.uuid4();
        layer.set("id", layerId);
        this._layerMapping[layerId] = layer;

        /* Insert a row */
        let insertAt = this.element.querySelector(".box-row:last-child");
        let rowDiv = document.createElement("div");
        rowDiv.classList.add("box-row");
        rowDiv.setAttribute("id", `entry-${layerId}`);        
        !visible && rowDiv.classList.add("row-hidden");
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
        expanded && rowDiv.querySelector("div.left-cell").classList.add("group-opened");        
        
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
            this._addSwitcherToolAction(layer, toolsDiv, "info", SourceMetadata);          
            
            /* Add a legend handler */    
            this._addSwitcherToolAction(layer, toolsDiv, "legend", Legend);                  

            /* Add opacity change handler */
            this._addSwitcherToolAction(layer, toolsDiv, "opacity", OpacitySlider);
            
            /* Add zoom-to-layer-extent handler */
            toolsDiv.querySelector("a.tool-ztl").addEventListener("click", this._mapSizingFactory(layer));
        }
    }

    /**
     * Assign a click handler to a generic tool, assuming the corresponding sub-tool has been added to the map
     * @param {ol.Layer} layer            - the layer
     * @param {HTMLElement} toolsDiv      - div containing all the tools
     * @param {string} toolAnchorCss      - info|legend|opacity
     * @param {ol.ControlClass} toolClass - SourceMetadata|Legend|OpacitySlider
     */
    _addSwitcherToolAction(layer, toolsDiv, toolAnchorCss, toolClass) {
        toolsDiv.querySelector(`a.tool-${toolAnchorCss}`).addEventListener("click", evt => {
            let control = this.controls.find(c => c instanceof toolClass);            
            if (control != null) {
                !control.getMap() && control.setMap(this.getMap());
                typeof control.addActivationCallback === "function" && control.addActivationCallback(this._positionSubControls.bind(this));
                control.show(layer);
            } else {
                /* Disable the control */
                !anchor.classList.contains("disabled") && anchor.classList.add("disabled");
            }
        });
    }

    /**
     * When a sub-control's activation state changes, update the control stack to economise on space taken from the map
     * Any newly-activated control should go at the top of the stack
     * @param {ol.Control} changedCtrl
     */
    _positionSubControls(changedCtrl) {
        let stackBase = this.controlStackBl[1];
        for (let ctrl of this.controls) {
            if (ctrl.active && ctrl != changedCtrl) {
                ctrl.setVerticalPos(`${stackBase}em`);
                stackBase += Math.ceil(ctrl.getHeight()/16.0 + 1.0);
            }            
        }
        changedCtrl.active && changedCtrl.setVerticalPos(`${stackBase}em`);
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
                            lyrDiv && lyrDiv.classList.toggle("row-hidden");                        
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
            if (toolsDiv) {
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
     * Return a source and feature type for the given layer
     * @param {ol.Layer} layer 
     * @return {Array}
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