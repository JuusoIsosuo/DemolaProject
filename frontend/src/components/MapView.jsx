import React from 'react';
import styled from '@emotion/styled';
import Map from '../components/Map';
import RouteLegend from '../components/RouteLegend';
import AddRoute from './AddRoute';
import RouteDetails from './RouteDetails';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  background: #f8fafc;
`;

const MapContainer = styled.div`
  height: 500px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const MapView = ({
  selectedRoutesData,
  origin,
  destination,
  weight,
  weightUnit,
  isLoading,
  handleAddRoute,
  handleDownloadPDF,
  onChangeOrigin,
  onChangeDestination,
  onChangeWeight,
  onChangeWeightUnit,
  sortedRoutes,
  sortField,
  sortDirection,
  handleSort,
  selectedRoutes,
  routes,
  handleSelectAll,
  handleRouteToggle,
  handleDeleteRoute
}) => {
  return (
    <Container>
      <RouteLegend />
      <MapContainer>
        <Map routeData={selectedRoutesData} />
      </MapContainer>
      <AddRoute
        origin={origin}
        destination={destination}
        weight={weight}
        weightUnit={weightUnit}
        isLoading={isLoading}
        handleAddRoute={handleAddRoute}
        handleDownloadPDF={handleDownloadPDF}
        onChangeOrigin={onChangeOrigin}
        onChangeDestination={onChangeDestination}
        onChangeWeight={onChangeWeight}
        onChangeWeightUnit={onChangeWeightUnit}
      />
      <RouteDetails
        sortedRoutes={sortedRoutes}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        selectedRoutes={selectedRoutes}
        routes={routes}
        handleSelectAll={handleSelectAll}
        handleRouteToggle={handleRouteToggle}
        handleDeleteRoute={handleDeleteRoute}
      />
    </Container>
  );
};

export default MapView;
