const { spawn, spawnSync } = require('child_process');
const axios = require("axios");
const dotenv = require("dotenv");
const turf = require("@turf/turf");
dotenv.config();

const MAPBOX_API_TOKEN = process.env.MAPBOX_API_TOKEN;

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
  const emission_per_ton_km = 284;
  const totalLoad = 140;
  const speed_km_h = 800;

  const originCoords = [lon1, lat1];
  const destinationCoords = [lon2, lat2];

  const airRoute = turf.greatCircle(originCoords, destinationCoords, { units: 'kilometers', npoints: 100 });

  const distance = haversineDistance([lon1, lat1], [lon2, lat2]); // Calculate actual distance here
  const emission = (distance * emission_per_ton_km / totalLoad / 1000);
  console.log("A_Emission: ", emission);
  const time = distance / speed_km_h;

  const geometry = airRoute.geometry;

  routeFound = true;
  if ( routeFound ) {
    return [distance, emission, time, geometry];
  } else {
    return [null, null, null, null];
  }
};

const findSeaRoute = ([lon1, lat1], [lon2, lat2]) => {
  const emission_per_ton_km = 25;
  const totalLoad = 165000;

  const originCoords = [lon1, lat1];
  const destinationCoords = [lon2, lat2];

  // Run the Python script to calculate the sea route
  const pythonProcess = spawnSync('python', ['searoute_script.py', JSON.stringify(originCoords), JSON.stringify(destinationCoords)]);

  if (pythonProcess.error) {
    console.error(`Error: ${pythonProcess.error.message}`);
    return [null, null, null, null];
  }

  if (pythonProcess.status !== 0) {
    console.error(`Python process exited with code ${pythonProcess.status}`);
    return [null, null, null, null];
  }

  // Parse the output from the Python script
  const dataToSend = pythonProcess.stdout.toString();
  const route = JSON.parse(dataToSend);

  const distance = route.properties.length;
  const emission = (distance * emission_per_ton_km / totalLoad / 1000);
  console.log("S_Emission: ", emission);
  const time = route.properties.duration_hours;
  const geometry = {
    type: "LineString", coordinates: [originCoords, ...route.geometry.coordinates, destinationCoords]
  };

  return [distance, emission, time, geometry];
};

const findTruckRoute = async ([lon1, lat1], [lon2, lat2], maxDistance) => {
  const emission_per_ton_km = 105;
  const totalLoad = 35;
  // Don't bother caculating very long routes
  if (haversineDistance([lon1, lat1], [lon2, lat2]) > maxDistance) {
    console.log("   vvv Route too long vvv");
    return [null, null, null, null];
  }

  // Get the route from Mapbox API
  const response = await axios.get(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?access_token=${MAPBOX_API_TOKEN}&alternatives=false&geometries=geojson&exclude=ferry`
  );

  // Check if a route was found
  if (!response.data.routes || response.data.routes.length === 0) {
    return [null, null, null, null];
  }

  const route = response.data.routes[0];
  const distance = route.distance / 1000;
  const emission = (distance * emission_per_ton_km / totalLoad / 1000);
  const time = route.duration / 60 / 60;
  
  originCoords = [lon1, lat1];
  destinationCoords = [lon2, lat2];
  
  const geometry = {
    type: "LineString", coordinates: [originCoords, ...route.geometry.coordinates, destinationCoords]
  };

  return [distance, emission, time, geometry];
};

// !!! Not implemented !!!
const findRailRoute = (coordinates) => {
  const emission_per_ton_km = 0.001;
  const speed_km_h = 100;
  const totalLoad = 1500;

  let totalDistance = 0;

  // Calculate the total distance along all waypoints
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += haversineDistance(coordinates[i], coordinates[i + 1]);
  }

  const emission = (totalDistance * emission_per_ton_km / totalLoad / 1000);
  const time = totalDistance / speed_km_h;
  
  const geometry = {
    type: "LineString",
    coordinates: coordinates  // Use the full route coordinates
  };

  return [totalDistance, emission, time, geometry];
};

module.exports = { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute };

