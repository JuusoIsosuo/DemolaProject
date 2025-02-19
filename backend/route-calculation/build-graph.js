const fs = require("fs");
const path = require('path');
const { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute } = require('./find-routes.js')

// Load the GeoJSON file
const GEOJSON = JSON.parse(fs.readFileSync('./data/locations.geojson', 'utf8'));

// Save graph into json file
const saveGraph = (graph) => {
  const filePath = path.join(__dirname, 'graph.json');
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2));
};

// Convert GeoJSON to graph representation
const buildGraph = (geojson = GEOJSON) => {
  const graph = {};
  const locations = geojson.features;

  // Initialize empty adjacency list for each location
  locations.forEach((location) => {
    graph[location.properties.name] = { 
      coordinates: location.geometry.coordinates, 
      edges: [] };
  });

  // Generate edges between locations with shared transport modes
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const locA = locations[i];
      const locB = locations[j];

      const sharedModes = locA.properties.modes.filter(mode => locB.properties.modes.includes(mode));

      if (sharedModes.length > 0) {
        sharedModes.forEach((mode) => {

          let distance, emission, time, geometry;
          const fromCoords = locA.geometry.coordinates;
          const toCoords = locB.geometry.coordinates;

          if ( mode === "air") {
            [distance, emission, time, geometry] = findAirRoute(fromCoords, toCoords);
          } else if ( mode === "sea" ) {
            [distance, emission, time, geometry] = findSeaRoute(fromCoords, toCoords);
          } else if ( mode === "truck" ) {
            [distance, emission, time, geometry] = findTruckRoute(fromCoords, toCoords);
          } else if ( mode === "rail" ) {
            if ( locA.properties.network === locB.properties.network ) {
              [distance, emission, time, geometry] = findRailRoute(fromCoords, toCoords);
            } else {
              return;
            }
            
          } else {
            console.log("Transportation mode not recognized:", mode);
            return;
          }

          if ( !distance || !emission || !time || !geometry ) {
            console.log(`Unable to find ${mode} route between ${locA.properties.name} and ${locB.properties.name}`);
            return;
          }
  
          // Add bidirectional edges
          graph[locA.properties.name].edges.push({
            node: locB.properties.name,
            transport: mode,
            distance: distance,
            emission: emission,
            time: time,
            geometry: geometry
          });

          graph[locB.properties.name].edges.push({
            node: locA.properties.name,
            transport: mode,
            distance: distance,
            emission: emission,
            time: time,
            geometry: geometry
          });
        });
      }
    }
  }

  return graph;
};

if (require.main === module) {
  const args = process.argv.slice(2); // Get command-line arguments
  graph = buildGraph(geojson = args[0]); // Pass the first argument to the function
  saveGraph(graph); // Save the graph to a file
}

module.exports = buildGraph;
