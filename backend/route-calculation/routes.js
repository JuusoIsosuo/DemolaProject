const fs = require("fs");
const path = require('path');
const { findTruckRoute } = require('./find-routes.js');
const supabase = require('./config/database');

// Haversine formula to calculate distance between two coordinates
const haversineDistance = ([lon1, lat1], [lon2, lat2]) => {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Find locations within a certain radius of a point
const findLocationsInRadius = async (center, radiusKm) => {
  try {
    // Fetch all locations from the database
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, coordinates');
    
    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
    
    // Filter locations by distance
    return locations.filter(location => {
      const distance = haversineDistance(center, location.coordinates);
      return distance <= radiusKm;
    });
  } catch (error) {
    console.error('Error finding locations in radius:', error);
    return [];
  }
};

// Get connections between two locations
const getConnectionsBetweenLocations = async (fromLocationId, toLocationId) => {
  try {
    // Fetch connections from the database
    const { data: connections, error } = await supabase
      .from('connections')
      .select('*')
      .or(`and(from_location_id.eq.${fromLocationId},to_location_id.eq.${toLocationId}),and(from_location_id.eq.${toLocationId},to_location_id.eq.${fromLocationId})`);
    
    if (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
    
    return connections || [];
  } catch (error) {
    console.error('Error getting connections between locations:', error);
    return [];
  }
};

// Read the graph from the Supabase database, but only for locations within a certain radius
const readGraphFromDatabase = async (startCoords, endCoords) => {
  try {
    // Calculate the midpoint between start and end coordinates
    const midLon = (startCoords[0] + endCoords[0]) / 2;
    const midLat = (startCoords[1] + endCoords[1]) / 2;
    const midpoint = [midLon, midLat];
    
    // Calculate the distance between start and end
    const distance = haversineDistance(startCoords, endCoords);
    
    // Use a radius that's at least 1.5 times the direct distance to ensure we have enough locations
    const radiusKm = Math.max(distance * 1.5, 100);
    
    // Find locations within the radius
    const locations = await findLocationsInRadius(midpoint, radiusKm);
    
    if (locations.length === 0) {
      console.log('No locations found within radius');
      return null;
    }
    
    // Build the graph structure
    const graph = {};
    
    // Add all locations to the graph
    locations.forEach(location => {
      graph[location.name] = {
        id: location.id,
        coordinates: location.coordinates,
        edges: []
      };
    });
    
    // Fetch connections in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize);
      
      // Create a list of location IDs in this batch
      const locationIds = batch.map(loc => loc.id);
      
      // Fetch connections where both locations are in this batch
      const { data: connections, error } = await supabase
        .from('connections')
        .select('*')
        .or(`and(from_location_id.in.(${locationIds.join(',')}),to_location_id.in.(${locationIds.join(',')}))`);
      
      if (error) {
        console.error('Error fetching connections batch:', error);
        continue;
      }
      
      // Add connections to the graph
      if (connections) {
        connections.forEach(connection => {
          // Find the location names for this connection
          const fromLocation = locations.find(loc => loc.id === connection.from_location_id);
          const toLocation = locations.find(loc => loc.id === connection.to_location_id);
          
          if (fromLocation && toLocation) {
            // Add the connection to the from location
            graph[fromLocation.name].edges.push({
              node: toLocation.name,
              transport: connection.transport,
              distance: connection.distance,
              emission: connection.emission,
              time: connection.time,
              geometry: connection.geometry
            });
            
            // Add the connection to the to location (bidirectional)
            graph[toLocation.name].edges.push({
              node: fromLocation.name,
              transport: connection.transport,
              distance: connection.distance,
              emission: connection.emission,
              time: connection.time,
              geometry: connection.geometry
            });
          }
        });
      }
    }
    
    return graph;
  } catch (error) {
    console.error('Error reading graph from database:', error);
    return null;
  }
};

// Add start or end location to graph if not already in graph
const addLocationToGraph = async (graph, newLocation, newLocationCoords) => {
  // Check if the location already exists in the database
  const { data: existingLocations, error: searchError } = await supabase
    .from('locations')
    .select('id')
    .eq('name', newLocation);
  
  let locationId;
  
  if (searchError) {
    console.error(`Error searching for location ${newLocation}:`, searchError);
    return graph;
  }
  
  if (existingLocations && existingLocations.length > 0) {
    // Location already exists in the database
    locationId = existingLocations[0].id;
  } else {
    // Insert the new location into the database
    const { data: newLocationData, error: insertError } = await supabase
      .from('locations')
      .insert([{ 
        name: newLocation, 
        coordinates: newLocationCoords 
      }])
      .select('id');
    
    if (insertError) {
      console.error(`Error inserting location ${newLocation}:`, insertError);
      return graph;
    }
    
    locationId = newLocationData[0].id;
  }
  
  // Add the location to the graph
  graph[newLocation] = {
    id: locationId,
    coordinates: newLocationCoords,
    edges: []
  };

  // Find locations within a reasonable radius (e.g., 500km)
  const nearbyLocations = await findLocationsInRadius(newLocationCoords, 500);
  
  // Loop through nearby locations to create new edges
  for (const nearbyLocation of nearbyLocations) {
    if (nearbyLocation.name !== newLocation) {
      // Check if a connection already exists in the database
      const existingConnections = await getConnectionsBetweenLocations(locationId, nearbyLocation.id);
      
      if (existingConnections && existingConnections.length > 0) {
        // Connection already exists in the database, add it to the graph
        const connection = existingConnections[0];
        
        graph[newLocation].edges.push({
          node: nearbyLocation.name,
          transport: connection.transport,
          distance: connection.distance,
          emission: connection.emission,
          time: connection.time,
          geometry: connection.geometry
        });
        
        if (graph[nearbyLocation.name]) {
          graph[nearbyLocation.name].edges.push({
            node: newLocation,
            transport: connection.transport,
            distance: connection.distance,
            emission: connection.emission,
            time: connection.time,
            geometry: connection.geometry
          });
        }
      } else {
        // Calculate a new truck route
        let distance, emission, time, geometry;
        try {
          [distance, emission, time, geometry] = await findTruckRoute(newLocationCoords, nearbyLocation.coordinates, maxDistance = 2000);
        } catch (error) {
          console.log("Unable to find truck route:", error.response?.data?.message || error.message);
          continue;
        }
        
        if (!distance || !emission || !time || !geometry) {
          console.log("Unable to find truck route");
          continue;
        }
        
        // Insert the new connection into the database
        const { error: insertConnectionError } = await supabase
          .from('connections')
          .insert([{
            from_location_id: locationId,
            to_location_id: nearbyLocation.id,
            transport: 'truck',
            distance,
            emission,
            time,
            geometry
          }]);
        
        if (insertConnectionError) {
          console.error(`Error inserting connection:`, insertConnectionError);
          continue;
        }
        
        // Add the new edge for both directions
        graph[newLocation].edges.push({
          node: nearbyLocation.name,
          transport: "truck",
          distance: distance,
          emission: emission,
          time: time,
          geometry: geometry
        });

        if (graph[nearbyLocation.name]) {
          graph[nearbyLocation.name].edges.push({
            node: newLocation,
            transport: "truck",
            distance: distance,
            emission: emission,
            time: time,
            geometry: geometry
          });
        }
      }
    }
  }

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
  // Read the graph from the database, focusing on the area between start and end
  let graph = await readGraphFromDatabase(startCoords, endCoords);
  
  if (!graph) {
    console.error('Failed to read graph from database');
    return { fastest: null, lowestEmission: null };
  }

  // Add start and end locations to the graph if they are not already there
  if (!graph[start]) {
    graph = await addLocationToGraph(graph, start, startCoords);
  }
  if (!graph[end]) {
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
