/**
 * @module Common
 */

import TileWMS from "ol/source/TileWMS"
import Cluster from "ol/source/Cluster";

 /**
  * Find a control 
  * @param {ol.Map} olMap 
  */
export const findControl = (olMap, ctrlCls) => {
    let ctrl = null;
    if (olMap) {
        olMap.getControls().forEach((c) => {
            if (c instanceof ctrlCls) {
                ctrl = c;
            }
        });
    }
    return(ctrl);
}

/**
 * Return feature source and feature type for a layer
 * @param {ol.Layer} layer 
 * @return {Array} source, feature type
 */
export const sourceFeature = (layer)=> {
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
    return([source, featureType]);
}