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

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
