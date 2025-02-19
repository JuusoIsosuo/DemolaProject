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

    if (!originCoordinates || !destinationCoordinates) {
      return res.status(400).json({ error: "Missing origin or destination coordinates" });
    }
    const originCoordinatesArray = originCoordinates.split(",").map(Number);
    const destinationCoordinatesArray = destinationCoordinates.split(",").map(Number);

    if (originCoordinatesArray.length !== 2 || destinationCoordinatesArray.length !== 2) {
      return res.status(400).json({ error: "Invalid origin or destination coordinates" });
    }

    // Find the best routes
    const routes = await findBestRoutes(origin, destination, originCoordinatesArray, destinationCoordinatesArray);

    res.json(routes);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to find routes" });
  }
})

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
