import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'

import 'mapbox-gl/dist/mapbox-gl.css'
import './Map.css'

const API_TOKEN = import.meta.env.VITE_API_TOKEN

const Map = () => {
  const mapRef = useRef()
  const mapContainerRef = useRef()
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:3000/routes")
      .then((response) => {
        setRouteData(response.data)
      })
  }, [])  

  useEffect(() => {
    mapboxgl.accessToken = API_TOKEN
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-74, 40],
      zoom: 0
    })

    const map = mapRef.current

    map.on("load", () => {
      if (routeData) {
        // Add the GeoJSON source
        map.addSource("routes", {
          type: "geojson",
          data: routeData
        })

        // Add different route layers
        map.addLayer({
          id: "route-sea",
          type: "line",
          source: "routes",
          paint: { "line-color": "blue", "line-width": 3 },
          filter: ["==", "transport", "sea"]
        })

        map.addLayer({
          id: "route-air",
          type: "line",
          source: "routes",
          paint: { "line-color": "red", "line-width": 2, "line-dasharray": [2, 2] },
          filter: ["==", "transport", "air"]
        })

        map.addLayer({
          id: "route-truck",
          type: "line",
          source: "routes",
          paint: { "line-color": "black", "line-width": 2, "line-dasharray": [2, 2] },
          filter: ["==", "transport", "truck"]
        })
      }
    })

    return () => map.remove()
  }, [routeData])

  return (
    <>
      <div id='map-container' ref={mapContainerRef}/>
    </>
  )
}

export default Map
