import React, { useState } from 'react';
import styled from '@emotion/styled';
import Map from '../components/Map';
import RouteLegend from '../components/RouteLegend';
import AddRouteForm from '../components/AddRouteForm';
import RouteDetails from '../components/RouteDetails';
import StatsView from '../components/StatsView';

// Styled components for layout and UI elements
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

// MultipleRoutes component - Main page component for managing multiple transportation routes
const MultipleRoutes = () => {
  // State management for active tab, routes, loading state, and selected routes
  const [activeTab, setActiveTab] = useState('kartta');
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState(new Set());

  // Filter routes data for selected routes only
  const selectedRoutesData = routes
    .filter(route => selectedRoutes.has(route.id))
    .map(route => route.routeData);

  return (
    // Main component structure with tabs and content containers
    <Container>
      <TabContainer>
        <Tab 
          active={activeTab === 'kartta'} 
          onClick={() => setActiveTab('kartta')}
        >
          Map
        </Tab>
        <Tab 
          active={activeTab === 'tilastot'} 
          onClick={() => setActiveTab('tilastot')}
        >
          Statistics
        </Tab>
      </TabContainer>

      <ContentContainer>
        {activeTab === 'kartta' && (
          <>
            <RouteLegend />
            <MapContainer>
              <Map routeData={selectedRoutesData} />
            </MapContainer>
          </>
        )}

        {activeTab === 'tilastot' && (
          <StatsView
            routes={routes}
            selectedRoutes={selectedRoutes}
          />
        )}

        <AddRouteForm
          routes={routes}
          setRoutes={setRoutes}
          selectedRoutes={selectedRoutes}
          setSelectedRoutes={setSelectedRoutes}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        <RouteDetails
          routes={routes}
          setRoutes={setRoutes}
          selectedRoutes={selectedRoutes}
          setSelectedRoutes={setSelectedRoutes}
        />
      </ContentContainer>
    </Container>
  );
};

export default MultipleRoutes;
