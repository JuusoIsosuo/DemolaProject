const fs = require("fs");
const path = require('path');
const { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute } = require('./find-routes.js');
const sequelize = require('./config/database');
const Location = require('./models/Location');
const Connection = require('./models/Connection');

// Load the GeoJSON files
const AIRPORTS = JSON.parse(fs.readFileSync('./data/airports.geojson', 'utf8'));
const PORTS = JSON.parse(fs.readFileSync('./data/ports.geojson', 'utf8'));
const RAILWAYS = JSON.parse(fs.readFileSync('./data/railway_connections.geojson', 'utf8'));
const RAILWAY_STATIONS = JSON.parse(fs.readFileSync('./data/railway_stations.geojson', 'utf8'));

// Initialize processed edges counter
const processedEdges = {
  air: 0,
  sea: 0,
  rail: 0,
  truck: 0
};

// Convert GeoJSON to graph representation
const buildGraph = async () => {
  try {
    // Sync database tables
    await sequelize.sync({ force: true }); // This will drop existing tables and recreate them

    const airport_locations = AIRPORTS.features;
    const port_locations = PORTS.features;
    const railway_connections = RAILWAYS.features;
    const railway_locations = RAILWAY_STATIONS.features;
    const locations = [...airport_locations, ...port_locations, ...railway_locations];

    // Create all locations first
    const locationMap = new Map();
    for (const location of locations) {
      const [dbLocation] = await Location.findOrCreate({
        where: { name: location.properties.name },
        defaults: {
          coordinates: location.geometry.coordinates
        }
      });
      locationMap.set(location.properties.name, dbLocation);
    }

    // Generate edges between airport locations
    for (let i = 0; i < airport_locations.length; i++) {
      for (let j = i + 1; j < airport_locations.length; j++) {
        const locA = airport_locations[i];
        const locB = airport_locations[j];
        const fromCoords = locA.geometry.coordinates;
        const toCoords = locB.geometry.coordinates;

        const [distance, emission, time, geometry] = findAirRoute(fromCoords, toCoords);
        if (distance && emission && time && geometry) {
          await Connection.create({
            fromLocationId: locationMap.get(locA.properties.name).id,
            toLocationId: locationMap.get(locB.properties.name).id,
            transport: 'air',
            distance,
            emission,
            time,
            geometry
          });

          processedEdges.air++;
          console.log(processedEdges);
        }
      }
    }

    // Generate edges between port locations
    for (let i = 0; i < port_locations.length; i++) {
      for (let j = i + 1; j < port_locations.length; j++) {
        const locA = port_locations[i];
        const locB = port_locations[j];
        const fromCoords = locA.geometry.coordinates;
        const toCoords = locB.geometry.coordinates;

        const [distance, emission, time, geometry] = findSeaRoute(fromCoords, toCoords);
        if (distance && emission && time && geometry) {
          await Connection.create({
            fromLocationId: locationMap.get(locA.properties.name).id,
            toLocationId: locationMap.get(locB.properties.name).id,
            transport: 'sea',
            distance,
            emission,
            time,
            geometry
          });

          processedEdges.sea++;
          console.log(processedEdges);
        }
      }
    }

    // Generate edges between railway locations
    for (let i = 0; i < railway_connections.length; i++) {
      const connection = railway_connections[i];
      const [fromName, toName] = connection.properties.route;
      const fromCoords = connection.geometry.coordinates[0];
      const toCoords = connection.geometry.coordinates[connection.geometry.coordinates.length - 1];

      const [distance, emission, time, geometry] = findRailRoute(fromCoords, toCoords);
      if (distance && emission && time && geometry) {
        await Connection.create({
          fromLocationId: locationMap.get(fromName).id,
          toLocationId: locationMap.get(toName).id,
          transport: 'rail',
          distance,
          emission,
          time,
          geometry
        });

        processedEdges.rail++;
        console.log(processedEdges);
      }
    }

    // Generate truck routes between all locations
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const locA = locations[i];
        const locB = locations[j];
        const fromCoords = locA.geometry.coordinates;
        const toCoords = locB.geometry.coordinates;

        try {
          const [distance, emission, time, geometry] = await findTruckRoute(fromCoords, toCoords, maxDistance = 5000);
          if (distance && emission && time && geometry) {
            await Connection.create({
              fromLocationId: locationMap.get(locA.properties.name).id,
              toLocationId: locationMap.get(locB.properties.name).id,
              transport: 'truck',
              distance,
              emission,
              time,
              geometry
            });

            processedEdges.truck++;
            console.log(processedEdges);
          }
        } catch (error) {
          console.log(`Unable to find truck route between ${locA.properties.name} and ${locB.properties.name}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('Graph building completed successfully');
    return processedEdges;
  } catch (error) {
    console.error('Error building graph:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  (async () => {
    try {
      await buildGraph();
      console.log('Graph building completed');
    } catch (error) {
      console.error('Failed to build graph:', error);
      process.exit(1);
    }
  })();
}

module.exports = buildGraph;
