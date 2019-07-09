/**
 * @module OpacitySlider
 */

import Control from "ol/control/Control";

/** 
 * @classdesc Class to render an opacity change slider for a layer
 */
export default class OpacitySlider extends Control {

	/**
	 * Create layer opacity slider control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = "ol-opacity-slider-control ol-unselectable ol-control";

        super({
            element: element,
            target: options.target
        });

        /* Record of the layer opacity slider is shown for */
        this._layer = null;

        /* Create header and body */
        this._opacityHeaderDiv = document.createElement("div");
        this._opacityHeaderDiv.classList.add("opacity-header");
        this._opacityHeaderDiv.innerHTML = `
            <div></div><div><a href="JavaScript:void(0)"><i class="fa fa-times"></i></a></div>
        `;
        this.element.appendChild(this._opacityHeaderDiv);
        this._opacityBodyDiv = document.createElement("div");
        this._opacityBodyDiv.classList.add("opacity-body");  
        this._opacityBodyDiv.innerHTML = `
            <div style="float:right;width:20px;text-align:bottom;padding-left:4px;background-color:white;color:black">
                <i class="fa fa-circle-o"></i>
            </div>
            <div style="float:left;width:20px;text-align:bottom;padding-right:4px;background-color:white;color:black">
                <i class="fa fa-circle"></i>
            </div>
            <div style="margin:0 20px">
                <input type="range"></input>
            </div>
        `;                  
        this.element.appendChild(this._opacityBodyDiv);

        /* Close button handler */
        this._opacityHeaderDiv.querySelector("a").addEventListener("click", this.hide.bind(this));
    }

    /**
     * Show opacity slider for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {        
        if (!this.element.classList.contains("active")) {
            this.element.classList.add("active");
        }        
        this._opacityHeaderDiv.querySelector("div:first-child").innerHTML = `Change opacity for ${layer.get("title")}`;
        this._layer = layer;           
    }

    /**
     * Hide the opacity slider
     */
    hide() {
        if (this.element.classList.contains("active")) {
            this.element.classList.remove("active");
        } 
        this._layer = null; 
    }   

    get layer() {
        return(this._layer);
    }
    
}