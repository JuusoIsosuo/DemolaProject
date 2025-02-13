import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { motion } from 'framer-motion';
import axios from 'axios';

import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const GEOCODE_API = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [origin, setOrigin] = useState(location.state?.origin || '');
  const [destination, setDestination] = useState(location.state?.destination || '');
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Convert address to coordinates using Mapbox Geocoding API
  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(`${GEOCODE_API}${encodeURIComponent(address)}.json?access_token=${API_TOKEN}`);
      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].center;
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
    if (map.current) return;

    mapboxgl.accessToken = API_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
      projection: 'mercator' // Ensure 2D view
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('style.load', () => {
      setMapInitialized(true);
    });

    return () => map.current?.remove();
  }, []);

  // Function to calculate and display route
  const calculateRoute = async () => {
    if (!origin || !destination) return;
    
    setIsLoading(true);
    try {
      const originCoords = await getCoordinates(origin);
      const destCoords = await getCoordinates(destination);

      if (originCoords && destCoords) {
        const response = await axios.get(
          `http://localhost:3000/searoute?origin=${originCoords.join(',')}&destination=${destCoords.join(',')}`
        );
        
        if (map.current.getSource('routes')) {
          map.current.removeLayer('route-sea');
          map.current.removeSource('routes');
        }

        map.current.addSource('routes', {
          type: 'geojson',
          data: response.data,
        });

        map.current.addLayer({
          id: 'route-sea',
          type: 'line',
          source: 'routes',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#006400', 'line-width': 5, 'line-opacity': 0.5 },
          filter: ['==', 'transport', 'sea'],
        });

        // Fit the map to the route bounds
        const coordinates = response.data.features[0].geometry.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
          pitch: 0,
          bearing: 0
        });

        setRouteData(response.data);
      } else {
        alert("Invalid origin or destination coordinates.");
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Error calculating route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate route immediately when coming from home page
  useEffect(() => {
    if (mapInitialized && location.state?.shouldCalculateRoute && origin && destination) {
      calculateRoute();
      // Clear the flag to prevent recalculation on re-renders
      navigate('.', { state: { ...location.state, shouldCalculateRoute: false }, replace: true });
    }
  }, [mapInitialized, location.state?.shouldCalculateRoute, origin, destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await calculateRoute();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100vh', position: 'relative' }}
    >
      <div className="route-form">
        <form onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <button className="button" type="submit" disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Update Route'}
          </button>
        </form>
      </div>
      <div ref={mapContainer} id="map-container" />
    </motion.div>
  );
};

export default Map;
