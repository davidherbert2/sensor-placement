/**
 * @module Legend
 */

/** 
 * @classdesc Class to render a layer legend
 */
export default class Legend extends Control {

	/**
	 * Create layer legend control
     * Possible options:
     *  - element HTMLElement        - container element
     *  - target  HTMLElement|string - (id of) target if required outside of map viewport
	 * @param {Object} options - options passed directly to base class constructor
	 */
	constructor(options) {

        /* Create the element div */
        let element = document.createElement("div");
        element.className = "ol-legend-control ol-unselectable ol-control";

        super({
            element: element,
            target: options.target
        });
    }

    render(layer) {
        
    }

    /**
     * Return a function to flash a legend for the given layer in a div.layer-legend
     * @param {ol.Layer} layer 
     */
    // _legendFactory(layer) {
    //     let source = featureType = null;
    //     [source, featureType] = this._sourceFeature(layer);
    //     let glg = `${geoconst.GEOSERVER_WMS}?request=GetLegendGraphic&version=1.3.0&format=image/png&width=30&height=30&layer=${featureType}`;
    //     return((evt) => {
    //         let legendDiv = document.querySelector("ol-layer-legend");            
    //         let legendHeaderDiv = null;
    //         let legendBodyDiv = null;    
    //         if (legendDiv) {
    //             legendDiv.style.display = "block";
    //             if (legendDiv.children.length != 0) {
    //                 legendHeaderDiv = legendDiv.children[0];
    //                 legendBodyDiv = legendDiv.children[1];
    //             } else {
    //                 legendHeaderDiv = document.createElement("div");
    //                 legendHeaderDiv.classList.add(`${this._legendDivCls}-head`);
    //                 legendDiv.appendChild(legendHeaderDiv);
    //                 legendBodyDiv = document.createElement("div");
    //                 legendBodyDiv.classList.add(`${this._legendDivCls}-body`);                    
    //                 legendDiv.appendChild(legendBodyDiv);
    //             }                                
    //             legendHeaderDiv.innerHTML = layer.get("legendAnnotation") || "Legend";
    //             legendBodyDiv.innerHTML = `<img src="${glg}" alt="legend"/>`;
    //         }
    //     });
        
    // };

}