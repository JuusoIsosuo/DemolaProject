const fs = require("fs");
const path = require('path');
const buildGraph = require('./build-graph.js')

// Load the GeoJSON file
const geojson = JSON.parse(fs.readFileSync('./data/locations.geojson', 'utf8'));

const saveGraph = (graph) => {
  const filePath = path.join(__dirname, 'graph.json');
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2));
};

// Function to read the graph from a JSON file
const readGraph = () => {
  const filePath = path.join(__dirname, 'graph.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }
  return null;
};

// Function to add start or end location to graph if not already in graph
const addLocationToGraph = (graph, newLocation, newLocationCoords) => {
  graph[newLocation] = {coordinates: newLocationCoords, edges: []};

  // Loop through all existing locations in the graph to create new edges
  Object.keys(graph).forEach(existingNode => {
    if (existingNode !== newLocation) {
      const existingNodeCoords = graph[existingNode].coordinates;
      
      let distance, emission, time, geometry;
      [distance, emission, time, geometry] = findTruckRoute(newLocationCoords, existingNodeCoords);
        
      // Add the new edge for both directions (bidirectional routes)
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
  });

  return graph;
};

// Dijkstra’s algorithm for finding the optimal path
const dijkstra = (graph, start, end, costType) => {
  //console.log(graph)
  const pq = new Map();  // Priority queue
  const costs = {};      // Cost tracker
  const prev = {};       // Previous node tracker
  const pathGeometry = {}; // Track geometry for the path

  Object.keys(graph).forEach(node => costs[node] = Infinity);
  costs[start] = 0;
  pq.set(start, 0);

  while (pq.size > 0) {
    const [currentNode, currentCost] = [...pq.entries()].reduce((a, b) => a[1] < b[1] ? a : b);
    pq.delete(currentNode);

    if (currentNode === end) break;

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

  const totalDistance = geojsonFeatures.reduce(((total, feature) => total + feature.properties.distance), 0);
  const totalEmission = geojsonFeatures.reduce(((total, feature) => total + feature.properties.emission), 0);
  const totalTime = geojsonFeatures.reduce(((total, feature) => total + feature.properties.time), 0);

  return path.length > 1 ? { path, totalDistance, totalEmission: totalEmission, totalTime: totalTime, geojson: { type: "FeatureCollection", features: geojsonFeatures } } : null;
};

// Main function to find optimal routes. Set regenerate to false if there are no changes that affect the graph.
const findBestRoutes = ( start, end, startCoords, endCoords, regenerate=true ) => {
  let graph = readGraph();
  if ( regenerate ) {
    console.log('Regenerating the graph...');
    graph = buildGraph(geojson);
    saveGraph(graph); // Save the newly generated graph to file
  }

  if ( !graph[start] ) {
    graph = addLocationToGraph(graph, start, startCoords);
  }
  if ( !graph[end] ) {
    graph = addLocationToGraph(graph, end, endCoords);
  }

  const fastestRoute = dijkstra(graph, start, end, "time");
  const lowestEmissionRoute = dijkstra(graph, start, end, "emission");

  return {
    fastest: fastestRoute,
    lowestEmission: lowestEmissionRoute
  };
};

module.exports = findBestRoutes;
