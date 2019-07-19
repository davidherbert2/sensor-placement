/**
 * @module SensorMapSetup
 */

import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS"

import * as geoconst from "./utilities/GeoConstants";
import * as uoloaders from "./featureloaders/UrbanObservatory";
import * as wfsloaders from "./featureloaders/GeoserverWfs";
import * as pointstyles from "./stylefunctions/PointStyles";
import * as polygonstyles from "./stylefunctions/PolygonStyles";
import InteractiveVectorLayer from "./layer/InteractiveVectorLayer";

/**
 * Individual layer definitions
 * OpenStreetMap layer
 */
export const OPENSTREETMAP = () => {
	return(new TileLayer({
        title: "OpenStreetMap",
        type: "base",
        opacity: 0.7,
        zIndex: 1,
        switcherOpts: {
            icon: "literal:OSM",
            attribution: "© OpenStreetMap contributors"
        },		
		source: new OSM()
	}));
};

/**
 * LA layer
 */
const LA_COL = "#7a4419"
const LA_OPACITY = 0.5
const LA_FEATURE = "siss:tyne_and_wear_la"
const LA_ZINDEX = 100
export const LA = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Local Authority areas", 
			visible: false,
			minResolution: 10,
            extent: geoconst.NEWCASTLE_CENTRE_3857,            
			switcherOpts: {
                icon: "literal:LA",
                feature: LA_FEATURE,
                opacity: false
            },
			style: polygonstyles.invisible(LA_ZINDEX),				
            hoverStyle: polygonstyles.centroidLabelled(
                {color: LA_COL.toRgba(1.0), width: 2}, 
                {color: LA_COL.toRgba(LA_OPACITY)},
                {labelAttr: "name"},
                LA_ZINDEX
            )
        }, 
        {
            loader: wfsloaders.getFeatureLoader(LA_FEATURE)
        }
	));
};

/**
 * LSOA layer
 */
const LSOA_COL = "#63535b"
const LSOA_OPACITY = 0.5
const LSOA_FEATURE = "siss:tyne_and_wear_lsoa"
const LSOA_ZINDEX = 110
export const LSOA = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Lower Super Output Areas", 
			visible: false,
			minResolution: 2,
			maxResolution: 20,
            extent: geoconst.NEWCASTLE_CENTRE_3857,            
			switcherOpts: {
                icon: "literal:LSOA",
                feature: LSOA_FEATURE,
                opacity: false
            },
			style: polygonstyles.invisible(LSOA_ZINDEX),
            hoverStyle: polygonstyles.centroidLabelled(
                {color: LSOA_COL.toRgba(1.0), width: 2}, 
                {color: LSOA_COL.toRgba(LSOA_OPACITY)},
                {labelAttr: "name"},
                LSOA_ZINDEX
            )
		},
        {
            loader: wfsloaders.getFeatureLoader(LSOA_FEATURE)
        }		
	));
};

/**
 * OA layer
 */
const OA_COL = "#400406"
const OA_OPACITY = 0.5
const OA_FEATURE = "siss:tyne_and_wear_oa"
const OA_ZINDEX = 120
export const OA = () => {
	return(new InteractiveVectorLayer(
		{ 
			title: "Output Areas", 
			visible: false,
			maxResolution: 10,
            extent: geoconst.NEWCASTLE_CENTRE_3857,            
            opacity: OA_OPACITY,
			switcherOpts: {
                icon: "literal:OA",
                feature: OA_FEATURE,
                opacity: false
            },
			style: polygonstyles.invisible(OA_ZINDEX),
            hoverStyle: polygonstyles.centroidLabelled(
                {color: OA_COL.toRgba(1.0), width: 2}, 
                {color: OA_COL.toRgba(OA_OPACITY)},
                {labelAttr: "code"},
                LSOA_ZINDEX
            )
		},
        {
            loader: wfsloaders.getFeatureLoader(OA_FEATURE)
        }		
	));
};

/**
 * IMD layer
 */
export const IMD = () => {
	return(new TileLayer({
		title: "Index of Multiple Deprivation",
        visible: false,
        zIndex: 10,
		switcherOpts: {
            icon: "minus",
            legend: "IMD Decile"
        },
		opacity: 0.6,
		source: new TileWMS({
			url: geoconst.GEOSERVER_WMS,
			params: {
				layers: "siss:imd_2015_by_lsoa",
				serverType: "geoserver",
				wrapX: false
			}
		})
	}));
};

/**
 * Disability layer
 */
export const DISABILITY = () => {
	return(new TileLayer({
		title: "Day-to-day disability limited (%)",
        visible: false,
        zIndex: 11,
		switcherOpts: {
            icon: "wheelchair",
            legend: "% of disabled with day-to-day limitations"
        },
		opacity: 0.6,
		source: new TileWMS({
			url: geoconst.GEOSERVER_WMS,
			params: {
				layers: "siss:disability_2015_by_lsoa",
				serverType: "geoserver",
				wrapX: false
			}
		})
	}));
};

/**
 * Ethnicity layer
 */
const ETHNICITY_FEATURE = "siss:tyne_and_wear_ethnicity_summary"
const ETHNICITY_ZINDEX = 200
const ETHNICITY_DATA_OPTS = {
    attrs: ["white", "asian", "black", "mixed", "other"],
    colors: ["cornsilk", "brown", "black", "goldenrod", "gray"],
    totalAttr: "total_residents"
}
export const ETHNICITY = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Ethnic composition", 
			visible: false,
			minResolution: 2,
			maxResolution: 20,
            extent: geoconst.NEWCASTLE_CENTRE_3857,
            zIndex: ETHNICITY_ZINDEX,
			switcherOpts: {
                icon: "users",
                feature: ETHNICITY_FEATURE
            },
            style: pointstyles.percentageLabelledChart(
                {labels: false}, 
                ETHNICITY_DATA_OPTS,
                ETHNICITY_ZINDEX 
            ),
            clickStyle: pointstyles.percentageLabelledChart(
                {labels: true}, 
                ETHNICITY_DATA_OPTS,
                ETHNICITY_ZINDEX 
            )
		},
        {
            loader: wfsloaders.getFeatureLoader(ETHNICITY_FEATURE)
        }
	));
};

/**
 * Sensor layer
 */
export const SENSORS = (theme , sensorType, zIndex, visible = false, icon = "question") => {
	return(new InteractiveVectorLayer(
		{
			title: `${sensorType} sensors`,
			cluster: true,
            visible: visible,
            zIndex: zIndex,		
            switcherOpts: {
                icon: icon,
                legend: `${theme} ${sensorType} sensors`,
                attribution: "Current sensor locations for NU Urban Observatory"
            },			
			style: (feature) => {
				let	clusterFeats = feature.get("features");
				let size = clusterFeats ? clusterFeats.length : 1;
                let styles = [];
                styles.push(new Style({
					image: new CircleStyle({
						radius: 4,
						fill: new Fill({color: "brown"}),
						stroke: new Stroke({color: "brown", width: 2, opacity: 0.5})
					})
                }));
                styles.push(new Style({
					image: new CircleStyle({
						radius: 8,
						fill: new Fill({opacity: 0}),
						stroke: new Stroke({color: "brown", width: 2})
					})
                }));                
				if (size > 1) {
					style.setText(new Text({
						text: size.toString(),
						fill: new Fill({color: "#ff0000"})
					}));
				}
				return(style);
			}
		},
		{
            loader: uoloaders.sensorLocationsByTheme(theme, sensorType),
        }));
};