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
		this._appendTo = appendTo;		
		this._overlay = null;
		this._popupDiv = null;		
	}
	
	get overlay() {
		return(this._overlay);
	}
	
	show(coordinate, content = "Loading...") {
		
		if (this._popupDiv == null) {
			/* Lazily create the div for the popup */
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
			
			let elt = (typeof this._appendTo == "string") ? document.querySelector(this._appendTo) : this._appendTo;				
			elt.appendChild(this._popupDiv);
		}
		
		if (this._overlay == null) {
			/* Lazily create the overlay */
			this._overlay = new Overlay({
				element: this._popupDiv,
				autoPan: true,
				autoPanAnimation: {
					duration: 250
				}
			});	
		}
		
		this._popupDiv.children[1].innerHTML = content;
		this._overlay.setPosition(coordinate);
	}
	
	hide() {
		if (this._overlay) {
			this._overlay.setPosition(undefined);
		}
	}

}