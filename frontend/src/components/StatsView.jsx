import React from 'react';
import styled from '@emotion/styled';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Styled components for layout and styling
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Title = styled.div`
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`;

const StatTitle = styled.h3`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: #4b5563;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
`;

const ChartCard = styled.div`
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 8px;
`;

const ChartTitle = styled.h3`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 1rem;
  text-align: center;
`;

const ChartContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const ChartWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const RouteList = styled.div`
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 1rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const RouteItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #64748b;
  position: relative;
  padding-left: 1.5rem;

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background-color: ${props => props.color || '#8884d8'};
  }
`;

const EmptyChartMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #64748b;
  font-size: 0.875rem;
`;

// Color palette for charts
const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

// StatsView component displays statistics and charts for selected routes
const StatsView = ({ routes, selectedRoutes, routeTypes = {} }) => {
  // Calculate statistics for selected routes
  const stats = routes
    .filter(route => selectedRoutes.has(route.id))
    .reduce((acc, route) => {
      const routeType = routeTypes[route.id] || 'lowestEmission';
      const routeData = route.routeData?.[routeType];
      
      const weightInKg = route.weight.includes('kg')
        ? parseFloat(route.weight)
        : parseFloat(route.weight) * 1000;
      const weightInTonnes = route.weight.includes('kg')
        ? parseFloat(route.weight) / 1000
        : parseFloat(route.weight);
      
      const emissionPerKg = routeData?.totalEmission || 0;
      const totalEmission = emissionPerKg * weightInKg;

      // Calculate cost based on the selected route type
      const costPerTonneKm = {
        truck: 0.115,
        rail: 0.017,
        sea: 0.0013,
        air: 0.18
      };

      let totalCost = 0;
      if (routeData?.geojson?.features) {
        routeData.geojson.features.forEach(feature => {
          const distanceKm = feature.properties.distance;
          const transport = feature.properties.transport.toLowerCase();
          const costRate = costPerTonneKm[transport] || costPerTonneKm.truck;
          const segmentCost = distanceKm * weightInTonnes * costRate;
          totalCost += segmentCost;
        });
      }

      return {
        totalEmission: acc.totalEmission + totalEmission,
        totalCost: acc.totalCost + totalCost,
        routeCount: acc.routeCount + 1
      };
    }, { totalEmission: 0, totalCost: 0, routeCount: 0 });

  const formatEmission = (emission) => {
    if (emission >= 1000) {
      return `${(emission / 1000).toFixed(2)} t CO₂e`;
    }
    return `${emission.toFixed(2)} kg CO₂e`;
  };

  const formatPrice = (price) => {
    return `€${Math.round(price).toLocaleString('en-US')}`;
  };

  const prepareChartData = () => {
    const selectedRoutesList = Array.from(selectedRoutes);
    const filteredRoutes = routes.filter(route => selectedRoutesList.includes(route.id));

    const emissionsData = filteredRoutes.map(route => {
      const routeType = routeTypes[route.id] || 'lowestEmission';
      const routeData = route.routeData?.[routeType];
      const weightInKg = route.weight.includes('kg')
        ? parseFloat(route.weight)
        : parseFloat(route.weight) * 1000;
      const emissionPerKg = routeData?.totalEmission || 0;
      const totalEmission = emissionPerKg * weightInKg;
      const weightInTonnes = weightInKg / 1000;
      return {
        name: route.name || `${route.origin} to ${route.destination}`,
        value: totalEmission / weightInTonnes
      };
    });

    const costData = filteredRoutes.map(route => {
      const routeType = routeTypes[route.id] || 'lowestEmission';
      const routeData = route.routeData?.[routeType];
      const weightInTonnes = route.weight.includes('kg')
        ? parseFloat(route.weight) / 1000
        : parseFloat(route.weight);
      
      const costPerTonneKm = {
        truck: 0.115,
        rail: 0.017,
        sea: 0.0013,
        air: 0.18
      };

      let totalCost = 0;
      if (routeData?.geojson?.features) {
        routeData.geojson.features.forEach(feature => {
          const distanceKm = feature.properties.distance;
          const transport = feature.properties.transport.toLowerCase();
          const costRate = costPerTonneKm[transport] || costPerTonneKm.truck;
          const segmentCost = distanceKm * weightInTonnes * costRate;
          totalCost += segmentCost;
        });
      }

      return {
        name: route.name || `${route.origin} to ${route.destination}`,
        value: totalCost / weightInTonnes
      };
    });

    return { emissionsData, costData };
  };

  const { emissionsData, costData } = prepareChartData();

  return (
    <Container>
      <StatsGrid>
        <StatCard>
          <StatTitle>Total Emissions</StatTitle>
          <StatValue>{formatEmission(stats.totalEmission)}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Total Cost</StatTitle>
          <StatValue>{formatPrice(stats.totalCost)}</StatValue>
        </StatCard>
      </StatsGrid>

      <ChartsContainer>
        <ChartCard>
          <ChartTitle>Emissions per Tonne Distribution</ChartTitle>
          <ChartContainer>
            <ChartWrapper>
              {emissionsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={emissionsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {emissionsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value.toFixed(2)} kg CO₂/t`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartMessage>
                  Add routes to see emissions per tonne distribution
                </EmptyChartMessage>
              )}
            </ChartWrapper>
            <RouteList>
              {emissionsData.map((entry, index) => (
                <RouteItem 
                  key={entry.name} 
                  color={COLORS[index % COLORS.length]}
                >
                  <span>{entry.name}</span>
                  <span>{entry.value.toFixed(2)} kg CO₂/t</span>
                </RouteItem>
              ))}
            </RouteList>
          </ChartContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Cost per Tonne Distribution</ChartTitle>
          <ChartContainer>
            <ChartWrapper>
              {costData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `€${Math.round(value).toLocaleString('en-US')}/t`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartMessage>
                  Add routes to see cost per tonne distribution
                </EmptyChartMessage>
              )}
            </ChartWrapper>
            <RouteList>
              {costData.map((entry, index) => (
                <RouteItem 
                  key={entry.name} 
                  color={COLORS[index % COLORS.length]}
                >
                  <span>{entry.name}</span>
                  <span>€{Math.round(entry.value).toLocaleString('en-US')}/t</span>
                </RouteItem>
              ))}
            </RouteList>
          </ChartContainer>
        </ChartCard>
      </ChartsContainer>
    </Container>
  );
};

export default StatsView;