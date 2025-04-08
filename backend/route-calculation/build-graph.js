const fs = require("fs");
const path = require('path');
const { findAirRoute, findSeaRoute, findTruckRoute, findRailRoute } = require('./find-routes.js');
const supabase = require('./config/database');

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
    // Test connection to Supabase
    const { data, error } = await supabase.from('locations').select('count');
    if (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
    console.log('Connection has been established successfully.');

    // Clear existing data
    await supabase.from('connections').delete().neq('id', 0);
    await supabase.from('locations').delete().neq('id', 0);

    const airport_locations = AIRPORTS.features;
    const port_locations = PORTS.features;
    const railway_connections = RAILWAYS.features;
    const railway_locations = RAILWAY_STATIONS.features;
    const locations = [...airport_locations, ...port_locations, ...railway_locations];

    // Create all locations first
    const locationMap = new Map();
    for (const location of locations) {
      // Check if location already exists
      const { data: existingLocations, error: searchError } = await supabase
        .from('locations')
        .select('id')
        .eq('name', location.properties.name);
      
      if (searchError) {
        console.error(`Error searching for location ${location.properties.name}:`, searchError);
        continue;
      }

      let locationId;
      if (existingLocations && existingLocations.length > 0) {
        locationId = existingLocations[0].id;
      } else {
        // Insert new location
        const { data: newLocation, error: insertError } = await supabase
          .from('locations')
          .insert([{ 
            name: location.properties.name, 
            coordinates: location.geometry.coordinates 
          }])
          .select('id');
        
        if (insertError) {
          console.error(`Error inserting location ${location.properties.name}:`, insertError);
          continue;
        }
        
        locationId = newLocation[0].id;
      }
      
      locationMap.set(location.properties.name, { id: locationId });
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
          const { error } = await supabase
            .from('connections')
            .insert([{
              from_location_id: locationMap.get(locA.properties.name).id,
              to_location_id: locationMap.get(locB.properties.name).id,
              transport: 'air',
              distance,
              emission,
              time,
              geometry
            }]);
          
          if (error) {
            console.error(`Error creating air connection between ${locA.properties.name} and ${locB.properties.name}:`, error);
          } else {
            processedEdges.air++;
            console.log(processedEdges);
          }
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
          const { error } = await supabase
            .from('connections')
            .insert([{
              from_location_id: locationMap.get(locA.properties.name).id,
              to_location_id: locationMap.get(locB.properties.name).id,
              transport: 'sea',
              distance,
              emission,
              time,
              geometry
            }]);
          
          if (error) {
            console.error(`Error creating sea connection between ${locA.properties.name} and ${locB.properties.name}:`, error);
          } else {
            processedEdges.sea++;
            console.log(processedEdges);
          }
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
        const { error } = await supabase
          .from('connections')
          .insert([{
            from_location_id: locationMap.get(fromName).id,
            to_location_id: locationMap.get(toName).id,
            transport: 'rail',
            distance,
            emission,
            time,
            geometry
          }]);
        
        if (error) {
          console.error(`Error creating rail connection between ${fromName} and ${toName}:`, error);
        } else {
          processedEdges.rail++;
          console.log(processedEdges);
        }
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
            const { error } = await supabase
              .from('connections')
              .insert([{
                from_location_id: locationMap.get(locA.properties.name).id,
                to_location_id: locationMap.get(locB.properties.name).id,
                transport: 'truck',
                distance,
                emission,
                time,
                geometry
              }]);
            
            if (error) {
              console.error(`Error creating truck connection between ${locA.properties.name} and ${locB.properties.name}:`, error);
            } else {
              processedEdges.truck++;
              console.log(processedEdges);
            }
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
