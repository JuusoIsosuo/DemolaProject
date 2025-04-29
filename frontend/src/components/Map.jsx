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

const Map = ({ 
  origin = '', 
  destination = '',
  routeType = 'lowestEmission',
  routeData,
  routeTypes = {},
  onCalculateRoute
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showCityLabels, setShowCityLabels] = useState(false);
  const [markers, setMarkers] = useState({});

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
      maxZoom: 18,
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

  // Add markers effect for origins and destinations
  useEffect(() => {
    if (!mapInitialized || !routeData) return;

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

        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: 'center'
        })
        .setLngLat(coords)
        .addTo(map.current);

        // Store marker in our markers object
        setMarkers(prev => ({ ...prev, [location]: marker }));
      } catch (error) {
        console.error(`Error adding ${type} marker:`, error);
      }
    };

    // Clear existing markers from the map
    Object.values(markers).forEach(marker => marker.remove());
    setMarkers({});

    // Add markers for all routes
    if (Array.isArray(routeData)) {
      routeData.forEach(route => {
        if (route.origin) addLocationMarker(route.origin, 'origin');
        if (route.destination) addLocationMarker(route.destination, 'destination');
      });
    } else {
      if (routeData.origin) addLocationMarker(routeData.origin, 'origin');
      if (routeData.destination) addLocationMarker(routeData.destination, 'destination');
    }
  }, [routeData, mapInitialized]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      Object.values(markers).forEach(marker => marker.remove());
    };
  }, []);

  // Trigger route calculation if needed.
  useEffect(() => {
    if (mapInitialized && location.state?.shouldCalculateRoute && origin && destination) {
      onCalculateRoute();
      navigate('.', { state: { ...location.state, shouldCalculateRoute: false }, replace: true });
    }
  }, [mapInitialized, location.state?.shouldCalculateRoute, origin, destination]);

  // Update route effect
  useEffect(() => {
    if (!routeData || !mapInitialized) return;

    const updateRouteAndDuration = () => {
      if (Array.isArray(routeData)) {
        showMultipleRoutes(routeData, routeTypes);
      } else {
        showSingleRoute(routeData);
      }
    };

    updateRouteAndDuration();
  }, [routeData, mapInitialized, routeType, routeTypes]);

  const showSingleRoute = (data) => {
    clearMapLayers();
    const currentRoute = routeType === 'fastest' ? data.fastest : data.lowestEmission;
    
    if (!currentRoute) return;

    map.current.addSource('routes', {
      type: 'geojson',
      data: currentRoute.geojson,
    });

    addRouteLayers(currentRoute);
    fitMapToBounds(currentRoute.geojson.features);
  };

  const showMultipleRoutes = (dataArray, routeTypes) => {
    clearMapLayers();
    const combinedGeojson = { type: 'FeatureCollection', features: [] };
    
    dataArray.forEach(route => {
      const routeType = routeTypes[route.id] || 'lowestEmission';
      const chosenRoute = routeType === 'fastest' ? route.routeData.fastest : route.routeData.lowestEmission;
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
    </MapContainer>
  );
};

export default Map;