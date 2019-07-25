/**
 * @module SwitcherSubControl
 */

import Control from "ol/control/Control";
import TileWMS from "ol/source/TileWMS";
import Cluster from "ol/source/Cluster";
import GeoserverWFSSource from "../../source/GeoserverWFS";

/** 
 * @classdesc Class for custom controls belonging to a layer switcher 
 */
export default class SwitcherSubControl extends Control {	

    /**
	 * Create layer switcher sub-control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - elementClass  string       - class applied to base element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
     *  - headerClass   string       - class for control header
     *  - bodyClass     string       - class for control body
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = `${options.elementClass} ol-switcher-sub-control ol-unselectable ol-control`;

        super({
            element: element,
            target: options.target
        });

        /* If control is active */
        this.set("active", false);       

        /* Record of the oparational layer */
        this._layer = null;

        /* Callback for positioning the control in a stack */
        this._positioningCallback = () => {};

        /* Create header and body */
        this._headerDiv = document.createElement("div");
        if (options.headerClass) {
            this._headerDiv.classList.add(options.headerClass);
            this._headerDiv.classList.add("sub-control-header");
        }        
        this._headerDiv.innerHTML = `
            <div></div><div><a href="JavaScript:void(0)"><i class="fa fa-times"></i></a></div>
        `;
        this.element.appendChild(this._headerDiv);

        this._bodyDiv = document.createElement("div");
        if (options.bodyClass) {
            this._bodyDiv.classList.add(options.bodyClass);
            this._bodyDiv.classList.add("sub-control-body");
        }                             
        this.element.appendChild(this._bodyDiv);

        /* Close button handler */
        this._headerDiv.querySelector("a").addEventListener("click", this.hide.bind(this));
    }

    get active() {
        return(this.get("active"));
    }

    /**
     * Show the control for a layer (usually overridden in subclasses)
     * @param {ol.Layer} layer 
     */
    show(layer) {
        this.activate(layer);    
    }

    /**
     * Hide the control
     */
    hide() {
        this.deactivate();
    }  
    
    /**
     * Activate the control
     * @param {ol.Layer} layer 
     */
    activate(layer) {
        this.element.classList.add("active");
        this.set("active", true);
        this._layer = layer;
        this._positioningCallback();
    }

    /**
     * Deactivate the control
     */
    deactivate() {
        this.element.classList.remove("active");
        this.set("active", false);
        this._layer = null;         
        this._positioningCallback();
    }

    /**
     * Register the control stack updating callback, called whenever a control status/content changes
     * @param {function} cb 
     */
    registerPositioningCallback(cb) {
        this._positioningCallback = cb;
    }

    /**
     * Get the total height of the control
     * @return {int} the height
     */
    getHeight() {
        return(this.element.getBoundingClientRect()["height"]);
    }

    /**
     * Set the control title in the header and a tooltip attribute so the complete title is visible on hover
     * @param {string} title 
     */
    setTitle(title) {
        let titleDiv = this._headerDiv.querySelector("div:first-child");
        titleDiv.setAttribute("title", title);
        titleDiv.innerHTML = title;
    }

    /**
     * Position the control vertically in the switcher stack
     * @param {int} pos 
     */
    setVerticalPos(pos) {
        this.element.style.bottom = pos;
    }

    /**
     * Determine the feature type for a layer
     * @param {ol.Layer} layer 
     * @return {string}
     */
    _getFeature(layer) {
        return(this.constructor.getSourceFeature(layer));
    }

    static getSourceFeature(layer) {
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
                if (typeof url === "string") {
                    let qry = new URLSearchParams(url.substring(url.indexOf("?") + 1));
                    featureType = qry.get("typename");		
                } else if (source instanceof GeoserverWFSSource) {
                    /* Can get feature type from source */
                    featureType = source.get("featureType");
                }	
            } catch(e) {			
            }		
        }      
        return(featureType);
    }

}
