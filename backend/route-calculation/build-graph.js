const fs = require("fs");
const path = require('path');
const { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute } = require('./find-routes.js')

// Load the GeoJSON files
const AIRPORTS = JSON.parse(fs.readFileSync('./data/airports.geojson', 'utf8'));
const PORTS = JSON.parse(fs.readFileSync('./data/ports.geojson', 'utf8'));
const RAILWAYS = JSON.parse(fs.readFileSync('./data/railway_connections.geojson', 'utf8'));
const RAILWAY_STATIONS = JSON.parse(fs.readFileSync('./data/railway_stations.geojson', 'utf8'));

// Save graph into json file
const saveGraph = (graph) => {
  console.log("Saving graph to file...");
  const filePath = path.join(__dirname, 'graph.json');
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2));
};

// Convert GeoJSON to graph representation
const buildGraph = async () => {
  const graph = {};
  const airport_locations = AIRPORTS.features;
  const port_locations = PORTS.features;
  const railway_connections = RAILWAYS.features;
  const railway_locations = RAILWAY_STATIONS.features;
  const locations = [...airport_locations, ...port_locations, ...railway_locations];

  // Initialize processed edges counter
  const processedEdges = {};
  processedEdges.air = 0;
  processedEdges.sea = 0;
  processedEdges.rail = 0;
  processedEdges.truck = 0;

  // Initialize empty adjacency list for each location
  locations.forEach((location) => {
    graph[location.properties.name] = { 
      coordinates: location.geometry.coordinates, 
      edges: [] };
  });

  // Generate edges between airport locations
  for (let i = 0; i < airport_locations.length; i++) {
    for (let j = i + 1; j < airport_locations.length; j++) {
      const locA = airport_locations[i];
      const locB = airport_locations[j];
      const fromCoords = locA.geometry.coordinates;
      const toCoords = locB.geometry.coordinates;

      const [distance, emission, time, geometry] = findAirRoute(fromCoords, toCoords);
      if (distance && emission && time && geometry) {
        graph[locA.properties.name].edges.push({
          node: locB.properties.name,
          transport: "air",
          distance: distance,
          emission: emission,
          time: time,
          geometry: geometry
        });

        graph[locB.properties.name].edges.push({
          node: locA.properties.name,
          transport: "air",
          distance: distance,
          emission: emission,
          time: time,
          geometry: geometry
        });

        processedEdges.air++;
        console.log(processedEdges);
      }
    }
  }

  // Generate edges between port locations
  for (let i = 0; i < port_locations.length; i++) {
    for (let j = i + 1; j < port_locations.length; j++) {
      const locA = port_locations[i];
      const locB = port_locations[j];
      const fromCoords = locA.geometry.coordinates;
      const toCoords = locB.geometry.coordinates;

      const [distance, emission, time, geometry] = findSeaRoute(fromCoords, toCoords);
      if (distance && emission && time && geometry) {
        graph[locA.properties.name].edges.push({
          node: locB.properties.name,
          transport: "sea",
          distance: distance,
          emission: emission,
          time: time,
          geometry: geometry
        });

        graph[locB.properties.name].edges.push({
          node: locA.properties.name,
          transport: "sea",
          distance: distance,
          emission: emission,
          time: time,
          geometry: geometry
        });

        processedEdges.sea++;
        console.log(processedEdges);
      }
    }
  }

  // Generate edges between railway locations
  for (let i = 0; i < railway_connections.length; i++) {
    const connection = railway_connections[i];
    const [fromName, toName] = connection.properties.route;
    const fromCoords = connection.geometry.coordinates[0];
    const toCoords = connection.geometry.coordinates[connection.geometry.coordinates.length - 1];

    const [distance, emission, time, geometry] = findRailRoute(fromCoords, toCoords);
    if (distance && emission && time && geometry) {
      graph[fromName].edges.push({
        node: toName,
        transport: "rail",
        distance: distance,
        emission: emission,
        time: time,
        geometry: geometry
      });

      graph[toName].edges.push({
        node: fromName,
        transport: "rail",
        distance: distance,
        emission: emission,
        time: time,
        geometry: geometry
      });

      processedEdges.rail++;
      console.log(processedEdges);
    }
  }

  // Generate truck routes between all locations
  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const locA = locations[i];
      const locB = locations[j];
      const fromCoords = locA.geometry.coordinates;
      const toCoords = locB.geometry.coordinates;

      try {
        const [distance, emission, time, geometry] = await findTruckRoute(fromCoords, toCoords, maxDistance = 5000);
        if (distance && emission && time && geometry) {
          graph[locA.properties.name].edges.push({
            node: locB.properties.name,
            transport: "truck",
            distance: distance,
            emission: emission,
            time: time,
            geometry: geometry
          });

          graph[locB.properties.name].edges.push({
            node: locA.properties.name,
            transport: "truck",
            distance: distance,
            emission: emission,
            time: time,
            geometry: geometry
          });

          processedEdges.truck++;
          console.log(processedEdges);
        }
      } catch (error) {
        console.log(`Unable to find truck route between ${locA.properties.name} and ${locB.properties.name}:`, error.response.data.message);
      }
    }
  }

  return graph;
};

// Run the script if called directly
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2); // Get command-line arguments
    const graph = await buildGraph(geojson = args[0]);
    saveGraph(graph); // Save the graph to a file
  })();
}

module.exports = buildGraph;
