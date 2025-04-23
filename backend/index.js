const express = require('express')
const cors = require("cors")

const findBestRoutes = require('./route-calculation/routes.js')

const PORT = 3000

const app = express()

app.use(cors())

app.use(express.json())

app.get("/routes", async (req, res) => {
  try {
    const origin = req.query.origin;
    const destination = req.query.destination;
    const originCoordinates = req.query.originCoords;
    const destinationCoordinates = req.query.destCoords;
    const useSea = req.query.useSea === 'true';
    const useAir = req.query.useAir === 'true';
    const useRail = req.query.useRail === 'true';
    const truckType = req.query.truckType;
    const trainType = req.query.trainType;

    console.log(`Route request received: ${origin} -> ${destination}`);
    console.log(`Coordinates: ${originCoordinates} -> ${destinationCoordinates}`);

    if (!originCoordinates || !destinationCoordinates) {
      console.error("Missing coordinates in request");
      return res.status(400).json({ error: "Missing origin or destination coordinates" });
    }
    
    // Parse coordinates into arrays
    const originCoordsArray = originCoordinates.split(",").map(Number);
    const destCoordsArray = destinationCoordinates.split(",").map(Number);

    if (originCoordsArray.length !== 2 || destCoordsArray.length !== 2) {
      console.error("Invalid coordinates format");
      return res.status(400).json({ error: "Invalid origin or destination coordinates" });
    }

    console.log("Finding best routes...");
    // Find the best routes
    const routes = await findBestRoutes(origin, destination, originCoordsArray, destCoordsArray, useSea, useAir, useRail, truckType, trainType);
    
    console.log("Routes found:", routes ? "Yes" : "No");
    if (routes) {
      console.log("Fastest route:", routes.fastest ? "Found" : "Not found");
      console.log("Lowest emission route:", routes.lowestEmission ? "Found" : "Not found");
    }

    res.json(routes);

  } catch (error) {
    console.error("Error in /routes endpoint:", error);
    res.status(500).json({ error: "Failed to find routes", details: error.message });
  }
})

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
