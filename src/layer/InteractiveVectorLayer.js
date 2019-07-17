/**
 * @module InteractiveVectorLayer
 */
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
 
/** 
 * @classdesc Class for Interactive (hover and/or click) Vector Layers
 */
export default class InteractiveVectorLayer extends VectorLayer {

	/**
	 * Create an interactive vector layer (optional hover and/or click interactions)
	 * @param {Object} ]layerOpts={type: "overlay", cluster: false, visible: false}] - layer options, passed direct to the underlying layer
	 * @param {Object} [sourceOpts={wrapX: false}] - vector source options, passed to the underlying vector source
	 * @param {Object} [hoverOpts={}] - options for map hovers
	 * @param {Object} [clickOpts={}] - options for map clicks
	 */
	constructor(layerOpts = {type: "overlay", cluster: false, visible: false}, sourceOpts = {wrapX: false}, hoverOpts = {}, clickOpts = {}) {

        super(layerOpts);
        
        this._featureSource = new VectorSource(sourceOpts);
		let source = this._featureSource;
		if (layerOpts.cluster === true) {
			source = new Cluster({
				distance: 20, 					
				source: this._featureSource,
				wrapX: false
			});
		}
        this.setSource(source);
        /* Add a layer back-pointer to every feature */
        this._featureSource.on("addfeature", evt => evt.feature.set("layer", this));
		
		this._hoverInteract = Object.keys(hoverOpts).length > 0;
		if (this._hoverInteract) {
			/**
			 * Possible options:
			 * - style - the style to be applied hovering over a feature
			 */
            this._hoverStyle = hoverOpts.style;
        }  
        
        this._clickInteract = Object.keys(clickOpts).length > 0;
        if (this._clickInteract) {
			/**
			 * Possible options:
			 * - style - the style to be applied single-clicking a feature
			 */
            this._clickStyle = clickOpts.style;
        }  
    }

    get featureSource() {
        return(this._featureSource);
    }
	
    get hoverInteractive() {
        return(this._hoverInteract);
    }

    get clickInteractive() {
        return(this._clickInteract);
    }

    get hoverStyle() {
        return(this._hoverStyle);
    }

    get clickStyle() {
        return(this._clickStyle);
    }

}