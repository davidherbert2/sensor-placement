/**
 * @module SensorMapSetup
 */

import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import OSM from "ol/source/OSM";

import {GEOSERVER_WMS, NEWCASTLE_CENTRE_3857} from "./appconfig";
import * as polygonstyles from "./stylefunctions/PolygonStyles";
import LabelledChartStyle from "./style/LabelledChart";
import UrbanObservatorySensorStyle from "./style/UrbanObservatorySensor";
import GeoserverWFSSource from "./source/GeoserverWFS";
import UrbanObservatorySource from "./source/UrbanObservatory";
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
        switcherOpts: {icon: "literal:OSM", attribution: "© OpenStreetMap contributors"},		
		source: new OSM()
	}));
};

/**
 * LA layer
 */
const LA_COL = "#7a4419";
const LA_OPACITY = 0.5;
const LA_FEATURE = "siss:tyne_and_wear_la";
const LA_ZINDEX = 100;
export const LA = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Local Authority areas", 
			visible: false,
			minResolution: 10,
			switcherOpts: {icon: "literal:LA", opacity: false},
            source: new GeoserverWFSSource({featureType: LA_FEATURE}),
			style: polygonstyles.invisible(LA_ZINDEX),				
            hoverStyle: polygonstyles.centroidLabelled(
                {color: LA_COL.toRgba(1.0), width: 2}, 
                {color: LA_COL.toRgba(LA_OPACITY)},
                {labelAttr: "name"},
                LA_ZINDEX
            )
        }
	));
};

/**
 * LSOA layer
 */
const LSOA_COL = "#63535b";
const LSOA_OPACITY = 0.5;
const LSOA_FEATURE = "siss:tyne_and_wear_lsoa";
const LSOA_ZINDEX = 110;
export const LSOA = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Lower Super Output Areas", 
			visible: false,
			minResolution: 2,
			maxResolution: 20,
			switcherOpts: {icon: "literal:LSOA", opacity: false},
            source: new GeoserverWFSSource({featureType: LSOA_FEATURE}),
			style: polygonstyles.invisible(LSOA_ZINDEX),
            hoverStyle: polygonstyles.centroidLabelled(
                {color: LSOA_COL.toRgba(1.0), width: 2}, 
                {color: LSOA_COL.toRgba(LSOA_OPACITY)},
                {labelAttr: "name"},
                LSOA_ZINDEX
            )
		}	
	));
};

/**
 * OA layer
 */
const OA_COL = "#400406";
const OA_OPACITY = 0.5;
const OA_FEATURE = "siss:tyne_and_wear_oa";
const OA_ZINDEX = 120;
export const OA = () => {
	return(new InteractiveVectorLayer(
		{ 
			title: "Output Areas", 
			visible: false,
			maxResolution: 10,
            opacity: OA_OPACITY,
			switcherOpts: {icon: "literal:OA", opacity: false},
            source: new GeoserverWFSSource({featureType: OA_FEATURE}),
			style: polygonstyles.invisible(OA_ZINDEX),
            hoverStyle: polygonstyles.centroidLabelled(
                {color: OA_COL.toRgba(1.0), width: 2}, 
                {color: OA_COL.toRgba(OA_OPACITY)},
                {labelAttr: "code"},
                LSOA_ZINDEX
            )
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
		switcherOpts: {icon: "minus", legend: "IMD Decile"},
		opacity: 0.6,
		source: new TileWMS({
            url: `${GEOSERVER_WMS}`,
            params: {layers: "siss:imd_2015_by_lsoa"},
            serverType: "geoserver",
            wrapX: false
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
		switcherOpts: {icon: "wheelchair", legend: "% of disabled with day-to-day limitations"},
        opacity: 0.6,
        source: new TileWMS({
            url: `${GEOSERVER_WMS}`,
            params: {layers: "siss:disability_2015_by_lsoa"},
            serverType: "geoserver",
            wrapX: false})		
	}));
};

/**
 * Ethnicity layer
 */
const ETHNICITY_FEATURE = "siss:tyne_and_wear_ethnicity_summary";
const ETHNICITY_ZINDEX = 200;
const ETHNICITY_STYLE = new LabelledChartStyle({
    attrs: ["white", "asian", "black", "mixed", "other"],
    colors: ["cornsilk", "brown", "black", "goldenrod", "gray"],
    totalAttr: "total_residents",
    zIndex: ETHNICITY_ZINDEX,
    labels: false
});

export const ETHNICITY = () => {
	return(new InteractiveVectorLayer(
		{
			title: "Ethnic composition", 
			visible: false,
			minResolution: 2,
			maxResolution: 20,
            extent: NEWCASTLE_CENTRE_3857,
            zIndex: ETHNICITY_ZINDEX,
			switcherOpts: {icon: "users"},
            source: new GeoserverWFSSource({featureType: ETHNICITY_FEATURE}),
            style: ETHNICITY_STYLE.percentageLabelledChart({}),            
            clickStyle: ETHNICITY_STYLE.percentageLabelledChart({labels: true}),
            legendOptions: ETHNICITY_STYLE.legendOptions
		}
	));
};

/**
 * Urban Observatory Sensor layer
 */
export const SENSORS = (theme, sensorType, zIndex, visible = false, icon = "question", color = "#000000") => {
    let sensorStyle = new UrbanObservatorySensorStyle({color1: color});
    return(new InteractiveVectorLayer({
        title: `${sensorType} sensors`,
        cluster: true,
        visible: visible,
        zIndex: zIndex,
        switcherOpts: {icon: icon, legend: `${theme} ${sensorType} sensors`, attribution: "Current sensor locations for NU Urban Observatory"},		        			
        source: new UrbanObservatorySource({sensorTheme: theme, sensorType: sensorType}),
        style: sensorStyle.sensorDartboard({}),
        clickStyle: sensorStyle.sensorDartboard({multiplier: 1.2})
    }));    
};