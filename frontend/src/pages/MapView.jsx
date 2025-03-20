import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import Map from '../components/Map';
import TransportTypeSelector from '../components/TransportTypeSelector';
import RouteLegend from '../components/RouteLegend';
import EmissionControls from '../components/EmissionControls';
import axios from 'axios';

const PageContainer = styled.div`
  display: grid;
  grid-template-columns: minmax(auto, 1200px) 300px;
  justify-content: center;
  height: calc(100vh - 40px);
  margin: 20px;
  gap: 20px;
  background-color: #f8fafc;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
`;

const MapContent = styled.div`
  flex: 1;
  position: relative;
  min-height: 0;
  width: 100%;
`;

const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 1;
  width: 100%;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 18rem;
  padding: 0.75rem 1rem;
  background-color: white;
  border-top: 1px solid #e2e8f0;
  z-index: 1;
  width: 100%;
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

const EmissionSettingsBox = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
  align-self: start;
`;

const BoxTitle = styled.h2`
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const MapView = () => {
  const location = useLocation();
  const [selectedTransportTypes, setSelectedTransportTypes] = useState(['all']);
  const [truckEmissionClass, setTruckEmissionClass] = useState('EURO VI');
  const [trainType, setTrainType] = useState('electric');
  const [origin, setOrigin] = useState(location.state?.origin || '');
  const [destination, setDestination] = useState(location.state?.destination || '');
  const [weight, setWeight] = useState(location.state?.weight || '');
  const [weightUnit, setWeightUnit] = useState(location.state?.weightUnit || 'kg');
  const [routeType, setRouteType] = useState('green');
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);

  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

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

  const calculateRoute = async () => {
    if (!origin || !destination) return;
    
    setIsLoading(true);
    try {
      const originCoords = await getCoordinates(origin);
      const destCoords = await getCoordinates(destination);

      if (!originCoords || !destCoords) {
        throw new Error("Could not get coordinates for origin or destination");
      }

      const response = await axios.get(
        `http://localhost:3000/routes?origin=${origin}&destination=${destination}&originCoords=${originCoords.join(',')}&destCoords=${destCoords.join(',')}`
      );
      
      setRouteData(response.data);
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Error calculating route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <MainContent>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <SwapButton onClick={handleSwapLocations}>⇄</SwapButton>
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
              min="0"
            />
            <UnitSelect value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)}>
              <option value="kg">kg</option>
              <option value="t">t</option>
            </UnitSelect>
          </WeightContainer>
          <CalculateButton onClick={calculateRoute} disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Calculate'}
          </CalculateButton>
          <RouteTypeSelect>
            <RouteTypeButton
              type="button"
              active={routeType === 'green'}
              onClick={() => setRouteType('green')}
              isGreen={true}
            >
              Lowest Emission
            </RouteTypeButton>
            <RouteTypeButton
              type="button"
              active={routeType === 'fastest'}
              onClick={() => setRouteType('fastest')}
            >
              Fastest Route
            </RouteTypeButton>
          </RouteTypeSelect>
        </SearchContainer>

        <ControlsContainer>
          <TransportTypeSelector
            selectedTypes={selectedTransportTypes}
            onTypeSelect={setSelectedTransportTypes}
          />
          <RouteLegend />
        </ControlsContainer>

        <MapContent>
          <Map
            origin={origin}
            destination={destination}
            weight={weight}
            weightUnit={weightUnit}
            routeType={routeType}
            routeData={routeData}
            onCalculateRoute={calculateRoute}
            isLoading={isLoading}
          />
        </MapContent>
      </MainContent>
      <EmissionSettingsBox>
        <BoxTitle>Emission Settings</BoxTitle>
        <EmissionControls
          truckEmissionClass={truckEmissionClass}
          onTruckEmissionChange={setTruckEmissionClass}
          trainType={trainType}
          onTrainTypeChange={setTrainType}
        />
      </EmissionSettingsBox>
    </PageContainer>
  );
};

export default MapView;
