import React from 'react';
import styled from '@emotion/styled';
import { PulseLoader } from "react-spinners";
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import AutocompleteInput from './AutocompleteInput';

// Styled components for form layout and styling
const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
`;

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
  gap: 0.5rem;
`;

const WeightInput = styled(SearchInput)`
  width: 100px;
`;

const UnitSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 70px;
  background-color: white;
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
  margin-left: auto;
`;

// AddRouteForm component handles adding new routes and generating PDF reports
const AddRouteForm = ({ routes, setRoutes, selectedRoutes, setSelectedRoutes, isLoading, setIsLoading }) => {
  // State for form inputs
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [weightUnit, setWeightUnit] = React.useState('t');

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

      // !!! Set according to selected routes !!!
      const useSea = true;
      const useAir = true;
      const useRail = true;

      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:3000/routes?origin=${origin}&destination=${destination}&originCoords=${originCoords.join(',')}&destCoords=${destCoords.join(',')}&useSea=${useSea}&useAir=${useAir}&useRail=${useRail}`
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
        id: Date.now().toString(),
        origin: origin,
        destination: destination,
        weight: `${weight}${weightUnit}`,
        routeData: response.data,
        cost: totalCost
      };

      setRoutes(prevRoutes => [...prevRoutes, newRoute]);
      setSelectedRoutes(prev => new Set([...prev, newRoute.id]));
      setOrigin('');
      setDestination('');
      setWeight('');
      return true;
    } catch (error) {
      console.error("Error adding route:", error);
      alert("Error adding route. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
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
    // Component JSX structure
    <SearchContainer>
      <AutocompleteInput 
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        onSelect={(place) => setOrigin(place)}
        placeholder="Origin"
        InputComponent={SearchInput}
      />
      <AutocompleteInput 
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        onSelect={(place) => setDestination(place)}
        placeholder="Destination"
        InputComponent={SearchInput}
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
          <option value="t">t</option>
          <option value="kg">kg</option>
        </UnitSelect>
      </WeightContainer>
      <AddButton 
        onClick={handleAddRoute}
        disabled={isLoading || !origin || !destination || !weight}
      >
        {isLoading ? <PulseLoader color="white" size={8} speedMultiplier={0.75}/> : 'Add Route'}
      </AddButton>
      <DownloadButton 
        onClick={handleDownloadPDF}
        disabled={isLoading || !routes || routes.length === 0}
      >
        Download PDF
      </DownloadButton>
    </SearchContainer>
  );
};

export default AddRouteForm;