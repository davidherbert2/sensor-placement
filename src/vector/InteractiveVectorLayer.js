/**
 * @module InteractiveVectorLayer
 */
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import FeatureClusterPopover from "./FeatureClusterPopover";
import { throws } from "assert";
 
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
		if (layerOpts.cluster) {
			source = new Cluster({
				distance: 20, 					
				source: this._featureSource,
				wrapX: false
			});
		}
        this.setSource(source);
		
		this._hoverOverlay = null;
		this._highlight = null;
		this._hoverInteract = Object.keys(hoverOpts).length > 0;
		if (this._hoverInteract) {
			/**
			 * Possible options:
			 * - style - the style to be applied hovering over a feature
			 */
			this._hoverOverlay = new VectorLayer({
				source: new VectorSource(),
				zIndex: this.getZIndex() + 1,				
                style: hoverOpts.style,
                activated: false
            });
            /* Remove overlay features when layer visibility changes */
            this.on("change:visible", evt => {
                this._hoverOverlay.getSource().clear();
                this._highlight = null;
            });
            /* Change opacity of hover layer if appropriate */
            this.on("change:opacity", evt => {                
                this._hoverOverlay.setOpacity(parseFloat(this.getOpacity()));
            });
        }        
		
		this._popup = null;
		this._clickInteract = Object.keys(clickOpts).length > 0;
		if (this._clickInteract) {
			/**
			 * Possible options:
			 * Possible options:
			 * - ordering - array of human-friendly attribute names defining the attribute order in a pop-up
			 * - translation - object mapping human-friendly attribute names (keys) with the actual ones (values)
			 * - nameattr - name of the naming attribute, used to disambiguate when we have a cluster
			 */
            this._popup = new FeatureClusterPopover("body", clickOpts.ordering, clickOpts.translation, clickOpts.nameattr);            
		}
	}
	
	get popup() {
		return(this._popup);
    }
    
    get hoverInteractive() {
        return(this._hoverInteract);
    }

    get clickInteractive() {
        return(this._clickInteract);
    }

    /**
     * Show hover overlay for given feature
     * @param {ol.Feature} feature 
     * @param {ol.Map} olMap
     */
    showHover(feature, olMap) {     
        if (this._hoverOverlay.get("activated") === false) {
            /* Add the hover overlay to the map's unmanaged layer stack */
            this._hoverOverlay.setMap(olMap);
            this._hoverOverlay.set("activated", true);
        }   
        if (feature && feature !== this._highlight) {            
            if (this._highlight) {
                this._hoverOverlay.getSource().removeFeature(this._highlight);
            }
            this._hoverOverlay.getSource().addFeature(feature);
            this._highlight = feature;
        }
    }

    /**
     * Clear all overlays when map resolution changes to 'resolution'
     * @param {float} resolution 
     */
    hideHover(resolution = null) {
        if (resolution == null || (resolution <= this.getMinResolution() || resolution >= this.getMaxResolution())) {
            this._hoverOverlay.getSource().clear();
            this._highlight = null;
        }
    }

    /**
     * Add popup overlay to the map
     * @param {ol.Feature} feature
     * @param {ol.Map}  olMap
     * @param {ol.coordinate} coord 
     */
    showPopup(feature, olMap, coord) {
        if (this._clickOverlay.getMap() == null) {
            this._clickOverlay.setMap(this.getMap());
        }
        this._popup.show(coord, feature);	
    }

    /**
     * Hide popup overlay
     */
    hidePopup() {
        this._popup.hide();
    }

}