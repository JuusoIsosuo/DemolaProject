import React, { useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import RouteInfoPopup from './RouteInfoPopup';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Styled components for layout and styling
const Container = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const Title = styled.div`
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RouteDetailsTable = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.div`
  background-color: #f3f4f6;
  padding: 0.75rem;
  font-weight: 500;
  color: #374151;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  margin: 0;
  padding: 0;
  appearance: none;
  background-color: white;
  transition: all 0.2s;

  &:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 0.75rem;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const TableCell = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
  
const ActionButton = styled.button`
    padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #ef4444;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const ModifyButton = styled.button`
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #374151;
  font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
  transition: all 0.2s;
    
    &:hover {
    background: #e5e7eb;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const AdvancedSettingsModal = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -60%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
`;

const ModalTitle = styled.h3`
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const ModalSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ModalLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }
`;

const ModalWeightContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ModalWeightInput = styled(ModalInput)`
  width: 120px;
`;

const ModalUnitSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  width: 60px;
  background: #f9fafb;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.25em;
  padding-right: 2rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background-color: white;
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const ModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const CancelButton = styled(ModalButton)`
  background: #f3f4f6;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
`;

const SaveButton = styled(ModalButton)`
  background: #3b82f6;
  color: white;

  &:hover {
    background: #2563eb;
  }
`;

const TransportTypeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
`;

const TransportButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: ${props => props.selected ? '#2563eb' : 'white'};
  color: ${props => props.selected ? 'white' : '#2563eb'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? '#1d4ed8' : '#f8fafc'};
  }
`;

const FormCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
`;

const FormCheckboxLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const RouteTypeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const RouteTypeButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  background-color: ${props => props.selected ? '#2563eb' : 'white'};
  color: ${props => props.selected ? 'white' : '#2563eb'};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? '#1d4ed8' : '#f8fafc'};
  }
