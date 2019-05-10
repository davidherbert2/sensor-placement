/**
 * @module DropDownListFromUrl
 */
import DropDownList from "./DropDownList.js";

/** 
 * @classdesc Class for HTML drop-down list populatd from a URL returning a JSON object array 
 */
export default class DropDownListFromUrl extends DropDownList {		

    /**
	 * Create a custom HTML drop-down list with options populated from a web service at 'url'
	 * @param {Object} element - the DOM element to append the new drop-down to
	 * @param {string} url - URL data endpoint
	 * @param {string} [id=null] - id for the drop-down
	 * @param {string} [cls=null] - class list to apply to the drop-down
	 * @param {string} [label=""] - text label for the drop-down
	 * @param {boolean} [horizontal=false] - label beside field (true) or above (false)
	 */
    constructor (element, url, id = null, cls = null, label = "", horizontal = false) {		
		super(element, id, cls, label, horizontal);
		this._url = url;
    }
	
	/**
	 * Populate drop-down from JSON object array retrieved from web endpoint
	 * @param {Object} parms - key/value pairs to add to URL as query string
	 * @param {string} arrname - JSON key of the array name containing data objects
	 * @param {string} [defval=""] - default value for the drop-down
	 * @param {string} [sortby=Name] - which object key to sort the values by
	 * @param {string} [sortdir=ascending] - sort direction ascending|descending
	 * @param {string} [prompt=Please select] - default prompt inviting selection
	 */
	populate(parms, arrname, defval = "", sortby = "Name", sortdir = "ascending", prompt = "Please select") {
		const PROXY = "http://localhost:8000/cgi-bin/uo_wrapper.py";
		let fetchUrl = this._url;
		if (typeof parms == "object") {
			let queryString = Object.keys(parms).map(key => key + "=" + parms[key]).join("&");
			fetchUrl = fetchUrl + "?" + queryString;
		}
		fetch(PROXY + "?url=" + encodeURIComponent(fetchUrl))
			.then(r => r.json())
			.then(data => {
				let dataArr = data[arrname];
				dataArr.sort((a, b) => (sortdir == "ascending" ? (a[sortby] > b[sortby] ? 1 : -1) : (a[sortby] < b[sortby] ? 1 : -1)));
				this.empty();
				this._dd.appendChild(this.createOption(prompt, prompt, false));
				dataArr.forEach((elt, idx) => {
					let optVal = elt[sortby];
					this._dd.appendChild(this.createOption(optVal, optVal, optVal.value == defval));
				});
			})
			.catch(error => console.log(error));
	}
	
}
