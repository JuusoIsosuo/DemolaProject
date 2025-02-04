const express = require('express')
const fs = require("fs")
const path = require("path")

const PORT = 3000

const app = express()

app.use(express.json())

app.get("/routes", (req, res) => {
  const geojsonPath = path.join(__dirname, "data", "routes.geojson")

  fs.readFile(geojsonPath, "utf8", (err, data) => {
      if (err) {
          return res.status(500).json({ error: "Failed to read GeoJSON file" })
      }

      res.json(JSON.parse(data))
  })
})

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})
