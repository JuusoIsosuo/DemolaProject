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

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 90vh;
  padding: 20px;
  gap: 15px;
  max-height: 90vh;
  overflow: hidden;
`;

const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  width: 200px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const WeightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const WeightInput = styled(SearchInput)`
  width: 80px;
`;

const UnitSelect = styled.select`
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  width: 60px;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const SwapButton = styled.button`
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 5px;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const CalculateButton = styled.button`
  padding: 8px 16px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

const RouteTypeSelect = styled.div`
  display: flex;
  gap: 10px;
  margin-left: 10px;
`;

const RouteTypeButton = styled.button`
  padding: 8px 16px;
  background-color: ${props => {
    if (props.active) {
      return props.isGreen ? '#059669' : '#2563eb';
    }
    return 'white';
  }};
  color: ${props => props.active ? 'white' : props.isGreen ? '#059669' : '#2563eb'};
  border: 1px solid ${props => props.isGreen ? '#059669' : '#2563eb'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => {
      if (props.active) {
        return props.isGreen ? '#047857' : '#1d4ed8';
      }
      return '#f8fafc';
    }};
  }
`;

const MapContainer = styled.div`
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  max-height: calc(100vh - 120px);
`;

const RouteInfoOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(8px);
  width: 280px;
  z-index: 1000;
`;

const InfoSection = styled.div`
  margin-bottom: 1rem;
  
  h3 {
    font-size: 0.9rem;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
    color: #1f2937;
  }
