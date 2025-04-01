import React, { useState } from 'react';
import styled from '@emotion/styled';
import Map from '../components/Map';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
`;

const TabContainer = styled.div`
  display: flex;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0;
`;

const Tab = styled.button`
  padding: 1rem 2rem;
  background-color: ${props => props.active ? '#f8fafc' : 'white'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#2563eb' : 'transparent'};
  color: ${props => props.active ? '#2563eb' : '#64748b'};
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    color: #2563eb;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1rem;
  gap: 1rem;
`;

const MapContainer = styled.div`
  height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const RouteListContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

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

const RouteList = styled.div`
  padding: 1rem;
`;

const RouteItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #1d4ed8;
  }
`;

const MultipleRoutes = () => {
  const [activeTab, setActiveTab] = useState('kartta');
  const [routes, setRoutes] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);

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

  const handleAddRoute = async () => {
    if (!origin || !destination || !weight) return;
    
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
      
      const newRoute = {
        origin,
        destination,
        weight: `${weight}${weightUnit}`,
        routeData: response.data
      };
      
      setRoutes([...routes, newRoute]);
      setOrigin('');
      setDestination('');
      setWeight('');
      setRouteData(response.data);
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Error calculating route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowRoute = (route) => {
    setRouteData(route.routeData);
  };

  const handleDeleteRoute = (index) => {
    const newRoutes = [...routes];
    newRoutes.splice(index, 1);
    setRoutes(newRoutes);
  };

  return (
    <Container>
      <TabContainer>
        <Tab 
          active={activeTab === 'kartta'} 
          onClick={() => setActiveTab('kartta')}
        >
          Kartta
        </Tab>
        <Tab 
          active={activeTab === 'tilastot'} 
          onClick={() => setActiveTab('tilastot')}
        >
          Tilastot
        </Tab>
      </TabContainer>

      {activeTab === 'kartta' ? (
        <ContentContainer>
          <MapContainer>
            <Map routeData={routeData} />
          </MapContainer>
          <RouteListContainer>
            <SearchContainer>
              <SearchInput
                placeholder="Origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <SearchInput
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
              <AddButton 
                onClick={handleAddRoute}
                disabled={isLoading || !origin || !destination || !weight}
              >
                {isLoading ? 'Adding...' : 'Add Route'}
              </AddButton>
            </SearchContainer>
            <RouteList>
              {routes.map((route, index) => (
                <RouteItem key={index}>
                  <span>{route.origin}</span>
                  <span>{route.destination}</span>
                  <span>{route.weight}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ActionButton 
                      title="Show on map"
                      onClick={() => handleShowRoute(route)}
                    >
                      🗺️
                    </ActionButton>
                    <ActionButton 
                      title="Delete"
                      onClick={() => handleDeleteRoute(index)}
                    >
                      🗑️
                    </ActionButton>
                  </div>
                </RouteItem>
              ))}
            </RouteList>
          </RouteListContainer>
        </ContentContainer>
      ) : (
        <ContentContainer>
          <h2>Statistics (Coming Soon)</h2>
        </ContentContainer>
      )}
    </Container>
  );
};

export default MultipleRoutes; 