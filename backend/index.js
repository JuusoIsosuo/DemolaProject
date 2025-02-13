const express = require('express')
const cors = require("cors")
const fs = require("fs")
const path = require("path")

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


app.get("/searoute", async (req, res) => {
  
  const { spawn } = require('child_process');

  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: "Missing 'origin' or 'destination' query parameters" });
    }

    const originCoords = origin.split(",").map(Number);
    const destinationCoords = destination.split(",").map(Number);

    if (originCoords.length !== 2 || destinationCoords.length !== 2) {
      return res.status(400).json({ error: "Invalid coordinate format. Use 'longitude,latitude'" });
    }

    const pythonProcess = spawn('python', ['searoute_script.py', JSON.stringify(originCoords), JSON.stringify(destinationCoords)]);

    let dataToSend = '';

    pythonProcess.stdout.on('data', (data) => {
      dataToSend += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: `Python process exited with code ${code}` });
      }
      try {
        const route = JSON.parse(dataToSend);
        console.log("Marine Route GeoJSON:", route);

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
        console.error("Error parsing JSON:", error);
        res.status(500).json({ error: "Error parsing JSON response from Python script" });
      }
    });
  } catch (error) {
    console.error("Error fetching marine route:", error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
