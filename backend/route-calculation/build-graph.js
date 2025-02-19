const fs = require("fs");
const path = require('path');
const { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute } = require('./find-routes.js')

// Load the GeoJSON file
const GEOJSON = JSON.parse(fs.readFileSync('./data/locations.geojson', 'utf8'));

// Save graph into json file
const saveGraph = (graph) => {
  console.log("Saving graph to file...");
  const filePath = path.join(__dirname, 'graph.json');
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2));
};

// Convert GeoJSON to graph representation
const buildGraph = async (geojson = GEOJSON) => {
  const graph = {};
  const locations = geojson.features;
  const processedEdges = {};
  processedEdges.air = 0;
  processedEdges.sea = 0;
  processedEdges.truck = 0;
  processedEdges.rail = 0;

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
        for (const mode of sharedModes) {
          let distance, emission, time, geometry;
          const fromCoords = locA.geometry.coordinates;
          const toCoords = locB.geometry.coordinates;

          
          if ( mode === "air") {
            [distance, emission, time, geometry] = findAirRoute(fromCoords, toCoords);
          } else if ( mode === "sea" ) {
            [distance, emission, time, geometry] = findSeaRoute(fromCoords, toCoords);
          } else if ( mode === "truck" ) {
            try {
              [distance, emission, time, geometry] = await findTruckRoute(fromCoords, toCoords);
            } catch (error) {
              console.log(`Unable to find ${mode} route between ${locA.properties.name} and ${locB.properties.name}:`, error.response.data.message);
              continue;
            }
          } else if ( mode === "rail" ) {
            if ( locA.properties.network === locB.properties.network ) {
              [distance, emission, time, geometry] = findRailRoute(fromCoords, toCoords);
            } else {
              continue;
            }
            
          } else {
            console.log("Transportation mode not recognized:", mode);
            continue;
          }

          if ( !distance || !emission || !time || !geometry ) {
            console.log(`Unable to find ${mode} route between ${locA.properties.name} and ${locB.properties.name}`);
            continue;
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
          
          processedEdges[mode]++;
          console.log(processedEdges);
        };
      }
    }
  }

  return graph;
};

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2); // Get command-line arguments
    const graph = await buildGraph(geojson = args[0]);
    saveGraph(graph); // Save the graph to a file
  })();
}

module.exports = buildGraph;
