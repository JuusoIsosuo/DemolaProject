const { spawn, spawnSync } = require('child_process');

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

module.exports = { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute };

