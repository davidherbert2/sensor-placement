/**
 * @module SourceMetadata
 */

import Control from "ol/control/Control";
import * as common from "./Common.js";
import * as geoconst from "../GeoConstants.js";

/** 
 * @classdesc Class to render the source metadata for a layer
 */
export default class SourceMetadata extends Control {

	/**
	 * Create source metadata attribution control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = "ol-source-metadata-control ol-unselectable ol-control";

        super({
            element: element,
            target: options.target
        });

        /* If control is active */
        this.active = false;

        /* Record of the layer source metadata is shown for */
        this._layer = null;

        /* Create header and body */
        this._metadataHeaderDiv = document.createElement("div");
        this._metadataHeaderDiv.classList.add("metadata-header");
        this._metadataHeaderDiv.innerHTML = `
            <div></div><div><a href="JavaScript:void(0)"><i class="fa fa-times"></i></a></div>
        `;
        this.element.appendChild(this._metadataHeaderDiv);
        this._metadataBodyDiv = document.createElement("div");
        this._metadataBodyDiv.classList.add("metadata-body");  
        this._metadataBodyDiv.innerHTML = "Loading...";
        this.element.appendChild(this._metadataBodyDiv);

        /* Close button handler */
        this._metadataHeaderDiv.querySelector("a").addEventListener("click", this.hide.bind(this));
    }

    /**
     * Show metadata for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {        
        if (!this.element.classList.contains("active")) {
            this.element.classList.add("active");
        }        
        this._metadataHeaderDiv.querySelector("div:first-child").innerHTML = `Metadata for ${layer.get("title")}`;
        [source, featureType] = common.sourceFeature(layer);
        if (featureType) {
            /* Call Geoserver REST API to get layer extent */
            let nonNsFeatureType = featureType.split(":").pop();
            fetch(`${geoconst.GEOSERVER_REST}/featuretypes/${nonNsFeatureType}.json`)
            .then(r => r.json())
            .then(jsonResponse => {
                let abstract = jsonResponse["featureType"]["abstract"];
                this._metadataBodyDiv.innerHTML = abstract.linkify();
            })
            .catch(error => {
                this._metadataBodyDiv.innerHTML = `Failed to retrieve abstract for layer ${layer.get("title")} - JSON error`;
                console.log(error);
            });		
        } else {
            this._metadataBodyDiv.innerHTML = `No feature type defined for layer ${layer.get("title")}`;
        }
        this._layer = layer;  
        this.active = true;         
    }

    /**
     * Hide metadata
     */
    hide() {
        if (this.element.classList.contains("active")) {
            this.element.classList.remove("active");
        } 
        this._layer = null; 
        this.active = false;
    }   

    get layer() {
        return(this._layer);
    }

    get active() {
        return(this.active);
    }
    
}