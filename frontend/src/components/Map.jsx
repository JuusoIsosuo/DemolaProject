import { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import styled from '@emotion/styled';
import axios from 'axios';

import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const GEOCODE_API = "https://api.mapbox.com/geocoding/v5/mapbox.places/";

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const ToggleButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #1d4ed8;
  }
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

const Map = ({ 
  origin = '', 
  destination = '', 
  weight = '', 
  weightUnit = '', 
  routeType = 'lowestEmission',
  routeData,
  onCalculateRoute,
  isLoading 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showCityLabels, setShowCityLabels] = useState(false);

  // Convert address to coordinates using Mapbox Geocoding API
  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(
        `${GEOCODE_API}${encodeURIComponent(address)}.json?access_token=${API_TOKEN}`
      );
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

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on('style.load', () => {
      const layers = map.current.getStyle().layers;
      for (const layer of layers) {
        if (
          layer.type === 'symbol' && 
          layer.layout && 
          layer.layout['text-field'] && 
          (layer.id.includes('label') || layer.id.includes('place'))
        ) {
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

  // Add markers effect for origin and destination
  useEffect(() => {
    const addLocationMarker = async (location, type) => {
      if (!location || !map.current) return;
      
      try {
        const coords = await getCoordinates(location);
        if (!coords) return;

        const markerEl = document.createElement('div');
        markerEl.className = `marker-${type}`;
        markerEl.style.width = '24px';
        markerEl.style.height = '24px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '3px solid #fff';
        markerEl.style.backgroundColor = type === 'origin' ? '#2563eb' : '#dc2626';
        markerEl.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.25)';
        markerEl.style.cursor = 'pointer';

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

    if (mapInitialized) {
      addLocationMarker(origin, 'origin');
      addLocationMarker(destination, 'destination');
    }
  }, [origin, destination, mapInitialized]);

  // Trigger route calculation if needed.
  useEffect(() => {
    if (mapInitialized && location.state?.shouldCalculateRoute && origin && destination) {
      onCalculateRoute();
      navigate('.', { state: { ...location.state, shouldCalculateRoute: false }, replace: true });
    }
  }, [mapInitialized, location.state?.shouldCalculateRoute, origin, destination]);

  // Update route effect
  useEffect(() => {
    if (routeData && mapInitialized) {
      if (Array.isArray(routeData)) {
        showMultipleRoutes(routeData);
      } else {
        showSingleRoute(routeData);
      }
    }
  }, [routeType, routeData, mapInitialized]);

  // Route information update effect
  useEffect(() => {
    if (!routeData) return;

    if (Array.isArray(routeData)) {
      const firstRoute = routeData[0];
      if (firstRoute) {
        const currentRoute = routeType === 'fastest' ? firstRoute.fastest : firstRoute.lowestEmission;
        if (currentRoute && currentRoute.geojson.features.length > 0) {
          handleRouteClick(currentRoute.geojson.features[0], currentRoute);
        }
      }
    } else {
      const currentRoute = routeType === 'fastest' ? routeData.fastest : routeData.lowestEmission;
      if (currentRoute && currentRoute.geojson.features.length > 0) {
        handleRouteClick(currentRoute.geojson.features[0], currentRoute);
      }
    }
  }, [routeType, routeData]);

  const showSingleRoute = (data) => {
    clearMapLayers();
    const routeData = routeType === 'fastest' ? data.fastest : data.lowestEmission;
    
    map.current.addSource('routes', {
      type: 'geojson',
      data: routeData.geojson,
    });

    addRouteLayers(routeData);
    fitMapToBounds(routeData.geojson.features);
  };

  const showMultipleRoutes = (dataArray) => {
    clearMapLayers();
    const combinedGeojson = { type: 'FeatureCollection', features: [] };
    
    dataArray.forEach(data => {
      const chosenRoute = routeType === 'fastest' ? data.fastest : data.lowestEmission;
      if (chosenRoute && chosenRoute.geojson) {
        combinedGeojson.features.push(...chosenRoute.geojson.features);
      }
    });

    if (combinedGeojson.features.length > 0) {
      map.current.addSource('routes', {
        type: 'geojson',
        data: combinedGeojson,
      });

      addRouteLayers(combinedGeojson);
      fitMapToBounds(combinedGeojson.features);
    }
  };

  const clearMapLayers = () => {
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
  };

  const addRouteLayers = (routeData) => {
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

      map.current.on('click', `route-${transportType}`, (e) => {
        if (e.features.length > 0) {
          const clickedFeature = e.features[0];
          handleRouteClick(clickedFeature, routeData);
        }
      });

      map.current.on('mouseenter', `route-${transportType}`, () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', `route-${transportType}`, () => {
        map.current.getCanvas().style.cursor = '';
      });
    });
  };

  const fitMapToBounds = (features) => {
    if (!features || features.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach(coord => {
          bounds.extend(coord);
        });
      } else if (feature.geometry.type === 'MultiLineString') {
        feature.geometry.coordinates.forEach(line => {
          line.forEach(coord => {
            bounds.extend(coord);
          });
        });
      }
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      pitch: 0,
      bearing: 0
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}min`;
    }
    return `${hours}h ${minutes}min`;
  };

  const formatEmissions = (emissions) => {
    if (!emissions) return '-';
    
    if (emissions >= 1000) {
      return `${(emissions / 1000).toFixed(2)} kg`;
    }
    return `${emissions.toFixed(2)} g`;
  };

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

  const handleRouteClick = (feature, route) => {
    setSelectedSegment(null);
    
    let weightValue = parseFloat(weight) || 1;
    if (weightUnit === 't') {
      weightValue = weightValue * 1000;
    }
    
    setSelectedRoute({
      length: route.totalDistance ? route.totalDistance.toFixed(0) : '-',
      duration: formatDuration(route.totalTime ? route.totalTime * 3600 : 0) || '-',
      emissions: formatEmissions(route.totalEmission ? route.totalEmission * weightValue : 0) || '-',
      segments: route.geojson && route.geojson.features
        ? route.geojson.features.map(feature => ({
            transport: translateTransportType(feature.properties.transport),
            from: feature.properties.from || '-',
            to: feature.properties.to || '-'
          }))
        : []
    });
  };

  const translateTransportType = (type) => {
    const translations = {
      'truck': 'Maantiekuljetus',
      'rail': 'Rautatiekuljetus',
      'sea': 'Merikuljetus',
      'air': 'Lentokuljetus'
    };
    return translations[type] || type;
  };

  const toggleCityLabels = () => {
    const newShowCityLabels = !showCityLabels;
    setShowCityLabels(newShowCityLabels);
    
    const layers = map.current.getStyle().layers;
    for (const layer of layers) {
      if (
        layer.type === 'symbol' &&
        layer.layout &&
        layer.layout['text-field'] &&
        (layer.id.includes('label') || layer.id.includes('place'))
      ) {
        map.current.setLayoutProperty(
          layer.id,
          'visibility',
          newShowCityLabels ? 'visible' : 'none'
        );
      }
    }
  };

  return (
    <MapContainer>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <ToggleButton onClick={toggleCityLabels}>
        {showCityLabels ? 'Hide City Labels' : 'Show City Labels'}
      </ToggleButton>
      {selectedRoute && (
        <RouteInfoOverlay>
          <InfoSection>
            <h3>Route Information</h3>
            <p><strong>From:</strong> {origin}</p>
            <p><strong>To:</strong> {destination}</p>
            <p><strong>Total Distance:</strong> {selectedRoute.length} km</p>
            <p><strong>Estimated Duration:</strong> {selectedRoute.duration}</p>
            <p><strong>CO2 Emissions:</strong> {selectedRoute.emissions}</p>
          </InfoSection>
        </RouteInfoOverlay>
      )}
    </MapContainer>
  );
};

export default Map;
