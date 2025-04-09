import React, { useState } from 'react';
import styled from '@emotion/styled';

// Styled components for layout and styling
const Container = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.div`
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const Table = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 0.5fr;
  gap: 0.5rem;
  
  > div {
    padding: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  > div:nth-of-type(-n+7) {
    font-weight: 500;
    color: #1e293b;
    cursor: pointer;
    
    &:hover {
      color: #2563eb;
    }
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

// RouteDetails component displays a sortable table of routes with their details
const RouteDetails = ({
  routes,
  setRoutes,
  selectedRoutes,
  setSelectedRoutes
}) => {
  // State for sorting functionality
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

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

  // Handle sorting when a column header is clicked
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  return (
    // Component JSX structure
    <Container>
      <Title>Route Details</Title>
      <Table>
        <div onClick={() => handleSort('route')}>
          Route {sortField === 'route' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('weight')}>
          Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('emissions')}>
          CO₂ (kg) {sortField === 'emissions' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('emissionsPerTonne')}>
          CO₂/t {sortField === 'emissionsPerTonne' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('cost')}>
          € {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div onClick={() => handleSort('costPerTonne')}>
          €/t {sortField === 'costPerTonne' && (sortDirection === 'asc' ? '↑' : '↓')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default' }}>
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
      </Table>
    </Container>
  );
};

export default RouteDetails;