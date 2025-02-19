const fs = require("fs");
const path = require('path');
const { findTruckRoute } = require('./find-routes.js')

// Read the graph from a JSON file
const readGraph = () => {
  const filePath = path.join(__dirname, 'graph.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }
  return null;
};

// Add start or end location to graph if not already in graph
const addLocationToGraph = async (graph, newLocation, newLocationCoords) => {
  graph[newLocation] = {coordinates: newLocationCoords, edges: []};

  // Loop through all existing locations in the graph to create new edges
  for (const existingNode in graph) {
    if (existingNode !== newLocation) {
      const existingNodeCoords = graph[existingNode].coordinates;
      
      let distance, emission, time, geometry;
      try {
        // Find truck route between the new location and the existing location
        [distance, emission, time, geometry] = await findTruckRoute(newLocationCoords, existingNodeCoords);
      } catch (error) {
        console.log("Unable to find truck route:", error.response.data.message);
        continue;
      }
      if ( !distance || !emission || !time || !geometry ) {
        console.log("Unable to find truck route");
        continue;
      }
        
      // Add the new edge for both directions
      graph[newLocation].edges.push({
        node: existingNode,
        transport: "truck",
        distance: distance,
        emission: emission,
        time: time,
        geometry: geometry
      });

      graph[existingNode].edges.push({
        node: newLocation,
        transport: "truck",
        distance: distance,
        emission: emission,
        time: time,
        geometry: geometry
      });
    }
  };

  return graph;
};

// Dijkstra’s algorithm for finding the optimal path by costType
const dijkstra = (graph, start, end, costType) => {
  const pq = new Map();  // Priority queue
  const costs = {};      // Cost tracker
  const prev = {};       // Previous node tracker
  const pathGeometry = {}; // Track geometry for the path

  // Initialize the costs and priority queue
  Object.keys(graph).forEach(node => costs[node] = Infinity);
  costs[start] = 0;
  pq.set(start, 0);

  // Main loop
  while (pq.size > 0) {
    // Get the node with the lowest cost
    const [currentNode, currentCost] = [...pq.entries()].reduce((a, b) => a[1] < b[1] ? a : b);
    pq.delete(currentNode);

    if (currentNode === end) break;

    // Update the costs and priority queue
    graph[currentNode].edges.forEach(({ node, [costType]: cost, geometry, transport, distance, emission, time }) => {
      const newCost = currentCost + cost;
      if (newCost < costs[node]) {
        costs[node] = newCost;
        prev[node] = currentNode;
        pathGeometry[node] = { geometry, transport, distance, emission, time }; // Store the full leg data
        pq.set(node, newCost);
      }
    });
  };

  // Backtrack to get the full path and collect geometries in GeoJSON format
  let path = [];
  let geojsonFeatures = [];
  let temp = end;
  while (temp) {
    path.unshift(temp);
    if (pathGeometry[temp]) {
      // Convert each leg to a GeoJSON feature
      geojsonFeatures.unshift({
        type: "Feature",
        geometry: pathGeometry[temp].geometry, // Geometry of the leg
        properties: {
          transport: pathGeometry[temp].transport,
          distance: pathGeometry[temp].distance,
          emission: pathGeometry[temp].emission,
          time: pathGeometry[temp].time,
        }
      });
    }
    temp = prev[temp];
  };

  // Calculate total distance, emission, and time
  const totalDistance = geojsonFeatures.reduce(((total, feature) => total + feature.properties.distance), 0);
  const totalEmission = geojsonFeatures.reduce(((total, feature) => total + feature.properties.emission), 0);
  const totalTime = geojsonFeatures.reduce(((total, feature) => total + feature.properties.time), 0);

  return path.length > 1 ? { path, totalDistance, totalEmission: totalEmission, totalTime: totalTime, geojson: { type: "FeatureCollection", features: geojsonFeatures } } : null;
};

// Main function to find optimal routes
const findBestRoutes = async ( start, end, startCoords, endCoords ) => {
  let graph = readGraph();

  // Add start and end locations to the graph if they are not already there
  if ( !graph[start] ) {
    graph = await addLocationToGraph(graph, start, startCoords);
  }
  if ( !graph[end] ) {
    graph = await addLocationToGraph(graph, end, endCoords);
  }

  // Find the best routes
  const fastestRoute = dijkstra(graph, start, end, "time");
  const lowestEmissionRoute = dijkstra(graph, start, end, "emission");

  return {
    fastest: fastestRoute,
    lowestEmission: lowestEmissionRoute
  };
};

module.exports = findBestRoutes;
