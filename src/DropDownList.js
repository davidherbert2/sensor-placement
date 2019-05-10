/**
 * @module DropDownList
 */
import CustomHtmlElement from "./CustomHtmlElement.js";

/** 
 * @classdesc Class for HTML drop-down lists 
 */
export default class DropDownList extends CustomHtmlElement {	

	/**
	 * Create a custom HTML drop-down list
	 * @param {Object} element - the DOM element to append the new drop-down to
	 * @param {string} [id=null] - id for the drop-down
	 * @param {Array} [cls=null] - class list to apply to the drop-down
	 * @param {string} [label=""] - text label for the drop-down
	 * @param {boolean} [horizontal=false] - label beside field (true) or above (false)
	 */
    constructor (element, id = null, cls = null, label = "", horizontal = false) {
		
		super(element, id, cls, label, horizontal);
		
		let ctrlDiv = this.fdiv.querySelector(".control");
		ctrlDiv.innerHTML = `
			<div class="select is-rounded">
				<select></select>
			</div>
			`;
		this._dd = ctrlDiv.querySelector("select");
		if (id) {
			this._dd.setAttribute("id", id);
		}
		if (Array.isArray(cls)) {
			this._dd.classList.add(cls);
		}		
		this._lb = this.fdiv.querySelector("label");
		this._lb.textContent = label;
    }
	
	/**
	 * Remove all the current options from the drop-down
	 */
    empty () {
        while(this._dd.firstChild) {
			this._dd.removeChild(this._dd.firstChild);
		}		
    }
	
	get dd() {
		return(this._dd);
	}
	
	get value() {
		return(this._dd.value);
	}
	
	/**
	 * Populate the drop-down list from the key/value pairs of the given object
	 * @param {Object} kvp - object containing <option_value>:<option_text> pairs
	 * @param {string} defval - default value
	 * @param {string} [sortby=null] - sort function alpha|numeric|null
	 * @param {string} [sortdir=ascending] - sort direction ascending|descending
	 * @param {string} [prompt=Please select] - default prompt inviting selection
	 */
	populate(kvp = {}, defval = "", sortby = null, sortdir = "ascending", prompt = "Please select") {
		this.empty();
		this._dd.appendChild(this.createOption(prompt, prompt, false));
		let keys = Object.keys(kvp);
		switch(sortby) {
			case "alpha":
				keys.sort();
				if (sortdir == "descending") {
					keys.reverse();
				}
				break;
			case "numeric":
				keys.sort((a, b) => { return(sortdir == "ascending" ? (a - b) : (b - a)) });
				break;
			default:
				break;
		}
		keys.forEach((key, idx) => {
			this._dd.appendChild(this.createOption(key, kvp[key], key == defval));
		});
	}
	
	/**
	 * Create an <option> tag from the data
	 * @param {string} value - the option value
	 * @param {string} text - the option text
	 * @param {boolean} [selected=false] - if selected
	 */
	createOption(value, text, selected = false) {
		let option = document.createElement("option");
		option.value = value;
		option.text = text;
		if (selected) {
			option.setAttribute("selected", "selected");
		}
		return(option);
	}
}
