/**
 * @module InteractiveVectorLayer
 */
import VectorLayer from "ol/layer/Vector";
import Cluster from "ol/source/Cluster";

/** 
 * @classdesc Class for Interactive (hover and/or click) Vector Layers
 */
export default class InteractiveVectorLayer extends VectorLayer {

	/**
	 * Create an interactive vector layer (optional hover and/or click interactions)
	 * @param {Object} [options={}]  - layer options, passed direct to the underlying layer
	 */
	constructor(options = {}) {

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
            clickStyle: null,

            /* Canvas legend renderer */
            legend: null
        };

        options = Object.assign(LAYER_DEFAULTS, options);

        let featureSource = options.source;
        if (options.cluster === true) {
            /* Use feature clustering */
			options.source = new Cluster({
				distance: 20, 					
				source: featureSource,
				wrapX: false
			});
        }
        
        super(options);
        
        /* Get the source we actually add features to, not the top-level cluster */
        this._featureSource = featureSource;

        /* Add a layer back-pointer to every feature */
        this._featureSource.on("addfeature", evt => evt.feature.set("layer", this));
        
        this._hoverStyle = options.hoverStyle;
        this._clickStyle = options.clickStyle;
        this._legendOptions = options.legendOptions || {method: "unclassified"};
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

    get legendOptions() {
        return(this._legendOptions);
    }

}