`;

const formatPrice = (price) => {
  return `€${(Math.round(price * 100) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const DownloadButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }
`;

// RouteDetails component displays a sortable table of routes with their details
const RouteDetails = ({
  routes,
  setRoutes,
  selectedRoutes,
  setSelectedRoutes,
  setRouteType,
  routeTypes,
  setRouteTypes
}) => {
  // State for sorting functionality
  const [selectedRouteForModification, setSelectedRouteForModification] = useState(null);
  const [selectedTransportTypes, setSelectedTransportTypes] = useState(['truck']);
  const [modifiedWeight, setModifiedWeight] = useState('');
  const [modifiedWeightUnit, setModifiedWeightUnit] = useState('t');
  const [modifiedRouteName, setModifiedRouteName] = useState('');
  const [modifiedFragile, setModifiedFragile] = useState(false);
  const [modifiedSendDate, setModifiedSendDate] = useState('');
  const [selectedRouteForInfo, setSelectedRouteForInfo] = useState(null);

  const transportTypes = [
    { id: 'all', label: 'All' },
    { id: 'truck', label: 'Truck' },
    { id: 'rail', label: 'Rail' },
    { id: 'sea', label: 'Sea' },
    { id: 'air', label: 'Air' }
  ];

  const handleDeleteRoute = (routeId) => {
    setRoutes(routes.filter(route => route.id !== routeId));
    setSelectedRoutes(prev => {
      const next = new Set(prev);
      next.delete(routeId);
      return next;
    });
  };

  // Handle selection of individual routes
  const handleRouteToggle = (routeId) => {
    setSelectedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  // Handle selection/deselection of all routes
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRoutes(new Set(routes.map(route => route.id)));
    } else {
      setSelectedRoutes(new Set());
    }
  };

  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${import.meta.env.VITE_API_TOKEN}`
      );
      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error("Error getting coordinates:", error);
      return null;
    }
  };

  const handleModifyClick = (route) => {
    setSelectedRouteForModification(route);
    // Set initial transport types based on route data
    const types = ['truck'];
    if (route.routeData?.useRail) types.push('rail');
    if (route.routeData?.useSea) types.push('sea');
    if (route.routeData?.useAir) types.push('air');
    setSelectedTransportTypes(types);

    // Set initial weight values
    const weightValue = route.weight.replace(/[^0-9.]/g, '');
    const weightUnit = route.weight.includes('kg') ? 'kg' : 't';
    setModifiedWeight(weightValue);
    setModifiedWeightUnit(weightUnit);
    setModifiedRouteName(route.name || `${route.origin} to ${route.destination}`);
    setModifiedFragile(route.isFragile || false);
    
    // Set send date - use existing send date if available
    if (route.sendDate) {
      setModifiedSendDate(route.sendDate);
    } else {
      // If no send date exists, calculate it from delivery date
      if (route.deliveryDate) {
        const deliveryDate = new Date(route.deliveryDate);
        const currentRouteType = getRouteType(route.id);
        const routeData = route.routeData?.[currentRouteType];
        const totalTime = routeData?.totalTime || 0; // in hours
        const daysNeeded = Math.ceil(totalTime / 24) + 1;
        const sendDate = new Date(deliveryDate);
        sendDate.setDate(deliveryDate.getDate() - daysNeeded);
        setModifiedSendDate(sendDate.toISOString().split('T')[0]);
      } else {
        setModifiedSendDate('');
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedRouteForModification(null);
  };

  const handleTransportTypeClick = (typeId) => {
    if (typeId === 'truck') return; // Truck is always selected

    if (typeId === 'all') {
      setSelectedTransportTypes(['truck', 'rail', 'sea', 'air']);
      return;
    }

    const newTypes = selectedTransportTypes.includes(typeId)
      ? selectedTransportTypes.filter(t => t !== typeId)
      : [...selectedTransportTypes, typeId];

    setSelectedTransportTypes(newTypes);
  };

  const handleSaveChanges = async () => {
    if (!selectedRouteForModification) return;

    try {
      const originCoords = await getCoordinates(selectedRouteForModification.origin);
      const destCoords = await getCoordinates(selectedRouteForModification.destination);

      if (!originCoords || !destCoords) {
        throw new Error("Could not get coordinates for origin or destination");
      }

      const useSea = selectedTransportTypes.includes('sea');
      const useAir = selectedTransportTypes.includes('air');
      const useRail = selectedTransportTypes.includes('rail');

      // Calculate weight in tonnes for the API
      const weightInTonnes = modifiedWeightUnit === 'kg' 
        ? parseFloat(modifiedWeight) / 1000 
        : parseFloat(modifiedWeight);

      const response = await axios.get(
        `http://localhost:3000/routes?origin=${selectedRouteForModification.origin}&destination=${selectedRouteForModification.destination}&originCoords=${originCoords.join(',')}&destCoords=${destCoords.join(',')}&useSea=${useSea}&useAir=${useAir}&useRail=${useRail}`
      );

      // Calculate total cost based on distance and weight
      let totalCost = 0;
      const costPerTonneKm = {
        truck: 0.115,
        rail: 0.017,
        sea: 0.0013,
        air: 0.18
      };

      response.data.lowestEmission.geojson.features.forEach(feature => {
        const distanceKm = feature.properties.distance;
        const transport = feature.properties.transport.toLowerCase();
        const costRate = costPerTonneKm[transport] || costPerTonneKm.truck;
        const segmentCost = distanceKm * weightInTonnes * costRate;
        totalCost += segmentCost;
      });

      const updatedRoute = {
        ...selectedRouteForModification,
        routeData: response.data,
        cost: totalCost,
        weight: `${modifiedWeight}${modifiedWeightUnit}`,
        name: modifiedRouteName,
        isFragile: modifiedFragile,
        sendDate: modifiedSendDate, // Store the send date directly
        deliveryDate: selectedRouteForModification.deliveryDate // Keep the original delivery date
      };

      setRoutes(routes.map(route => 
        route.id === selectedRouteForModification.id ? updatedRoute : route
      ));

      handleCloseModal();
    } catch (error) {
      console.error("Error updating route:", error);
      alert("Error updating route. Please try again.");
    }
  };

  const handleInfoClick = (route) => {
    setSelectedRouteForInfo(route);
  };

  const handleCloseInfo = () => {
    setSelectedRouteForInfo(null);
  };

  // Update route type for a specific route
  const handleRouteTypeChange = (routeId, type) => {
    setRouteTypes(prev => ({
      ...prev,
      [routeId]: type
    }));
    
    // Force a re-render of the map by updating the route type
    setRouteType(type);
  };

  // Get the selected route type for a specific route
  const getRouteType = (routeId) => {
    return routeTypes[routeId] || 'lowestEmission';
  };

  // Sort routes based on selected field and direction
  const sortedRoutes = [...routes].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue, bValue;
    if (sortField === 'route') {
      aValue = `${a.origin} to ${a.destination}`.toLowerCase();
      bValue = `${b.origin} to ${b.destination}`.toLowerCase();
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (sortField === 'emissions') {
      const aWeightInKg = a.weight.includes('kg') ? parseFloat(a.weight) : parseFloat(a.weight) * 1000;
      const bWeightInKg = b.weight.includes('kg') ? parseFloat(b.weight) : parseFloat(b.weight) * 1000;
      const aEmissionPerKg = a.routeData?.lowestEmission?.totalEmission || 0;
      const bEmissionPerKg = b.routeData?.lowestEmission?.totalEmission || 0;
      aValue = aEmissionPerKg * aWeightInKg;
      bValue = bEmissionPerKg * bWeightInKg;
    } else if (sortField === 'emissionsPerTonne') {
      const aWeightInTonnes = a.weight.includes('kg') ? parseFloat(a.weight) / 1000 : parseFloat(a.weight);
      const bWeightInTonnes = b.weight.includes('kg') ? parseFloat(b.weight) / 1000 : parseFloat(b.weight);
      const aEmissionPerKg = a.routeData?.lowestEmission?.totalEmission || 0;
      const bEmissionPerKg = b.routeData?.lowestEmission?.totalEmission || 0;
      aValue = (aEmissionPerKg * (aWeightInTonnes * 1000)) / aWeightInTonnes;
      bValue = (bEmissionPerKg * (bWeightInTonnes * 1000)) / bWeightInTonnes;
    } else if (sortField === 'cost') {
      aValue = a.cost || 0;
      bValue = b.cost || 0;
    } else if (sortField === 'costPerTonne') {
      const aWeightInTonnes = a.weight.includes('kg') ? parseFloat(a.weight) / 1000 : parseFloat(a.weight);
      const bWeightInTonnes = b.weight.includes('kg') ? parseFloat(b.weight) / 1000 : parseFloat(b.weight);
      aValue = (a.cost || 0) / aWeightInTonnes;
      bValue = (b.cost || 0) / bWeightInTonnes;
    } else if (sortField === 'weight') {
      const getWeightInTonnes = (route) => {
        const weight = parseFloat(route.weight);
        return route.weight.includes('kg') ? weight / 1000 : weight;
      };
      aValue = getWeightInTonnes(a);
      bValue = getWeightInTonnes(b);
    }
    
    return sortDirection === 'asc' 
      ? aValue - bValue 
      : bValue - aValue;
  });

  const calculateLastSendingDate = (route) => {
    if (!route?.sendDate) {
      // If no send date, calculate it from delivery date
      if (!route?.deliveryDate) {
        // Return today's date if both dates are empty
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        return `${day}.${month}.`;
      }

      try {
        const deliveryDate = new Date(route.deliveryDate);
        const currentRouteType = getRouteType(route.id);
        const routeData = route.routeData?.[currentRouteType];
        const totalTime = routeData?.totalTime || 0; // in hours
        
        // Convert hours to days and round up, then add 1 day buffer
        const daysNeeded = Math.ceil(totalTime / 24) + 1;
        
        // Calculate send date from delivery date
        const sendDate = new Date(deliveryDate);
        sendDate.setDate(deliveryDate.getDate() - daysNeeded);
        
        // Format date as DD.MM.
        const day = sendDate.getDate().toString().padStart(2, '0');
        const month = (sendDate.getMonth() + 1).toString().padStart(2, '0');
        
        return `${day}.${month}.`;
      } catch (error) {
        console.error('Error calculating send date:', error);
        return '';
      }
    }

    // If send date exists, use it directly
    try {
      const sendDate = new Date(route.sendDate);
      const day = sendDate.getDate().toString().padStart(2, '0');
      const month = (sendDate.getMonth() + 1).toString().padStart(2, '0');
      return `${day}.${month}.`;
    } catch (error) {
      console.error('Error formatting send date:', error);
      return '';
    }
  };

  const calculateCost = (routeData, weight) => {
    if (!routeData || !weight) return 0;
    
    const weightInTonnes = weight.includes('kg') 
      ? parseFloat(weight) / 1000 
      : parseFloat(weight);

    const costPerTonneKm = {
      truck: 0.115,
      rail: 0.017,
      sea: 0.0013,
      air: 0.18
    };

    let totalCost = 0;
    const segments = routeData.geojson?.features || [];
    
    segments.forEach(segment => {
      const distanceKm = segment.properties.distance;
      const transport = segment.properties.transport.toLowerCase();
      const costRate = costPerTonneKm[transport] || costPerTonneKm.truck;
      const segmentCost = distanceKm * weightInTonnes * costRate;
      totalCost += segmentCost;
    });

    return totalCost;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add a green background rectangle for the title
    doc.setFillColor(220, 252, 231); // Light green background
    doc.rect(0, 0, 210, 20, 'F'); // Full width, 20mm height
    
    // Add a darker green border
    doc.setDrawColor(34, 197, 94); // Green border
    doc.rect(0, 0, 210, 20);
    
    // Add the title with green color and larger font
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // Dark green text
    doc.text("Sustainability Route Report", 105, 12, { align: 'center' });
    
    // Add a subtitle
    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94); // Medium green
    doc.text("Environmental Impact Analysis", 105, 18, { align: 'center' });

    const headers = [["Origin", "Destination", "Weight", "CO2 (kg)", "Cost (€)", "CO2/t", "€/t"]];
    const rows = routes
      .filter(route => selectedRoutes.has(route.id))
      .map(route => {
        const routeType = getRouteType(route.id);
        const routeData = route.routeData?.[routeType];
        const weightInKg = route.weight.includes('kg')
          ? parseFloat(route.weight)
          : parseFloat(route.weight) * 1000;
        const weightInTonnes = route.weight.includes('kg')
          ? parseFloat(route.weight) / 1000
          : parseFloat(route.weight);
        const emissionPerKg = routeData?.totalEmission || 0;
        const totalEmission = emissionPerKg * weightInKg;
        const cost = calculateCost(routeData, route.weight);
        const emissionPerTonne = totalEmission / weightInTonnes;
        const costPerTonne = cost / weightInTonnes;

        return [
          route.origin,
          route.destination,
          route.weight,
          totalEmission.toFixed(2),
          cost.toFixed(2),
          emissionPerTonne.toFixed(2),
          costPerTonne.toFixed(2)
        ];
      });

    const totals = routes
      .filter(route => selectedRoutes.has(route.id))
      .reduce((sum, route) => {
        const routeType = getRouteType(route.id);
        const routeData = route.routeData?.[routeType];
        const weightInKg = route.weight.includes('kg')
          ? parseFloat(route.weight)
          : parseFloat(route.weight) * 1000;
        const weightInTonnes = route.weight.includes('kg')
          ? parseFloat(route.weight) / 1000
          : parseFloat(route.weight);
        const emissionPerKg = routeData?.totalEmission || 0;
        const totalEmission = emissionPerKg * weightInKg;
        const cost = calculateCost(routeData, route.weight);
        const emissionPerTonne = totalEmission / weightInTonnes;
        const costPerTonne = cost / weightInTonnes;

        return {
          emissions: sum.emissions + totalEmission,
          cost: sum.cost + cost,
          emissionPerTonne: sum.emissionPerTonne + emissionPerTonne,
          costPerTonne: sum.costPerTonne + costPerTonne
        };
      }, { emissions: 0, cost: 0, emissionPerTonne: 0, costPerTonne: 0 });

    rows.push([
      "Total",
      "",
      "",
      Math.round(totals.emissions).toLocaleString('en-US'),
      Math.round(totals.cost).toLocaleString('en-US'),
      (totals.emissionPerTonne / selectedRoutes.size).toFixed(2),
      (totals.costPerTonne / selectedRoutes.size).toFixed(2)
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 30, // Increased to account for the larger header
      styles: { fontSize: 10 },
      headStyles: { 
        fillColor: [34, 197, 94], // Green header
        textColor: [255, 255, 255], // White text
        fontStyle: 'bold'
      },
      willDrawCell: (data) => {
        if (data.row.index === rows.length - 1) {
          doc.setFont("helvetica", "bold");
          doc.setFillColor(220, 252, 231); // Light green for totals row
        }
      }
    });

    doc.save("sustainability_report.pdf");
  };

  return (
    // Component JSX structure
    <Container>
      <Title>
        Route Details
        <DownloadButton onClick={handleDownloadPDF}>
          Download PDF
        </DownloadButton>
      </Title>
      <RouteDetailsTable>
        <TableHeader>Route</TableHeader>
        <TableHeader>Weight</TableHeader>
        <TableHeader>CO₂/t</TableHeader>
        <TableHeader>€/t</TableHeader>
        <TableHeader>Send date</TableHeader>
        <TableHeader>
          <Checkbox
            type="checkbox"
            checked={selectedRoutes.size === routes.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          Actions
        </TableHeader>

        {sortedRoutes.map((route) => {
          const currentRouteType = getRouteType(route.id);
          const routeData = route.routeData?.[currentRouteType];
          
          const weightInKg = route.weight.includes('kg')
            ? parseFloat(route.weight)
            : parseFloat(route.weight) * 1000;
          const weightInTonnes = route.weight.includes('kg')
            ? parseFloat(route.weight) / 1000
            : parseFloat(route.weight);
          const emissionPerKg = routeData?.totalEmission || 0;
          const totalEmission = emissionPerKg * weightInKg;
          const emissionPerTonne = totalEmission / weightInTonnes;
          const costPerTonne = calculateCost(routeData, route.weight) / weightInTonnes;

          return (
            <React.Fragment key={route.id}>
              <TableCell>
                {route.name || `${route.origin} to ${route.destination}`}
                <RouteTypeContainer>
                  <RouteTypeButton
                    selected={currentRouteType === 'lowestEmission'}
                    onClick={() => handleRouteTypeChange(route.id, 'lowestEmission')}
                  >
                    Lowest Emission
                  </RouteTypeButton>
                  <RouteTypeButton
                    selected={currentRouteType === 'fastest'}
                    onClick={() => handleRouteTypeChange(route.id, 'fastest')}
                  >
                    Fastest
                  </RouteTypeButton>
                </RouteTypeContainer>
              </TableCell>
              <TableCell>{route.weight}</TableCell>
              <TableCell>{emissionPerTonne.toFixed(2)}</TableCell>
              <TableCell>{formatPrice(costPerTonne)}</TableCell>
              <TableCell>{calculateLastSendingDate(route)}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Checkbox
                    type="checkbox"
                    checked={selectedRoutes.has(route.id)}
                    onChange={() => handleRouteToggle(route.id)}
                  />
                  <ModifyButton onClick={() => handleModifyClick(route)}>
                    Modify
                  </ModifyButton>
                  <ActionButton 
                    title="Info"
                    onClick={() => handleInfoClick(route)}
                  >
                    ℹ️
                  </ActionButton>
                  <ActionButton 
                    title="Delete"
                    onClick={() => handleDeleteRoute(route.id)}
                  >
                    🗑️
                  </ActionButton>
                </div>
              </TableCell>
            </React.Fragment>
          );
        })}
      </RouteDetailsTable>

      {selectedRouteForInfo && (
        <RouteInfoPopup
          route={selectedRouteForInfo}
          onClose={handleCloseInfo}
        />
      )}

      {selectedRouteForModification && (
        <>
          <ModalOverlay onClick={handleCloseModal} />
          <AdvancedSettingsModal>
            <ModalTitle>Modify Route</ModalTitle>
            
            <ModalSection>
              <ModalLabel>Route Name</ModalLabel>
              <ModalInput
                type="text"
                value={modifiedRouteName}
                onChange={(e) => setModifiedRouteName(e.target.value)}
                placeholder="Enter route name"
                style={{ width: '300px' }}
              />
            </ModalSection>

            <ModalSection>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                <strong>Route:</strong> {selectedRouteForModification.origin} → {selectedRouteForModification.destination}
              </p>
            </ModalSection>

            <ModalSection>
              <ModalLabel>Weight</ModalLabel>
              <ModalWeightContainer>
                <ModalWeightInput
                  type="number"
                  value={modifiedWeight}
                  onChange={(e) => setModifiedWeight(e.target.value)}
                  placeholder="Weight"
                />
                <ModalUnitSelect
                  value={modifiedWeightUnit}
                  onChange={(e) => setModifiedWeightUnit(e.target.value)}
                >
                  <option value="t">t</option>
                  <option value="kg">kg</option>
                </ModalUnitSelect>
              </ModalWeightContainer>
            </ModalSection>

            <ModalSection>
              <ModalLabel>Send Date</ModalLabel>
              <ModalInput
                type="date"
                value={modifiedSendDate}
                onChange={(e) => setModifiedSendDate(e.target.value)}
                style={{ width: '200px' }}
              />
            </ModalSection>

            <ModalSection>
              <FormCheckboxContainer>
                <FormCheckbox
                  type="checkbox"
                  checked={modifiedFragile}
                  onChange={(e) => setModifiedFragile(e.target.checked)}
                  id="modify-fragile"
                />
                <FormCheckboxLabel htmlFor="modify-fragile">
                  Fragile
                </FormCheckboxLabel>
              </FormCheckboxContainer>
            </ModalSection>

            <ModalSection>
              <ModalLabel>Transport Types</ModalLabel>
              <TransportTypeContainer>
                {transportTypes.map(type => (
                  <TransportButton
                    key={type.id}
                    selected={type.id === 'all' 
                      ? selectedTransportTypes.length === 4 
                      : selectedTransportTypes.includes(type.id)}
                    onClick={() => handleTransportTypeClick(type.id)}
                  >
                    {type.label}
                  </TransportButton>
                ))}
              </TransportTypeContainer>
            </ModalSection>

            <ModalButtonGroup>
              <CancelButton onClick={handleCloseModal}>Cancel</CancelButton>
              <SaveButton onClick={handleSaveChanges}>Save Changes</SaveButton>
            </ModalButtonGroup>
          </AdvancedSettingsModal>
        </>
      )}
    </Container>
  );
};

export default RouteDetails;