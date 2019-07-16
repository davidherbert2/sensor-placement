/**
 * @module OpacitySlider
 */

import SwitcherSubControl from "./base/SwitcherSubControl";

/** 
 * @classdesc Class to render an opacity change slider for a layer
 */
export default class OpacitySlider extends SwitcherSubControl {

	/**
	 * Create layer opacity slider control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} [options = {}]- options passed directly to base class constructor
	 */
	constructor(options = {}) {

        /* Create the element div */
        let element = document.createElement("div");

        super({
            element: element,
            elementClass: "ol-opacity-slider-control",
            target: options.target,
            headerClass: "opacity-header",
            bodyClass: "opacity-body"
        });
        
        this._bodyDiv.innerHTML = `
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
        this._rangeSlider = this._bodyDiv.querySelector("input[type='range']");
    }

    /**
     * Show opacity slider for the given layer
     * @param {ol.Layer} layer 
     */
    show(layer) {        
        if (!this.element.classList.contains("active")) {
            /* Activate the control */
            this.element.classList.add("active");
            this.set("active", true);
        } else {
            /* Already active control to receive new content */
            this.set("contentChanged", true);
        }
        let titleDiv = this._headerDiv.querySelector("div:first-child");
        let caption = `Change opacity for ${layer.get("title")}`;
        titleDiv.setAttribute("title", caption);
        titleDiv.innerHTML = caption;
        this._positioningCallback();
        this._rangeSlider.value = layer.getOpacity();
        /* See https://www.impressivewebs.com/onchange-vs-oninput-for-range-sliders/ for explanation of why 'input' is used rather than 'change' */
        this._inputListener = this._opacityInputHandlerFactory(layer);
        this._rangeSlider.addEventListener("input", this._inputListener);
        this._layer = layer;                      
    }
    
    _opacityInputHandlerFactory(layer) {
        return(evt => {
            layer.setOpacity(this._rangeSlider.value);
        });
    }
                                                      
}