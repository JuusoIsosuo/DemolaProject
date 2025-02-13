import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';

import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const GEOCODE_API = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

const Map = () => {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [routeData, setRouteData] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // Convert address to coordinates using Mapbox Geocoding API
  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(`${GEOCODE_API}${encodeURIComponent(address)}.json?access_token=${API_TOKEN}`);
      if (response.data.features.length > 0) {
        return response.data.features[0].geometry.coordinates; // Returns [lng, lat]
      }
    } catch (error) {
      console.error("Error getting coordinates:", error);
    }
    return null;
  };

  // Fetch sea route after both addresses are resolved to coordinates
  const getRoute = async () => {
    const originCoords = await getCoordinates(origin);
    const destCoords = await getCoordinates(destination);

    if (originCoords && destCoords) {
      axios.get(`http://localhost:3000/searoute?origin=${originCoords.join(',')}&destination=${destCoords.join(',')}`)
        .then((response) => {
          setRouteData(response.data);
        })
        .catch((error) => console.error("Error fetching route:", error));
    } else {
      alert("Invalid origin or destination coordinates.");
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = API_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [20, 20],
      zoom: 1.5,
    });

    const map = mapRef.current;

    map.on('load', () => {
      if (routeData) {
        // Add the GeoJSON source
        map.addSource('routes', {
          type: 'geojson',
          data: routeData,
        });

        // Add route layers
        map.addLayer({
          id: 'route-sea',
          type: 'line',
          source: 'routes',
          paint: { 'line-color': 'blue', 'line-width': 3 },
          filter: ['==', 'transport', 'sea'],
        });
      }
    });

    return () => map.remove();
  }, [routeData]);

  return (
    <>
      <div id="map-container" ref={mapContainerRef} />
      <div className="search-box">
        <input
          type="text"
          placeholder="Origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <button onClick={getRoute}>Get Route</button>
      </div>
    </>
  );
};

export default Map;
