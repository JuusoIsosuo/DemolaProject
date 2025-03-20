import React, { useState } from 'react';
import styled from 'styled-components';
import Map from './Map';
import axios from 'axios';

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  padding: 1rem;
  gap: 1rem;
  background-color: #f8fafc;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-right: 320px;
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  max-width: 750px;
  margin-left: 1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 1rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  overflow-x: auto;
  min-height: 60px;
  max-width: 750px;
  margin-left: 1rem;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const MapContent = styled.div`
  flex: 1;
  min-height: 600px;
  position: relative;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  max-width: 250px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const WeightInput = styled(SearchInput)`
  width: 100px;
  flex: none;
`;

const UnitSelect = styled.select`
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  width: 60px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const Button = styled.button`
  padding: 0.6rem 1.2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
`;

const RouteTypeSelect = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RouteTypeButton = styled.button`
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#1e293b'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  
  &:hover {
    border-color: #3b82f6;
  }
`;

const EmissionSettingsBox = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 300px;
  height: fit-content;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
`;

const SettingsTitle = styled.h2`
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  color: #1e293b;
`;

const SettingsSection = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingsLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const MapView = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');
  const [routeType, setRouteType] = useState('green');
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [truckEmissionClass, setTruckEmissionClass] = useState('EURO_VI');
  const [trainType, setTrainType] = useState('electric');

  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
      );
      
      if (response.data.features.length > 0) {
        return response.data.features[0].center;
      }
      throw new Error('No coordinates found for the address');
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      throw error;
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination || !weight) return;

    setIsLoading(true);
    try {
      const [originCoords, destCoords] = await Promise.all([
        getCoordinates(origin),
        getCoordinates(destination),
      ]);

      const weightInKg = unit === 't' ? parseFloat(weight) * 1000 : parseFloat(weight);
      
      const response = await axios.post('http://localhost:8000/api/calculate-route', {
        origin: originCoords,
        destination: destCoords,
        weight: weightInKg,
        routeType,
        truckEmissionClass,
        trainType,
      });

      setRouteData(response.data);
    } catch (error) {
      console.error('Error calculating route:', error);
      alert('Error calculating route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <MainContent>
        <SearchContainer>
          <InputGroup>
            <SearchInput
              type="text"
              placeholder="Origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
            <SearchInput
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </InputGroup>
          
          <InputGroup>
            <WeightInput
              type="number"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0"
            />
            <UnitSelect value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="kg">kg</option>
              <option value="t">t</option>
            </UnitSelect>
          </InputGroup>

          <RouteTypeSelect>
            <RouteTypeButton
              type="button"
              active={routeType === 'green'}
              onClick={() => setRouteType('green')}
            >
              Lowest Emission
            </RouteTypeButton>
            <RouteTypeButton
              type="button"
              active={routeType === 'fast'}
              onClick={() => setRouteType('fast')}
            >
              Fastest Route
            </RouteTypeButton>
          </RouteTypeSelect>

          <Button onClick={calculateRoute} disabled={isLoading}>
            {isLoading ? 'Calculating...' : 'Calculate'}
          </Button>
        </SearchContainer>

        <MapContent>
          <Map routeData={routeData} routeType={routeType} />
        </MapContent>
      </MainContent>

      <EmissionSettingsBox>
        <SettingsTitle>Emission Settings</SettingsTitle>
        
        <SettingsSection>
          <SettingsLabel>Truck Emission Class</SettingsLabel>
          <Select
            value={truckEmissionClass}
            onChange={(e) => setTruckEmissionClass(e.target.value)}
          >
            <option value="EURO_I">EURO I</option>
            <option value="EURO_II">EURO II</option>
            <option value="EURO_III">EURO III</option>
            <option value="EURO_IV">EURO IV</option>
            <option value="EURO_V">EURO V</option>
            <option value="EURO_VI">EURO VI</option>
          </Select>
        </SettingsSection>

        <SettingsSection>
          <SettingsLabel>Train Type</SettingsLabel>
          <Select
            value={trainType}
            onChange={(e) => setTrainType(e.target.value)}
          >
            <option value="electric">Electric</option>
            <option value="diesel">Diesel</option>
          </Select>
        </SettingsSection>
      </EmissionSettingsBox>
    </PageContainer>
  );
};

export default MapView; 