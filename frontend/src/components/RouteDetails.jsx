import React from 'react';
import styled from '@emotion/styled';

const RouteDetailsContainer = styled.div`
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-top: 1rem;
`;

const RouteDetailsTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 1rem;
`;

const RouteDetailsTable = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #2563eb;
  &:hover {
    color: #dc2626;
  }
`;

const RouteDetails = ({
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
    <RouteDetailsContainer>
      <RouteDetailsTitle>Route Details</RouteDetailsTitle>
      <RouteDetailsTable>
        <div onClick={() => handleSort('route')} style={{ cursor: 'pointer' }}>
          Route {sortField === 'route' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('weight')} style={{ cursor: 'pointer' }}>
          Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('emissions')} style={{ cursor: 'pointer' }}>
          CO₂ (kg) {sortField === 'emissions' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('emissionsPerTonne')} style={{ cursor: 'pointer' }}>
          CO₂/t {sortField === 'emissionsPerTonne' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('cost')} style={{ cursor: 'pointer' }}>
          € {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('costPerTonne')} style={{ cursor: 'pointer' }}>
          €/t {sortField === 'costPerTonne' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={selectedRoutes.size === routes.length && routes.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <span>Actions</span>
        </div>
        {sortedRoutes.map((route) => {
          const weightInKg = route.weight.includes('kg')
            ? parseFloat(route.weight)
            : parseFloat(route.weight) * 1000;
          const weightInTonnes = route.weight.includes('kg')
            ? parseFloat(route.weight) / 1000
            : parseFloat(route.weight);
          const emissionPerKg = route.routeData?.lowestEmission?.totalEmission || 0;
          const totalEmission = emissionPerKg * weightInKg;
          const emissionPerTonne = totalEmission / weightInTonnes;
          const costPerTonne = (route.cost || 0) / weightInTonnes;
          
          return (
            <React.Fragment key={route.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {`${route.origin} to ${route.destination}`}
              </div>
              <div>{route.weight}</div>
              <div>{totalEmission.toFixed(2)}</div>
              <div>{emissionPerTonne.toFixed(2)}</div>
              <div>{(route.cost || 0).toFixed(2)}</div>
              <div>{costPerTonne.toFixed(2)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedRoutes.has(route.id)}
                  onChange={() => handleRouteToggle(route.id)}
                />
                <ActionButton 
                  title="Delete"
                  onClick={() => handleDeleteRoute(route.id)}
                >
                  🗑️
                </ActionButton>
              </div>
            </React.Fragment>
          );
        })}
      </RouteDetailsTable>
    </RouteDetailsContainer>
  );
};

export default RouteDetails;
