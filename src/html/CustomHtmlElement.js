/**
 * @module CustomHtmlElement
 */

/** 
 * @classdesc Class for HTML custom elements 
 */
export default class CustomHtmlElement {	

	/**
	 * Create a custom HTML element
	 * @param {Object} element - the existing DOM element to append the new element to
	 * @param {string} [id=null] - id for the new element
	 * @param {Array} [cls=null] - class list to apply to the element
	 * @param {string} [label=""] - text label for the element
	 * @param {boolean} [horizontal=false] - label beside field (true) or above (false)
	 */
    constructor (element, id = null, cls = null, label = "", horizontal = false) {	
	
		let tpl = "";
		this._fdiv = document.createElement("div");
		
		this._fdiv.classList.add("field");		
		if (horizontal) {
			this._fdiv.classList.add("is-horizontal");
			this._fdiv.innerHTML = `
				<div class="field-label is-normal">
					<label class="label"></label>
				</div>
				<div class="field-body">
					<div class="control"></div>
				</div>			
				`;
		} else {
			this._fdiv.innerHTML = `
				<label class="label"></label>
				<div class="control"></div>
				`;
		}
		element.appendChild(this._fdiv);
		
		this._lb = this._fdiv.querySelector("label");
		this._lb.textContent = label;
    }
	
	get fdiv() {		
		return(this._fdiv);
	}
	
	show() {
		this._fdiv.classList.remove("is-hidden");
	}
	
	hide() {
		this._fdiv.classList.add("is-hidden");
	}
	
}
