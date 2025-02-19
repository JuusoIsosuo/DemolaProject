const { spawn, spawnSync } = require('child_process');

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
  const emission_per_ton_km = 1;

  const originCoords = [lon1, lat1];
  const destinationCoords = [lon2, lat2];

  const pythonProcess = spawnSync('python', ['searoute_script.py', JSON.stringify(originCoords), JSON.stringify(destinationCoords)]);

  if (pythonProcess.error) {
    console.error(`Error: ${pythonProcess.error.message}`);
    return [null, null, null, null];
  }

  if (pythonProcess.status !== 0) {
    console.error(`Python process exited with code ${pythonProcess.status}`);
    return [null, null, null, null];
  }

  const dataToSend = pythonProcess.stdout.toString();
  const route = JSON.parse(dataToSend);
  console.log("Marine Route GeoJSON:", route);

  const distance = route.properties.length;
  const emission = distance * emission_per_ton_km;
  const time = route.properties.duration_hours;
  const geometry = {
    type: "LineString", coordinates: route.geometry.coordinates
  };

  return [distance, emission, time, geometry];
};

const findTruckRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 10;
  const speed_km_h = 60;

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]); // Calculate actual distance here
  const emission = distance * emission_per_ton_km;
  const time = distance / speed_km_h;
  const geometry = {
    type: "LineString", coordinates: [[lon1, lat1], [lon2, lat2]] // Give calculated route here
  };

  const routeFound = true;
  if (routeFound) {
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

module.exports = buildGraph;
