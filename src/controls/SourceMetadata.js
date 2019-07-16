/**
 * @module SourceMetadata
 */

import * as geoconst from "../utilities/GeoConstants";
import SwitcherSubControl from "./base/SwitcherSubControl";

/** 
 * @classdesc Class to render the source metadata for a layer
 */
export default class SourceMetadata extends SwitcherSubControl {

	/**
	 * Create source metadata attribution control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} [options = {}] - options passed directly to base class constructor
	 */
	constructor(options = {}) {

        /* Create the element div */
        let element = document.createElement("div");

        super({
            element: element,
            elementClass: "ol-source-metadata-control",
            target: options.target,
            headerClass: "metadata-header",
            bodyClass: "metadata-body"
        });
 
        this._bodyDiv.innerHTML = "Loading...";
    }

    /**
     * Show metadata for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {        
        if (!this.element.classList.contains("active")) {
            /* Activate the control */
            this.element.classList.add("active");
            this.set("active", true);         
        } else {
            /* Already active control to receive new content */
            console.log("Set contentChanged");
            this.set("contentChanged", true);
        }
        let titleDiv = this._headerDiv.querySelector("div:first-child"); 
        let caption = `Metadata for ${layer.get("title")}`;
        titleDiv.innerHTML = caption;
        titleDiv.setAttribute("title", caption);

        let so = layer.get("switcherOpts");
        if (so && typeof so.attribution === "string") {
            /* Canned attribution */
            this._bodyDiv.innerHTML = so.attribution;
            this._positioningCallback();
        } else {
            let featureType = this._getFeature(layer);
            if (featureType) {
                /* Call Geoserver REST API to get layer extent */
                let nonNsFeatureType = featureType.split(":").pop();
                fetch(`${geoconst.GEOSERVER_REST}/featuretypes/${nonNsFeatureType}.json`)
                .then(r => r.json())
                .then(jsonResponse => {
                    let abstract = jsonResponse["featureType"]["abstract"];
                    this._bodyDiv.innerHTML = abstract.linkify();
                    this._positioningCallback();
                })
                .catch(error => {
                    this._bodyDiv.innerHTML = `Failed to retrieve abstract for layer ${layer.get("title")} - JSON error`;
                    this._positioningCallback();
                    console.log(error);
                });		
            } else {
                this._bodyDiv.innerHTML = `No feature type defined for layer ${layer.get("title")}`;
                this._positioningCallback();
            }
        }
        this._layer = layer;          
    }
    
}