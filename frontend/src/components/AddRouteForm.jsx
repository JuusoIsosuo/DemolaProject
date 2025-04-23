import React, { useState } from 'react';
import styled from '@emotion/styled';
import { PulseLoader } from "react-spinners";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import AutocompleteInput from './AutocompleteInput';

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 200px;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const WeightContainer = styled.div`
  display: flex;
  align-items: center;

  & > *:not(:last-child) {
    margin-right: 1px;
  }
`;

const WeightInput = styled(SearchInput)`
  width: 110px;
`;

const UnitSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 45px;
  background: #f9fafb;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1em;
  padding-right: 1.5rem;
  color: #374151;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: white;
  }
`;

const AddButton = styled.button`
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

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

const DownloadButton = styled(AddButton)`
  height: fit-content;
  margin-left: auto;
  padding: 0.5rem 1rem;
`;

const TransportTypeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: nowrap;
  width: fit-content;
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
  white-space: nowrap;

  &:hover {
    background-color: ${props => props.selected ? '#1d4ed8' : '#f8fafc'};
  }

  &:first-child {
    border-color: ${props => props.selected ? '#2563eb' : '#e2e8f0'};
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FormRow = styled.div`
  display: flex;
  align-items: flex-end;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 250px;
  padding-right: 1px;

  &:last-of-type {
    padding-right: 0;
  }
`;

const WeightGroup = styled(FormGroup)`
  width: 160px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const FormCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const FormCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s;

  &:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormCheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
`;

const FormAdvancedSettingsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const FormAddButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  width: fit-content;
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.disabled ? 0.7 : 1};

  &:hover {
    background: ${props => props.disabled ? '#3b82f6' : '#2563eb'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const DateRangeContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const FrequencySelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 150px;
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

// AddRouteForm component handles adding new routes and generating PDF reports
const AddRouteForm = ({ routes, setRoutes, selectedRoutes, setSelectedRoutes, isLoading, setIsLoading }) => {
  // State for form inputs
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [weightUnit, setWeightUnit] = React.useState('t');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [isFragile, setFragile] = React.useState(false); // Checkbox state
  const [isContinuousDelivery, setIsContinuousDelivery] = React.useState(false);
  const [selectedTransportTypes, setSelectedTransportTypes] = React.useState(['truck']);
  const [selectedDate, setSelectedDate] = React.useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const transportTypes = [
    { id: 'all', label: 'All' },
    { id: 'truck', label: 'Truck' },
    { id: 'rail', label: 'Rail' },
    { id: 'sea', label: 'Sea' },
    { id: 'air', label: 'Air' }
  ];

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

  // Get coordinates from Mapbox API for a given address
  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${import.meta.env.VITE_API_TOKEN}`
      );
      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].center;
      }
    } catch (error) {
      console.error("Error getting coordinates:", error);
    }
    return null;
  };

  // Handle adding a new route with calculations for costs
  const handleAddRoute = async () => {
    if (!origin || !destination || !weight) return;

    try {
      const originCoords = await getCoordinates(origin);
      const destCoords = await getCoordinates(destination);

      if (!originCoords || !destCoords) {
        throw new Error("Could not get coordinates for origin or destination");
      }

      const useSea = selectedTransportTypes.includes('sea');
      const useAir = selectedTransportTypes.includes('air');
      const useRail = selectedTransportTypes.includes('rail');

      const truckType = 'euroI'; //euroI, euroII, euroIII, euroIV, euroV, euroVI
      const trainType = 'electric'; //electric, diesel

      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:3000/routes?origin=${origin}&destination=${destination}&originCoords=${originCoords.join(',')}&destCoords=${destCoords.join(',')}&useSea=${useSea}&useAir=${useAir}&useRail=${useRail}&truckType=${truckType}&trainType=${trainType}`
      );

      let totalCost = 0;
      const weightInTonnes = weightUnit === 'kg' ? parseFloat(weight) / 1000 : parseFloat(weight);

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

      const newRoute = {
        id: Date.now(),
        origin,
        destination,
        routeData: response.data,
        weight: `${weight}${weightUnit}`,
        cost: totalCost,
        name: routeName || `${origin} to ${destination}`
      };

      setRoutes(prevRoutes => [...prevRoutes, newRoute]);
      setSelectedRoutes(prev => new Set([...prev, newRoute.id]));
      return true;
    } catch (error) {
      console.error("Error adding route:", error);
      alert("Error adding route. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvancedSettings = () => {
    setShowAdvancedSettings(prev => !prev);
  };

  // Generate and download PDF report for routes
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Routes Summary Report", 15, 10);

    const headers = [["Origin", "Destination", "Weight", "CO2 (kg)", "Cost (€)"]];
    const rows = routes.map(route => [
      route.origin,
      route.destination,
      route.weight,
      parseFloat(route.routeData?.lowestEmission?.totalEmission).toFixed(2),
      parseFloat(route.cost).toFixed(2)
    ]);

    const totals = routes
      .filter(route => selectedRoutes.has(route.id))
      .reduce((sum, route) => {
        const weightInKg = route.weight.includes('kg')
          ? parseFloat(route.weight)
          : parseFloat(route.weight) * 1000;
        const emissionPerKg = route.routeData?.lowestEmission?.totalEmission || 0;
        const totalEmission = emissionPerKg * weightInKg;
        return {
          emissions: sum.emissions + totalEmission,
          cost: sum.cost + (route.cost || 0)
        };
      }, { emissions: 0, cost: 0 });

    rows.push([
      "Total",
      "",
      "",
      totals.emissions.toFixed(2),
      totals.cost.toFixed(2)
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [20, 71, 230] },
      willDrawCell: (data) => {
        if (data.row.index === rows.length - 1) {
          doc.setFont("helvetica", "bold");
          doc.setFillColor(190, 219, 255);
        }
      }
    });

    doc.save("routes_summary.pdf");
  };

  return (
    <FormContainer>
      <FormRow>
        <FormGroup>
          <Label>Origin</Label>
      <AutocompleteInput 
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        onSelect={(place) => setOrigin(place)}
            placeholder="Enter origin"
            InputComponent={Input}
      />
        </FormGroup>

        <FormGroup>
          <Label>Destination</Label>
      <AutocompleteInput 
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        onSelect={(place) => setDestination(place)}
            placeholder="Enter destination"
            InputComponent={Input}
      />
        </FormGroup>

        <WeightGroup>
          <Label>Weight</Label>
      <WeightContainer>
        <WeightInput
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
              placeholder="Weight"
        />
        <UnitSelect
          value={weightUnit}
          onChange={(e) => setWeightUnit(e.target.value)}
        >
          <option value="t">t</option>
          <option value="kg">kg</option>
        </UnitSelect>
      </WeightContainer>
        </WeightGroup>

        <DownloadButton onClick={handleDownloadPDF}>
          Download PDF
        </DownloadButton>
      </FormRow>

      <FormGroup>
        <Label>Transport Types</Label>
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
      </FormGroup>

      <FormAdvancedSettingsButton onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Advanced Settings
      </FormAdvancedSettingsButton>

      {isAdvancedOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormGroup>
            <Label>Route Name</Label>
            <Input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Enter route name (optional)"
            />
          </FormGroup>

          <FormGroup>
            <Label>Delivery Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </FormGroup>

          <FormCheckboxContainer>
            <FormCheckbox
                type="checkbox"
                checked={isContinuousDelivery}
                onChange={(e) => setIsContinuousDelivery(e.target.checked)}
              id="continuous-delivery"
              />
            <FormCheckboxLabel htmlFor="continuous-delivery">
              Continuous Delivery
            </FormCheckboxLabel>
          </FormCheckboxContainer>

          {isContinuousDelivery && (
            <>
              <FormGroup>
                <Label>Frequency</Label>
                <FrequencySelect
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </FrequencySelect>
              </FormGroup>

              <FormGroup>
                <Label>Date Range</Label>
                <DateRangeContainer>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </DateRangeContainer>
              </FormGroup>
            </>
          )}

          <FormCheckboxContainer>
            <FormCheckbox
              type="checkbox"
              checked={isFragile}
              onChange={(e) => setFragile(e.target.checked)}
              id="fragile"
            />
            <FormCheckboxLabel htmlFor="fragile">
              Fragile
            </FormCheckboxLabel>
          </FormCheckboxContainer>
        </div>
      )}

      <FormAddButton onClick={handleAddRoute} disabled={isLoading}>
        {isLoading ? (
          <PulseLoader size={8} color="#ffffff" margin={2} />
        ) : (
          'Add Route'
        )}
      </FormAddButton>
    </FormContainer>
  );
};

export default AddRouteForm;