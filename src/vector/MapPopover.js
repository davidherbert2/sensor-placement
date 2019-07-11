/**
 * @module MapPopover
 */
 
import Overlay from "ol/Overlay";

/** 
 * @classdesc Class for generalised Map popovers
 */
export default class MapPopover {

	/**
	 * Create a generalised map popover overlay
	 * @param {Object} [appendTo=body] - element to append the overlay to
	 */
	constructor(appendTo = "body") {
		this._popupDiv = document.createElement("div");
		this._popupDiv.classList.add("ol-popup");
		
		/* Closer button */		
		let closer = document.createElement("a");
		closer.classList.add("ol-popup-closer");
		closer.setAttribute("href", "Javascript:void(0)");
		closer.onclick = () => {
			this._overlay.setPosition(undefined);
			closer.blur();
			return false;
		};
		this._popupDiv.appendChild(closer);
		
		/* Content area */
		let contentDiv = document.createElement("div");
		this._popupDiv.appendChild(contentDiv);	
		
		this._overlay = new Overlay({
			element: this._popupDiv,
			autoPan: true,
			autoPanAnimation: {
				duration: 250
			}
		});	
	}
	
	get overlay() {
		return(this._overlay);
	}
	
	show(coordinate, content = "Loading...") {		
		this._popupDiv.children[1].innerHTML = content;
		this._overlay.setPosition(coordinate);
	}
	
	hide() {
		this._overlay.setPosition(undefined);
	}

}