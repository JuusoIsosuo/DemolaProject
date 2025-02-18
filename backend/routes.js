const fs = require("fs");
const path = require('path');


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

// Convert GeoJSON to graph representation
const buildGraph = (geojson) => {
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

          if ( !distance || !emission || !time | !geometry ) {
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

// Haversine formula to calculate distance between two coordinates
const haversineDistance = ([lon1, lat1], [lon2, lat2]) => {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const findAirRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 50;
  const speed_km_h = 800;

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]); // Calculate actual distance here
  const emission = distance * emission_per_ton_km;
  const time = distance / speed_km_h;
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  };

  routeFound = true;
  if ( routeFound ) {
    return [distance, emission, time, geometry];
  } else {
    return [null, null, null, null];
  }
};

const findSeaRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 10;
  const speed_km_h = 30;

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]); // Calculate actual distance here
  const emission = distance * emission_per_ton_km;
  const time = distance / speed_km_h;
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  };

  routeFound = true;
  if ( routeFound ) {
    return [distance, emission, time, geometry];
  } else {
    return [null, null, null, null];
  }
};

const findTruckRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 22;
  const speed_km_h = 90;

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]); // Calculate actual distance here
  const emission = distance * emission_per_ton_km;
  const time = distance / speed_km_h;
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  }

  routeFound = true;
  if ( routeFound ) {
    return [distance, emission, time, geometry];
  } else {
    return [null, null, null, null];
  }
};

const findRailRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 6;
  const speed_km_h = 100;

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]); // Calculate actual distance here
  const emission = distance * emission_per_ton_km;
  const time = distance / speed_km_h;
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  };

  routeFound = true;
  if ( routeFound ) {
    return [distance, emission, time, geometry];
  } else {
    return [null, null, null, null];
  }
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
