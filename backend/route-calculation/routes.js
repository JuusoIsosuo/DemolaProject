const fs = require("fs");
const path = require('path');
const { findTruckRoute } = require('./find-routes.js')
const supabase = require('./config/database');

// Emission rates in g CO2e per ton-km
const EMISSION_RATES = {
  truck: {
    euroI: 36,
    euroII: 37,
    euroIII: 38,
    euroIV: 37,
    euroV: 37,
    euroVI: 36
  },
  rail: {
    electric: 12.6,
    diesel: 30.4
  },
  sea: 17,     // Container ship emission rate
  air: 595        // Cargo aircraft emission rate
};

// Average load capacities in tons
const LOAD_CAPACITIES = {
  truck: 25,      // Standard truck capacity (full load)
  rail: 2000,     // Freight train capacity
  sea: 165000,     // Container ship capacity
  air: 140        // Cargo aircraft capacity
};

// Calculate emission for a route segment
const calculateEmission = (distance, transport, truckType, trainType) => {
  const emissionRate = transport === 'truck' ? EMISSION_RATES.truck[truckType] : 
                      transport === 'rail' ? EMISSION_RATES.rail[trainType] : 
                      EMISSION_RATES[transport];
  const loadCapacity = LOAD_CAPACITIES[transport];
  return distance * emissionRate / 1000 / 1000;
};

// Read the graph from the database or JSON file
const readGraph = async (useDatabase = true, truckType, trainType) => {
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
          if (fromLocation.name === "Shanghai" || toLocation.name === "Shanghai") {
            console.log(`Skipping connection involving Shanghai: ${fromLocation.name} → ${toLocation.name}`);

            return;
          }
          const emission = calculateEmission(connection.distance, connection.transport, truckType, trainType);
          
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
          emission: calculateEmission(edge.distance, edge.transport, truckType, trainType)
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
const addLocationToGraph = async (graph, newLocation, newLocationCoords, truckType, trainType) => {
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
        
        const result = await findTruckRoute(newLocationCoords, existingNodeCoords, 1000);
        
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

      const emission = calculateEmission(distance, 'truck', truckType, trainType);
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
const dijkstra = (graph, start, end, costType, allowedTransports = ['truck', 'rail', 'sea', 'air']) => {
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
      // Skip edges with transport modes not in the allowed list
      if (!allowedTransports.includes(transport)) {
        return;
      }
      
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
const findBestRoutes = async (start, end, startCoords, endCoords, useSea = true, useAir = true, useRail = true, truckType = 'euroV', trainType = 'electric') => {
  let graph = await readGraph(true, truckType, trainType);
  
  // Determine which transport modes to use
  const allowedTransports = ['truck']; // Truck is always included
  if (useSea === true) allowedTransports.push('sea');
  if (useAir === true) allowedTransports.push('air');
  if (useRail === true) allowedTransports.push('rail');
  
  console.log('Allowed transports:', allowedTransports);

  // If no additional transport modes are selected, just calculate direct truck route
  if (allowedTransports.length === 1) {
    console.log('No additional transport modes selected, calculating direct truck route');
    try {
      const [distance, time, geometry] = await findTruckRoute(startCoords, endCoords, 100000);
      
      if (!distance || !time || !geometry) {
        console.log('Could not find direct truck route');
        return {
          fastest: null,
          lowestEmission: null
        };
      }
      
      const emission = calculateEmission(distance, 'truck', truckType, trainType);
      
      const directRoute = {
        path: [start, end],
        totalDistance: distance,
        totalEmission: emission,
        totalTime: time,
        geojson: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            geometry: geometry,
            properties: {
              transport: "truck",
              distance: distance,
              emission: emission,
              time: time,
            }
          }]
        }
      };
      
      return {
        fastest: directRoute,
        lowestEmission: directRoute
      };
    } catch (error) {
      console.error('Error calculating direct truck route:', error);
      return {
        fastest: null,
        lowestEmission: null
      };
    }
  }

  // Apufunktio: haetaan suurin arvo tietylle kustannustyypille
const getGlobalMaxValues = (graph, allowedTransports) => {
  let maxEmission = 0;
  let maxTime = 0;

  for (const node in graph) {
    graph[node].edges.forEach(edge => {
      if (!allowedTransports.includes(edge.transport)) return;
      if (edge.emission > maxEmission) maxEmission = edge.emission;
      if (edge.time > maxTime) maxTime = edge.time;
    });
  }

  return { maxEmission, maxTime };
};

// Itse algoritmi
const dijkstraBalanced = (graph, start, end, allowedTransports = ['truck', 'rail', 'sea', 'air']) => {
  const { maxEmission, maxTime } = getGlobalMaxValues(graph, allowedTransports);

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

    graph[currentNode].edges.forEach(({ node, transport, distance, emission, time, geometry }) => {
      if (!allowedTransports.includes(transport)) return;

      // Normalisoidaan arvo välille [0, 1]
      const normTime = maxTime > 0 ? time / maxTime : 0;
      const normEmission = maxEmission > 0 ? emission / maxEmission : 0;

      // Otetaan tasapainotettu keskiarvo
      const balancedCost = (normTime + normEmission) / 2;

      const newCost = currentCost + balancedCost;

      if (newCost < costs[node]) {
        costs[node] = newCost;
        prev[node] = currentNode;
        pathGeometry[node] = { geometry, transport, distance, emission, time };
        pq.set(node, newCost);
      }
    });
  }

  // Reitin takaisinrakennus
  let path = [];
  let geojsonFeatures = [];
  let temp = end;
  while (temp) {
    path.unshift(temp);
    if (pathGeometry[temp]) {
      geojsonFeatures.unshift({
        type: "Feature",
        geometry: pathGeometry[temp].geometry,
        properties: {
          transport: pathGeometry[temp].transport,
          distance: pathGeometry[temp].distance,
          emission: pathGeometry[temp].emission,
          time: pathGeometry[temp].time,
        }
      });
    }
    temp = prev[temp];
  }

  const totalDistance = geojsonFeatures.reduce((sum, f) => sum + f.properties.distance, 0);
  const totalEmission = geojsonFeatures.reduce((sum, f) => sum + f.properties.emission, 0);
  const totalTime = geojsonFeatures.reduce((sum, f) => sum + f.properties.time, 0);

  return path.length > 1 ? {
    path,
    totalDistance,
    totalEmission,
    totalTime,
    geojson: {
      type: "FeatureCollection",
      features: geojsonFeatures
    }
  } : null;
};
  

  // Add start and end locations to the graph if they are not already there
  if (!graph[start]) {
    console.log(`Adding start location ${start} to graph`);
    graph = await addLocationToGraph(graph, start, startCoords, truckType, trainType);
  }
  if (!graph[end]) {
    console.log(`Adding end location ${end} to graph`);
    graph = await addLocationToGraph(graph, end, endCoords, truckType, trainType);
  }

  // Find the best routes with the allowed transport modes
  const fastestRoute = dijkstra(graph, start, end, "time", allowedTransports);
  const lowestEmissionRoute = dijkstra(graph, start, end, "emission", allowedTransports);
  const balancedRoute = dijkstraBalanced(graph, start, end, allowedTransports);

  console.log('Balanced route:', JSON.stringify(balancedRoute, null, 2));

  return {
    fastest: fastestRoute,
    lowestEmission: lowestEmissionRoute,
    balanced: balancedRoute
  };
};

module.exports = findBestRoutes;