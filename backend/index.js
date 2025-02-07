const express = require('express')
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const searoute = require('searoute-js');

const PORT = 3000

const app = express()

app.use(cors())

app.use(express.json())

app.get("/routes", (req, res) => {
  const geojsonPath = path.join(__dirname, "data", "routes.geojson")

  console.log(geojsonPath)

  fs.readFile(geojsonPath, "utf8", (err, data) => {
    console.log(data)
    if (err) {
        return res.status(500).json({ error: "Failed to read GeoJSON file" })
    }

    res.json(JSON.parse(data))
  })
})

app.get("/searoutes", async (req, res) => {
  try {
    const { originCoordinates, destinationCoordinates } = req.query;

    if (!originCoordinates || !destinationCoordinates) {
      return res.status(400).json({ error: "Missing origin or destination coordinates" })
    }

    const originCoordinatesArray = originCoordinates.split(",").map(Number)
    const destinationCoordinatesArray = destinationCoordinates.split(",").map(Number)

    if (originCoordinatesArray.length !== 2 || destinationCoordinatesArray.length !== 2) {
      return res.status(400).json({ error: "Invalid origin or destination coordinates" })
    }

    const route = await searoute(originCoordinatesArray, destinationCoordinatesArray);

    const geojson = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": { "transport": "sea" },
          "geometry": {
            "type": "LineString",
            "coordinates": route.geometry.coordinates
          }
        }
      ]
    }

    res.json(geojson);
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to find sea route" })
  }
});


app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
