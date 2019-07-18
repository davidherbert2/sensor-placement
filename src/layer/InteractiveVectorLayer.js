/**
 * @module InteractiveVectorLayer
 */
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import GeoJSON from "ol/format/GeoJSON"; 
import {bbox as bboxStrategy} from "ol/loadingstrategy"; 

/** 
 * @classdesc Class for Interactive (hover and/or click) Vector Layers
 */
export default class InteractiveVectorLayer extends VectorLayer {

	/**
	 * Create an interactive vector layer (optional hover and/or click interactions)
	 * @param {Object} [layerOpts={}]  - layer options, passed direct to the underlying layer
	 * @param {Object} [sourceOpts={}] - vector source options, passed to the underlying vector source
	 */
	constructor(layerOpts = {}, sourceOpts = {}) {

        /* Defaults for layer options */
        const LAYER_DEFAULTS = {

            /* Regular OL options */
            visible: true,
            opacity: 1.0,

            /* Local additions */
            type: "overlay",            
            cluster: false,

            /* Interaction types */            
            hoverStyle: null,
            clickStyle: null
        };

        /* Defaults for source options */
        const SOURCE_DEFAULTS = {

            /* Regular OL options */
            format: new GeoJSON(),
            strategy: bboxStrategy,
		    overlaps: false,
            wrapX: false,
        };
        
        super(Object.assign({}, LAYER_DEFAULTS, layerOpts));
        
        /* Create the vector source */
        this._featureSource = new VectorSource(Object.assign({}, SOURCE_DEFAULTS, sourceOpts));
		let source = this._featureSource;
		if (layerOpts.cluster === true) {
            /* Use feature clustering */
			source = new Cluster({
				distance: 20, 					
				source: this._featureSource,
				wrapX: false
			});
		}
        this.setSource(source);

        /* Add a layer back-pointer to every feature */
        this._featureSource.on("addfeature", evt => evt.feature.set("layer", this));
        
        this._hoverStyle = layerOpts.hoverStyle;
        this._clickStyle = layerOpts.clickStyle;
    }

    get featureSource() {
        return(this._featureSource);
    }
	
    get hoverInteractive() {
        return(this._hoverStyle != null);
    }

    get clickInteractive() {
        return(this._clickStyle != null);
    }

    get hoverStyle() {
        return(this._hoverStyle);
    }

    get clickStyle() {
        return(this._clickStyle);
    }

}