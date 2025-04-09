import React from 'react';
import styled from '@emotion/styled';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import AddRoute from './AddRoute';
import RouteDetails from './RouteDetails';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatBox = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const StatTitle = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: #1e293b;
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ChartWrapper = styled.div`
  display: flex;
  gap: 1rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const ChartTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 1rem;
`;

const ChartDataList = styled.div`
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

const ChartDataItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #64748b;
  position: relative;
  padding-left: 1.5rem;
  &:last-child { border-bottom: none; }
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

const StatsView = ({
  totals,
  emissionsChartData,
  costChartData,
  COLORS,
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
      <StatsContainer>
        <StatBox>
          <StatTitle>Total Emissions</StatTitle>
          <StatValue>{totals.emissions.toFixed(2)} kg CO₂</StatValue>
        </StatBox>
        <StatBox>
          <StatTitle>Total Cost</StatTitle>
          <StatValue>€{totals.cost.toFixed(2)}</StatValue>
        </StatBox>
      </StatsContainer>
      <ChartsContainer>
        <ChartWrapper>
          <div style={{ flex: 2 }}>
            <ChartTitle>Emissions per Tonne Distribution</ChartTitle>
            {emissionsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={emissionsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {emissionsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)} kg CO₂/t`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage>
                Add routes to see emissions per tonne distribution
              </EmptyChartMessage>
            )}
          </div>
          <ChartDataList>
            {emissionsChartData.map((entry, index) => (
              <ChartDataItem key={index} color={COLORS[index % COLORS.length]}>
                <span>{entry.name}</span>
                <span>{entry.value.toFixed(2)} kg CO₂/t</span>
              </ChartDataItem>
            ))}
          </ChartDataList>
        </ChartWrapper>
        <ChartWrapper>
          <div style={{ flex: 2 }}>
            <ChartTitle>Cost per Tonne Distribution</ChartTitle>
            {costChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `€${value.toFixed(2)}/t`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage>
                Add routes to see cost per tonne distribution
              </EmptyChartMessage>
            )}
          </div>
          <ChartDataList>
            {costChartData.map((entry, index) => (
              <ChartDataItem key={index} color={COLORS[index % COLORS.length]}>
                <span>{entry.name}</span>
                <span>€{entry.value.toFixed(2)}/t</span>
              </ChartDataItem>
            ))}
          </ChartDataList>
        </ChartWrapper>
      </ChartsContainer>
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

export default StatsView;
