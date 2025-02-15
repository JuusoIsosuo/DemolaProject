import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import axios from 'axios';

import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const GEOCODE_API = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

const RouteForm = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(8px);
  width: 240px;
`;

const Input = styled.input`
  width: 200px;
  padding: 0.5rem;
  margin: 0.25rem auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  display: block;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Button = styled.button`
  width: 200px;
  padding: 0.5rem;
  margin: 0.5rem auto 0;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;

  &:hover {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

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
  const [routeToShow, setRouteToShow] = useState('green');

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
          `http://localhost:3000/routes?origin=${origin}&destination=${destination}&originCoords=${originCoords.join(',')}&destCoords=${destCoords.join(',')}`
        );
        
        console.log(response.data)

        setRouteData(response.data);

        showRoutes(response.data);
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

  // Update route that is shown
  useEffect(() => {
    if ( routeData ) {
      showRoutes(routeData);
    }
  }, [routeToShow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await calculateRoute();
  };

  const showRoutes = (data) => {
    if (map.current.getSource('routes')) {
      if (map.current.getLayer('route-sea')) map.current.removeLayer('route-sea');
      if (map.current.getLayer('route-air')) map.current.removeLayer('route-air');
      if (map.current.getLayer('route-truck')) map.current.removeLayer('route-truck');
      if (map.current.getLayer('route-rail')) map.current.removeLayer('route-rail');
      
      map.current.removeSource('routes');
    }

    if ( routeToShow === 'green' ) {
      map.current.addSource('routes', {
        type: 'geojson',
        data: data.lowestEmission.geojson,
      });
    } 
    else if ( routeToShow === 'fast' ) {
      map.current.addSource('routes', {
        type: 'geojson',
        data: data.fastest.geojson,
      });
    }

    map.current.addLayer({
      id: 'route-sea',
      type: 'line',
      source: 'routes',
      paint: { 'line-color': 'blue', 'line-width': 3 },
      filter: ['==', 'transport', 'sea'],
    });

    map.current.addLayer({
      id: 'route-air',
      type: 'line',
      source: 'routes',
      paint: { 'line-color': 'red', 'line-width': 3 },
      filter: ['==', 'transport', 'air'],
    });

    map.current.addLayer({
      id: 'route-truck',
      type: 'line',
      source: 'routes',
      paint: { 'line-color': 'black', 'line-width': 3 },
      filter: ['==', 'transport', 'truck'],
    });

    map.current.addLayer({
      id: 'route-rail',
      type: 'line',
      source: 'routes',
      paint: { 'line-color': 'green', 'line-width': 3 },
      filter: ['==', 'transport', 'rail'],
    });

    // Fit the map to the route bounds
    const coordinates = data.fastest.geojson.features[0].geometry.coordinates;
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.current.fitBounds(bounds, {
      padding: 50,
      pitch: 0,
      bearing: 0
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100vh', position: 'relative' }}
    >
      <RouteForm>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Update Route'}
          </Button>
        </form>
      </RouteForm>
      <div ref={mapContainer} id="map-container" />
      <Button type="button" onClick={() => routeToShow === "green" ? setRouteToShow("fast") : setRouteToShow("green")}>
        {routeToShow === "green" ? "Show Fastest Route" : "Show Greenest Route"}
      </Button>
    </motion.div>
  );
};

export default Map;
