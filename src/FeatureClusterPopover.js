/**
 * @module FeatureClusterPopover
 */
import MapPopover from "./MapPopover.js";

/** 
 * @classdesc Class for Map popovers containing tabulated feature attributes
 */
export default class FeatureClusterPopover extends MapPopover {

	/**
	 * Create a generalised map popover overlay
	 * @param [Object|string=body] - element to append the overlay to
	 * @param {Array|string} [ordering=[]] - human-friendly attribute names in output order, or 'alpha' to sort attribute keys alphabetically
	 * @param {Object} [translation={}] - mapping of human-friendly output names (keys) to actual attribute names (values)
	 * @param {string} [nameAttr=Name] - name of the identifying attribute for cluster members, usually a name
	 */
	constructor(appendTo = "body", ordering = [], translation = {}, name = "Name") {
		super(appendTo);
		this._ordering = ordering;
		this._translation = translation;
		this._name = name;
	}
	
	show(coordinate, feature) {
		super.show(coordinate, this._formatPopupContent(feature, this._name));
	}
	
	/**
	 * Format tabular content for feature attribute data
	 * @param {Object} feature - the single feature with attributes to output (NOT a cluster)
	 * @param {int} [dp=4] - number of decimal places for floating point numbers
	 * @return {string}
	 */
	_formatFeature(feature, dp = 4) {
		if (!feature) {
			return("");
		}
		if (this._ordering.length == 0) {
			/* Attributes will be listed in key order i.e. random */
			this._ordering = Object.keys(feature.getProperties());
		} else if (this._ordering === "alpha") {
			/* Sort the attribute keys alphabetically */
			this._ordering = sort(Object.keys(feature.getProperties()));
		}
		let rows = [];
		for (let attrName of this._ordering) {
			let key = attrName in this._translation ? this._translation[attrName] : attrName;
			let value = feature.get(key);
			if (typeof value == "number" && !Number.isInteger(value)) {
				value = value.toFixed(dp);
			}
			rows.push(`<tr><td>${attrName}</td><td>${value}</td></tr>`);
		}
		return(`<table class="table is-striped is-hoverable is-fullwidth">${rows.join("")}</table>`);
	}
		
	/**
	 * Create the popup content from feature cluster
	 * @param {Object} feature - the feature with attributes to output (which may be a cluster)
	 * @return {string}
	 */
	_formatPopupContent(feature, nameAttr = "Name") {
		let content = "Nothing clicked";
		let attrs = {};
		if (feature) {
			let feats = feature.get("features");
			if (!feats) {
				/* This is a single feature */
				content = this._formatFeature(feature);
			} else {
				/* Cluster */
				if (feats.length == 1) {
					/* Single feature so whole attribute set */
					content = this._formatFeature(feats[0]);
				} else {
					/* Brief summary of what's here */
					let rows = [];
					for (let i = 0; i < feats.length; i++) {
						rows.push(`<tr><td>${i+1}</td><td>${feats[i].get(this._name)}</td></tr>`);
					}
					console.log(rows);
					content = `Zoom in to view ${feats.length} sensors<table class="table is-striped is-hoverable is-fullwidth">${rows.join("")}</table>`;
				}
			}										
		}
		return(content);
	}		

}