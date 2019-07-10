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

        /* If control is active */
        this.set("active", false);

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
            <div class="endstop right">
                <i class="fa fa-circle-o"></i>
            </div>
            <div class="endstop left">
                <i class="fa fa-circle"></i>
            </div>
            <div class="range-slider">
                <input type="range" min="0.0" max="1.0" step="0.1"></input>
            </div>
        `;                  
        this.element.appendChild(this._opacityBodyDiv);

        this._rangeSlider = this._opacityBodyDiv.querySelector("input[type='range']");

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
        this._rangeSlider.value = layer.getOpacity();
        /* See https://www.impressivewebs.com/onchange-vs-oninput-for-range-sliders/ for explanation of why 'input' is used rather than 'change' */
        this._inputListener = this._opacityInputHandlerFactory(layer);
        this._rangeSlider.addEventListener("input", this._inputListener);
        this._layer = layer; 
        this.set("active", true);          
    }

    /**
     * Hide the opacity slider
     */
    hide() {
        if (this.element.classList.contains("active")) {
            this.element.classList.remove("active");
        } 
        this._rangeSlider.removeEventListener("input", this.__inputListener);
        this._inputListener = null;
        this._layer = null; 
        this.set("active", false);
    }   

    get layer() {
        return(this._layer);
    }

    get active() {
        return(this.get("active"));
    }

    getHeight() {
        let boundingRect = this.element.getBoundingClientRect();
        return(boundingRect.height);
    }

    setVerticalPos(pos) {
        this.element.style.bottom = pos;
    }

    addActivationCallback(cb) {
        this.on("propertychange", evt => {
            if (evt.key === "active") {
                cb();
            }
        });
    }

    _opacityInputHandlerFactory(layer) {
        return(evt => {
            layer.setOpacity(this._rangeSlider.value);
        });
    }
                                                      
}