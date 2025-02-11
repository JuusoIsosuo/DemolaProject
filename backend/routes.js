const fs = require("fs")

// Load the GeoJSON file
const geojson = JSON.parse(fs.readFileSync('./data/routes.geojson', 'utf8'));

// Convert GeoJSON to graph representation
const buildGraph = (geojson) => {
  const graph = {};
  
  geojson.features.forEach((feature) => {
    if (feature.geometry.type !== "LineString") return;

    const { from, to, transport, emission_per_ton_km, speed_km_h } = feature.properties;
    const [fromCoords, toCoords] = feature.geometry.coordinates;

    let distance, emission, time, geometry;
    
    if ( transport === "air ") {
      [distance, emission, time, geometry] = airRoute(fromCoords, toCoords);
    } else if ( transport === "sea" ) {
      [distance, emission, time, geometry] = seaRoute(fromCoords, toCoords);
    } else if ( transport === "truck" ) {
      [distance, emission, time, geometry] = truckRoute(fromCoords, toCoords);
    } else if ( transport === "rail" ) {
      [distance, emission, time, geometry] = railRoute(fromCoords, toCoords);
    } else {
      console.log("Transport type not recognized:", transport)
      return
    }
    
    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    // Add bidirectional edges
    graph[from].push({ node: to, distance, emission: emission_per_ton_km * distance, time: distance / speed_km_h, transport: transport, geometry: geometry });
    graph[to].push({ node: from, distance: distance, emission: emission, time: time, transport: transport, geometry: geometry });
  });

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

const airRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 50
  const speed_km_h = 800

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]) // Calculate actual distance here
  const emission = distance * emission_per_ton_km
  const time = distance / speed_km_h
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  }

  return [distance, emission, time, geometry]
};

const seaRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 10
  const speed_km_h = 30

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]) // Calculate actual distance here
  const emission = distance * emission_per_ton_km
  const time = distance / speed_km_h
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  }

  return [distance, emission, time, geometry]
};

const truckRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 22
  const speed_km_h = 90

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]) // Calculate actual distance here
  const emission = distance * emission_per_ton_km
  const time = distance / speed_km_h
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  }

  return [distance, emission, time, geometry]
};

const railRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 6
  const speed_km_h = 100

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]) // Calculate actual distance here
  const emission = distance * emission_per_ton_km
  const time = distance / speed_km_h
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  }

  return [distance, emission, time, geometry]
};

// Dijkstra’s algorithm for finding the optimal path
const dijkstra = (graph, start, end, costType) => {
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

    graph[currentNode].forEach(({ node, [costType]: cost, geometry, transport, emission, time }) => {
      const newCost = currentCost + cost;
      if (newCost < costs[node]) {
        costs[node] = newCost;
        prev[node] = currentNode;
        pathGeometry[node] = { geometry, transport, emission, time }; // Store the full leg data
        pq.set(node, newCost);
      }
    });
  }

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
          emission: pathGeometry[temp].emission,
          time: pathGeometry[temp].time,
        }
      });
    }
    temp = prev[temp];
  }

  return path.length > 1 ? { path, totalCost: costs[end], geojson: { type: "FeatureCollection", features: geojsonFeatures } } : null;
};

// Main function to find optimal routes
const findBestRoutes = (start, end) => {
  const graph = buildGraph(geojson);
  const fastestRoute = dijkstra(graph, start, end, "time");
  const lowestEmissionRoute = dijkstra(graph, start, end, "emission");

  return {
    fastest: fastestRoute,
    lowestEmission: lowestEmissionRoute
  };
};

module.exports = findBestRoutes
