import { useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'
import './MapView.css'

const API_TOKEN = import.meta.env.VITE_API_TOKEN

function MapView() {

  const mapRef = useRef()
  const mapContainerRef = useRef()

  useEffect(() => {
    mapboxgl.accessToken = API_TOKEN
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
    })

    return () => {
      mapRef.current.remove()
    }
  }, [])

  return (
    <>
      <div id='map-container' ref={mapContainerRef}/>
    </>
  )
}

export default MapView
