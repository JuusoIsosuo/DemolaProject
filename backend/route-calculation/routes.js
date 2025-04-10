const fs = require("fs");
const path = require('path');
const { findTruckRoute } = require('./find-routes.js')
const supabase = require('./config/database');

// Emission rates in kg CO2e per ton-km
const EMISSION_RATES = {
  truck: 30,    // Average truck emission rate
  rail: 0.001,    // Electric train emission rate
  sea: 25,     // Container ship emission rate
  air: 284        // Cargo aircraft emission rate
};

// Average load capacities in tons
const LOAD_CAPACITIES = {
  truck: 25,      // Standard truck capacity
  rail: 2000,     // Freight train capacity
  sea: 165000,     // Container ship capacity
  air: 140        // Cargo aircraft capacity
};

// Calculate emission for a route segment
const calculateEmission = (distance, transport) => {
  const emissionRate = EMISSION_RATES[transport] || EMISSION_RATES.truck;
  const loadCapacity = LOAD_CAPACITIES[transport] || LOAD_CAPACITIES.truck;
  return distance * emissionRate / loadCapacity / 1000;
};

// Read the graph from the database or JSON file
const readGraph = async (useDatabase = true) => {
  try {
    if (useDatabase) {
      console.log('Reading graph from database');
      // Fetch all locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*');
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        return null;
      }

      // Fetch all connections
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('*');
      
      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        return null;
      }

      // Build the graph
      const graph = {};
      
      // Add all locations to the graph
      locations.forEach(location => {
        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
          console.error(`Invalid coordinates for location ${location.name}:`, location.coordinates);
          return;
        }
        
        graph[location.name] = {
          coordinates: location.coordinates,
          edges: []
        };
      });

      // Add all connections to the graph
      connections.forEach(connection => {
        const fromLocation = locations.find(loc => loc.id === connection.from_location_id);
        const toLocation = locations.find(loc => loc.id === connection.to_location_id);
        
        if (fromLocation && toLocation) {
          const emission = calculateEmission(connection.distance, connection.transport);
          
          // Add edge in both directions
          graph[fromLocation.name].edges.push({
            node: toLocation.name,
            transport: connection.transport,
            distance: connection.distance,
            time: connection.time,
            emission: emission,
            geometry: connection.geometry
          });

          graph[toLocation.name].edges.push({
            node: fromLocation.name,
            transport: connection.transport,
            distance: connection.distance,
            time: connection.time,
            emission: emission,
            geometry: connection.geometry
          });
        }
      });

      return graph;
    } else {
      // Read from JSON file
      console.log('Reading graph from JSON file');
      const filePath = path.join(__dirname, 'graph.json');
      if (!fs.existsSync(filePath)) {
        console.error('Graph file not found:', filePath);
        return null;
      }

      const data = fs.readFileSync(filePath);
      const jsonGraph = JSON.parse(data);

      // Recalculate emissions for all edges
      for (const node in jsonGraph) {
        jsonGraph[node].edges = jsonGraph[node].edges.map(edge => ({
          ...edge,
          emission: calculateEmission(edge.distance, edge.transport)
        }));
      }

      return jsonGraph;
    }
  } catch (error) {
    console.error('Error building graph:', error);
    return null;
  }
};

// Add start or end location to graph if not already in graph
const addLocationToGraph = async (graph, newLocation, newLocationCoords) => {
  if (!Array.isArray(newLocationCoords) || newLocationCoords.length !== 2) {
    console.error(`Invalid coordinates for new location ${newLocation}:`, newLocationCoords);
    return graph;
  }

  graph[newLocation] = {coordinates: newLocationCoords, edges: []};

  // Loop through all existing locations in the graph to create new edges
  for (const existingNode in graph) {
    if (existingNode !== newLocation) {
      const existingNodeCoords = graph[existingNode].coordinates;
      
      let distance, time, geometry;
      try {
        console.log(`Finding truck route between ${newLocation} and ${existingNode}`);
        console.log(`Coordinates: ${JSON.stringify(newLocationCoords)} -> ${JSON.stringify(existingNodeCoords)}`);
        
        const result = await findTruckRoute(newLocationCoords, existingNodeCoords, 2000);
        
        if (!result || !Array.isArray(result) || result.length !== 3) {
          console.log(`Invalid result from findTruckRoute:`, result);
          continue;
        }
        
        [distance, time, geometry] = result;
        
        if (!distance || !time || !geometry) {
          console.log("Missing required route data");
          continue;
        }
        
        console.log(`Found route: distance=${distance}km, time=${time}h`);
      } catch (error) {
        console.log("Unable to find truck route:", error.message);
        if (error.response) {
          console.log("API Error details:", error.response.data);
        }
        continue;
      }

      const emission = calculateEmission(distance, 'truck');
      console.log(`Calculated emission: ${emission} kg CO2e`);
        
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

// Dijkstra's algorithm for finding the optimal path by costType
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
const findBestRoutes = async (start, end, startCoords, endCoords) => {
  let graph = await readGraph();

  // Add start and end locations to the graph if they are not already there
  if (!graph[start]) {
    console.log(`Adding start location ${start} to graph`);
    graph = await addLocationToGraph(graph, start, startCoords);
  }
  if (!graph[end]) {
    console.log(`Adding end location ${end} to graph`);
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