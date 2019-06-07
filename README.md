# Sensor placement platform - early demonstrator

This is a demonstrator of the current state of the NU Urban Observatory, done as an interactive OpenLayers map.  Several other layers from Newcastle City Council and The UK Office of National Statistics are also overlaid.  These are served from an [Amazon AWS  instance](https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances:sort=keyName) named ndh114_gis_server.  The purpose of the map is to bring together some of the key datasets for the [Spatial Inequality and the Smart City project](https://www.turing.ac.uk/research/research-projects/spatial-inequality-and-smart-city), PI Rachel Franklin.  

This repository contains front-end JavaScript code, and is [built into a web bundle using [Parcel](https://parceljs.org/) according to this documentation](https://openlayers.org/en/latest/doc/tutorials/bundle.html.  Additional libraries used:

[ol-layerswitcher](https://github.com/walkermatt/ol-layerswitcher) for the mouseover layer tree and
[bulma](https://bulma.io/documentation/customize/with-node-sass/) for some basic CSS classes 

To build the project:

# Install node and npm
# Install Openlayers 
`
npm install ol
`



