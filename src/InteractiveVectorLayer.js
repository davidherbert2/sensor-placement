/**
 * @module InteractiveVectorLayer
 */
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Cluster from "ol/source/Cluster";
import FeatureClusterPopover from "./FeatureClusterPopover.js";
 
/** 
 * @classdesc Class for Interactive (hover and/or click) Vector Layers
 */
export default class InteractiveVectorLayer extends VectorLayer {

	/**
	 * Create a generalised map popover overlay
	 * @param {Object} ]layerOpts={type: "overlay", cluster: false, visible: false}] - layer options, passed direct to the underlying layer
	 * @param {Object} [sourceOpts={wrapX: false}] - vector source options, passed to the underlying vector source
	 * @param {Object} [hoverOpts={}] - options for map hovers
	 * @param {Object} [clickOpts={}] - options for map clicks
	 */
	constructor(layerOpts = {type: "overlay", cluster: false, visible: false}, sourceOpts = {wrapX: false}, hoverOpts = {}, clickOpts = {}) {
		this._featureSource = new VectorSource(sourceOpts);
		let source = this._featureSource;
		if (cluster) {
			source = new Cluster({
				distance: 20, 					
				source: this._featureSource,
				wrapX: false
			});
		}
		super(Object.assign({source}, layerOpts));
		
		this._hoverOverlay = null;
		this._highlight = null;
		this._hoverInteract = hoverOpts.keys.length > 0;
		if (this._hoverInteract) {
			/**
			 * Possible options:
			 * - style - the style to be applied hovering over a feature
			 */
			this._hoverOverlay = new VectorLayer({
				source: new VectorSource(),				
				style: hoverOpts.style
			});
		}
		
		this._popup = null;
		this._clickInteract = clickOpts.keys.length > 0;
		if (this._clickInteract) {
			/**
			 * Possible options:
			 * - ordering - array of human-friendly attribute names defining the attribute order in a pop-up
			 * - translation - object mapping human-friendly attribute names (keys) with the actual ones (values)
			 * - nameattr - name of the naming attribute, used to disambiguate when we have a cluster
			 */
			this._popup = new FeatureClusterPopover("body", clickOpts.ordering, clickOpts.translation, clickOpts.nameattr);
		}
	}
	
	/**
	 * Assign this layer's interactions to the given map
	 * @param {Map} map - OpenLayers map
	 */
	assignHandlers(map) {
		
		if (this._hoverInteract) {
			/* Add handler for mouseover/pointermove interaction on layer */
			this._hoverOverlay.setMap(map);
			map.on("pointermove", evt => {
				if (evt.dragging) {
				  return;
				}
				let pixel = map.getEventPixel(evt.originalEvent);
				let features = map.getFeaturesAtPixel(pixel, {
					layerFilter: layerCandidate => {
						return(layerCandidate == this);
					}
				});
				let feature = (features && features.length == 0) ? null : features[0];
				if (feature && feature !== this._highlight) {
					if (this._highlight) {
						this._hoverOverlay.getSource().removeFeature(this._highlight);
					}
					this._hoverOverlay.getSource().addFeature(feature);
					this._highlight = feature;
				}
			});
		}
		
		if (this._clickInteract) {
			/* Add popup overlay and add click handler to the chain */
			map.addOverlay(this._popup.overlay);
			map.on("singleclick", evt => {
				let hits = map.getFeaturesAtPixel(evt.pixel, {
					layerFilter: layerCandidate => {
						return(layerCandidate == this);
					}
				});
				if (hits && hits.length > 0) {
					this._popup.show(evt.coordinate, hits[0]);	
				}
			});
		}
	}

}