`;

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [origin, setOrigin] = useState(location.state?.origin || '');
  const [destination, setDestination] = useState(location.state?.destination || '');
  const [weight, setWeight] = useState(location.state?.weight || '');
  const [routeData, setRouteData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [routeType, setRouteType] = useState(location.state?.routeType || 'fastest');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [weightUnit, setWeightUnit] = useState(location.state?.weightUnit || 'kg');

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
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
      projection: 'mercator'
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('style.load', () => {
      const layers = map.current.getStyle().layers;
      for (const layer of layers) {
        if (layer.type === 'symbol' && 
            layer.layout && 
            layer.layout['text-field'] && 
            (layer.id.includes('label') || layer.id.includes('place'))) {
          map.current.setLayoutProperty(layer.id, 'visibility', 'none');
        }
      }
      setMapInitialized(true);
    });

    return () => {
      if (map.current) {
        const markers = document.getElementsByClassName('mapboxgl-marker');
        while (markers.length > 0) {
          markers[0].remove();
        }
        map.current.remove();
      }
    };
  }, []);

  // Add new useEffect for markers
  useEffect(() => {
    const addLocationMarker = async (location, type) => {
      if (!location || !map.current) return;
      
      try {
        const coords = await getCoordinates(location);
        if (!coords) return;

        // Create marker element
        const markerEl = document.createElement('div');
        markerEl.className = `marker-${type}`;
        markerEl.style.width = '24px';
        markerEl.style.height = '24px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '3px solid #fff';
        markerEl.style.backgroundColor = type === 'origin' ? '#2563eb' : '#dc2626';
        markerEl.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
        markerEl.style.cursor = 'pointer';

        // Add text element
        const textEl = document.createElement('div');
        textEl.style.position = 'absolute';
        textEl.style.top = '30px';
        textEl.style.left = '50%';
        textEl.style.transform = 'translateX(-50%)';
        textEl.style.backgroundColor = 'white';
        textEl.style.padding = '4px 8px';
        textEl.style.borderRadius = '4px';
        textEl.style.fontSize = '14px';
        textEl.style.fontWeight = 'bold';
        textEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        textEl.style.whiteSpace = 'nowrap';
        textEl.textContent = location;
        markerEl.appendChild(textEl);

        // Create and add marker
        new mapboxgl.Marker({
          element: markerEl,
          anchor: 'center'
        })
        .setLngLat(coords)
        .addTo(map.current);
      } catch (error) {
        console.error(`Error adding ${type} marker:`, error);
      }
    };

    // Remove existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers.length > 0) {
      markers[0].remove();
    }

    // Add new markers
    if (mapInitialized) {
      addLocationMarker(origin, 'origin');
      addLocationMarker(destination, 'destination');
    }
  }, [origin, destination, mapInitialized]);

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
        
        console.log(response.data);
        console.log('Fastest route:', response.data.fastest);
        console.log('Lowest emission route:', response.data.lowestEmission);

        setRouteData(response.data);
        showRoutes(response.data);

        // Avataan sivupalkki automaattisesti ensimmäisellä reitillä
        const routeData = routeType === 'fastest' ? response.data.fastest : response.data.lowestEmission;
        if (routeData.geojson.features.length > 0) {
          handleRouteClick(routeData.geojson.features[0], routeData);
        }

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
    if (routeData) {
      showRoutes(routeData);
    }
  }, [routeType, routeData]);

  // Add new useEffect for updating route information when route type changes
  useEffect(() => {
    if (routeData) {
      const currentRoute = routeType === 'fastest' ? routeData.fastest : routeData.lowestEmission;
      if (currentRoute.geojson.features.length > 0) {
        handleRouteClick(currentRoute.geojson.features[0], currentRoute);
      }
    }
  }, [routeType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await calculateRoute();
  };

  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const showRoutes = (data) => {
    // Poistetaan vanhat reitit
    ['sea', 'air', 'truck', 'rail'].forEach(type => {
      if (map.current.getLayer(`route-${type}`)) {
        map.current.removeLayer(`route-${type}`);
      }
      if (map.current.getLayer(`route-${type}-highlighted`)) {
        map.current.removeLayer(`route-${type}-highlighted`);
      }
    });

    if (map.current.getSource('routes')) {
      map.current.removeSource('routes');
    }
    if (map.current.getSource('highlighted-route')) {
      map.current.removeSource('highlighted-route');
    }

    const routeData = routeType === 'fastest' ? data.fastest : data.lowestEmission;

    map.current.addSource('routes', {
      type: 'geojson',
      data: routeData.geojson,
    });

    // Add routes for each transport type
    ['sea', 'air', 'truck', 'rail'].forEach(transportType => {
      map.current.addLayer({
        id: `route-${transportType}`,
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': getRouteColor(transportType),
          'line-width': 6,
          'line-opacity': 0.8,
          'line-dasharray': getRouteDashArray(transportType)
        },
        filter: ['==', 'transport', transportType],
      });

      // Add click event for each route type
      map.current.on('click', `route-${transportType}`, (e) => {
        if (e.features.length > 0) {
          const clickedFeature = e.features[0];
          handleRouteClick(clickedFeature, routeData);
        }
      });

      // Add hover effect
      map.current.on('mouseenter', `route-${transportType}`, () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', `route-${transportType}`, () => {
        map.current.getCanvas().style.cursor = '';
      });
    });

    // Only fit bounds when calculating new route, not when switching route types
    if (!map.current.getSource('routes')) {
      const coordinates = routeData.geojson.features[0].geometry.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 50,
        pitch: 0,
        bearing: 0
      });
    }
  }

  // Lisätään apufunktioita
  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const calculateEcoRating = (emissions) => {
    if (!emissions) return '-';
    if (emissions < 1000) return 'Erinomainen';
    if (emissions < 2000) return 'Hyvä';
    if (emissions < 5000) return 'Kohtalainen';
    return 'Korkeat päästöt';
  };

  // Lisätään apufunktio kuljetusmuotojen kääntämiseen
  const translateTransportType = (type) => {
    const translations = {
      'truck': 'Maantiekuljetus',
      'rail': 'Rautatiekuljetus',
      'sea': 'Merikuljetus',
      'air': 'Lentokuljetus'
    };
    return translations[type] || type;
  };

  // Lisätään apufunktio etäisyyden laskemiseen
  const calculateDistance = (path) => {
    // Tässä voisi laskea etäisyyden koordinaattien perusteella
    // Toistaiseksi palautetaan arvio
    return 1000; // placeholder
  };

  // Lisätään apufunktiot reittien tyyleille
  const getRouteColor = (type) => {
    const colors = {
      'sea': '#2563eb',
      'air': '#dc2626',
      'truck': '#374151',
      'rail': '#059669'
    };
    return colors[type] || '#374151';
  };

  const getRouteDashArray = (type) => {
    const dashArrays = {
      'sea': [1, 0],
      'air': [3, 3],
      'truck': [1, 0],
      'rail': [8, 4]
    };
    return dashArrays[type] || [1, 0];
  };

  // Muokataan click handleria
  const handleRouteClick = (feature, route) => {
    setSelectedSegment(null);
    
    let weightValue = parseFloat(weight) || 1; // Default to 1 if no weight entered
    if (weightUnit === 't') {
      weightValue = weightValue * 1000; // Convert tons to kg
    }
    
    setSelectedRoute({
      length: route.totalDistance.toFixed(0) || '-',
      duration: formatDuration(route.totalTime * 3600) || '-',
      emissions: (route.totalEmission * weightValue).toFixed(2) || '-',
      segments: route.geojson.features.map(feature => ({
        transport: translateTransportType(feature.properties.transport),
        from: feature.properties.from || '-',
        to: feature.properties.to || '-'
      }))
    });
  };

  return (
    <PageContainer>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <SwapButton
          onClick={handleSwapLocations}
          title="Swap origin and destination"
        >
          ⇅
        </SwapButton>
        <SearchInput
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <WeightContainer>
          <WeightInput
            type="number"
            placeholder="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <UnitSelect
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value)}
          >
            <option value="kg">kg</option>
            <option value="t">t</option>
          </UnitSelect>
        </WeightContainer>
        <CalculateButton
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Calculate Route'}
        </CalculateButton>
        <RouteTypeSelect>
          <RouteTypeButton
            active={routeType === 'fastest'}
            onClick={() => setRouteType('fastest')}
          >
            Fastest Route
          </RouteTypeButton>
          <RouteTypeButton
            active={routeType === 'green'}
            onClick={() => setRouteType('green')}
            isGreen={true}
          >
            Lowest Emission
          </RouteTypeButton>
        </RouteTypeSelect>
      </SearchContainer>

      <MapContainer>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        {selectedRoute && (
          <RouteInfoOverlay>
            <InfoSection>
              <h3>Route Information</h3>
              <p><strong>From:</strong> {origin}</p>
              <p><strong>To:</strong> {destination}</p>
              <p><strong>Total Distance:</strong> {selectedRoute.length} km</p>
              <p><strong>Estimated Duration:</strong> {selectedRoute.duration}</p>
              <p><strong>CO2 Emissions:</strong> {selectedRoute.emissions} g</p>
            </InfoSection>
          </RouteInfoOverlay>
        )}
      </MapContainer>
    </PageContainer>
  );
};

export default Map;