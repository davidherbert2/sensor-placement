/**
 * @module SwitcherSubControl
 */

/** 
 * @classdesc Class for custom controls belonging to a layer switcher 
 */
export default class SwitcherSubControl extends Control {	

    /**
	 * Create layer switcher sub-control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - elementClass  string       - class applied to base element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
     *  - headerClass   string       - class for control header
     *  - bodyClass     string       - class for control body
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = `${options.elementClass} ol-unselectable ol-control`;

        super({
            element: element,
            target: options.target
        });

        /* If control is active */
        this.set("active", false);

        /* Record of the oparational layer */
        this._layer = null;

        /* Create header and body */
        this._headerDiv = document.createElement("div");
        if (options.headerClass) {
            this._headerDiv.classList.add(options.headerClass);
        }        
        this._headerDiv.innerHTML = `
            <div></div><div><a href="JavaScript:void(0)"><i class="fa fa-times"></i></a></div>
        `;
        this.element.appendChild(this._headerDiv);

        this._bodyDiv = document.createElement("div");
        if (options.bodyClass) {
            this._bodyDiv.classList.add(options.bodyClass);
        }                             
        this.element.appendChild(this._bodyDiv);

        /* Close button handler */
        this._headerDiv.querySelector("a").addEventListener("click", this.hide.bind(this));
    }

    /**
     * Show the control for a layer (usually overridden in subclasses)
     * @param {ol.Layer} layer 
     */
    show(layer) {
        this._layer = layer;
        this.set("active", true);        
    }

    /**
     * Hide the control
     */
    hide() {
        if (this.element.classList.contains("active")) {
            this.element.classList.remove("active");
        } 
        this._layer = null; 
        this.set("active", false);
    }   

    get layer() {
        return(this._layer);
    }

    get active() {
        return(this.get("active"));
    }

    addActivationCallback(cb) {
        this.on("propertychange", evt => {
            if (evt.key === "active") {
                cb(this);
            }
        });
    }

    getHeight() {
        let boundingRect = this.element.getBoundingClientRect();
        return(boundingRect.height);
    }

    setVerticalPos(pos) {
        this.element.style.bottom = pos;
    }

    /**
     * Determine the feature type for a layer
     * @param {ol.Layer} layer 
     * @return {string}
     */
    _getFeature(layer) {
        let source = layer.getSource();
        let featureType = null;
        if (source instanceof TileWMS) {
            /* Tile WMS layer */
            featureType = source.getParams()["layers"];
        } else {
            if (source instanceof Cluster) {
                /* Cluster layer */
                source = source.getSource();
            } 
            /* Vectors here */
            try {
                let url = source.getUrl();
                if (url) {
                    let qry = new URLSearchParams(url.substring(url.indexOf("?") + 1));
                    featureType = qry.get("typename");		
                }		
            } catch(e) {			
            }		
        }      
        return(featureType);
    }

}
