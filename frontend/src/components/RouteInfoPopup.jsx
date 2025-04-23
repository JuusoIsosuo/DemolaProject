import React from 'react';
import styled from '@emotion/styled';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  
  &:hover {
    color: #1e293b;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
`;

const InfoSection = styled.div`
  h3 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  
  span:first-of-type {
    color: #64748b;
  }
  
  span:last-of-type {
    font-weight: 500;
    color: #1e293b;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ChartWrapper = styled.div`
  width: 100%;
  min-height: 300px;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    text-align: center;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
`;

const ColorBox = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${props => props.color};
`;

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

const RouteInfoPopup = ({ route, onClose }) => {
  if (!route) {
    console.error('No route provided to RouteInfoPopup');
    return null;
  }

  const { routeData, origin, destination, weight, sendingDate, cost } = route;
  
  // Convert weight to kg consistently with StatsView
  const weightInKg = weight.includes('kg') 
    ? parseFloat(weight)
    : parseFloat(weight) * 1000;

  const currentRoute = routeData?.lowestEmission; // Match StatsView's path
  const totalTime = currentRoute?.totalTime || 0;
  const totalDistance = currentRoute?.totalDistance || 0;
  
  // Calculate emissions using same method as StatsView
  const emissionPerKg = currentRoute?.totalEmission || 0;
  const totalEmission = emissionPerKg * weightInKg;

  const formatDuration = (hours) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString();
    } catch (error) {
      console.error('Invalid date:', error);
      return 'Not available';
    }
  };

  const formatEmission = (emission) => {
    if (emission >= 1000) {
      return `${(emission / 1000).toFixed(2)} t CO₂e`;
    }
    return `${emission.toFixed(2)} kg CO₂e`;
  };

  const getTransportMode = (properties) => {
    if (!properties) return 'unknown';
    
    const transportType = properties.transport || properties.mode || properties.route_type;
    
    if (!transportType) return 'unknown';

    switch (transportType.toLowerCase()) {
      case 'truck':
      case 'road':
        return 'truck';
      case 'rail':
      case 'train':
        return 'rail';
      case 'sea':
      case 'ship':
      case 'marine':
        return 'sea';
      case 'air':
      case 'plane':
      case 'aircraft':
        return 'air';
      default:
        return 'unknown';
    }
  };

  const getDisplayName = (transportType) => {
    const displayNames = {
      'truck': 'Road',
      'rail': 'Rail',
      'sea': 'Sea',
      'air': 'Air',
      'unknown': 'Unknown'
    };
    return displayNames[transportType] || transportType;
  };

  console.log('Route data:', currentRoute);
  console.log('GeoJSON features:', currentRoute?.geojson?.features);

  // Update segment emissions calculation
  const emissionsData = currentRoute?.geojson?.features?.reduce((acc, feature) => {
    const properties = feature.properties || {};
    const transportType = getTransportMode(properties);
    const emission = (properties.emission || 0) * weightInKg;
    
    console.log(`Processing segment:`, {
      transport: transportType,
      rawEmission: properties.emission,
      weightInKg,
      segmentEmission: emission,
      properties
    });
    
    const existingEntry = acc.find(entry => entry.name === getDisplayName(transportType));
    
    if (existingEntry) {
      existingEntry.value += emission;
    } else if (transportType !== 'unknown') {
      acc.push({
        name: getDisplayName(transportType),
        value: emission
      });
    }
    return acc;
  }, []).map(entry => ({
    ...entry,
    value: (entry.value / totalEmission) * 100
  })) || [];

  emissionsData.sort((a, b) => b.value - a.value);

  const emissionTooltipFormatter = (value) => `${value.toFixed(1)}%`;
  const emissionLegendFormatter = (value, entry) => {
    const segmentEmission = totalEmission * (value/100);
    return `${entry.name} (${formatEmission(segmentEmission)}, ${value.toFixed(1)}%)`;
  };

  const costData = currentRoute?.geojson?.features?.reduce((acc, feature) => {
    const properties = feature.properties || {};
    const transportType = getTransportMode(properties);
    const distance = properties.distance || 0;
    const segmentCost = (distance / currentRoute.totalDistance) * cost;
    
    const existingEntry = acc.find(entry => entry.name === getDisplayName(transportType));
    
    if (existingEntry) {
      existingEntry.value += segmentCost;
    } else if (distance > 0) {
      acc.push({
        name: getDisplayName(transportType),
        value: segmentCost
      });
    }
    return acc;
  }, []) || [];

  console.log('Processed emissions data:', emissionsData);
  console.log('Processed cost data:', costData);

  return (
    <PopupOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <PopupContent>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <InfoGrid>
          <InfoSection>
            <h3>Route Details</h3>
            <InfoItem>
              <span>Origin:</span>
              <span>{origin}</span>
            </InfoItem>
            <InfoItem>
              <span>Destination:</span>
              <span>{destination}</span>
            </InfoItem>
            <InfoItem>
              <span>Weight:</span>
              <span>{weight}</span>
            </InfoItem>
            <InfoItem>
              <span>Total Duration:</span>
              <span>{formatDuration(totalTime)}</span>
            </InfoItem>
            <InfoItem>
              <span>Total Distance:</span>
              <span>{Math.round(totalDistance)} km</span>
            </InfoItem>
            <InfoItem>
              <span>Total Emissions:</span>
              <span>{formatEmission(totalEmission)}</span>
            </InfoItem>
            <InfoItem>
              <span>Total Cost:</span>
              <span>{cost.toFixed(2)} €</span>
            </InfoItem>
          </InfoSection>

          <InfoSection>
            <h3>Time Information</h3>
            <InfoItem>
              <span>Sending Date:</span>
              <span>{formatDate(sendingDate)}</span>
            </InfoItem>
            <InfoItem>
              <span>ETA:</span>
              <span>{formatDate(new Date(sendingDate).getTime() + totalTime * 3600000)}</span>
            </InfoItem>
          </InfoSection>
        </InfoGrid>

        <ChartsContainer>
          <ChartWrapper>
            <h3>Emissions Distribution</h3>
            {emissionsData.length > 0 ? (
              <>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={emissionsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {emissionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={emissionTooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend>
                  {emissionsData.map((entry, index) => (
                    <LegendItem key={index}>
                      <ColorBox color={COLORS[index % COLORS.length]} />
                      <span>{emissionLegendFormatter(entry.value, entry)}</span>
                    </LegendItem>
                  ))}
                </ChartLegend>
              </>
            ) : (
              <div>No emissions data available</div>
            )}
          </ChartWrapper>

          <ChartWrapper>
            <h3>Cost Distribution</h3>
            {costData.length > 0 ? (
              <>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={costData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend>
                  {costData.map((entry, index) => (
                    <LegendItem key={index}>
                      <ColorBox color={COLORS[index % COLORS.length]} />
                      <span>{entry.name} (€{entry.value.toFixed(2)})</span>
                    </LegendItem>
                  ))}
                </ChartLegend>
              </>
            ) : (
              <div>No cost data available</div>
            )}
          </ChartWrapper>
        </ChartsContainer>

      </PopupContent>
    </PopupOverlay>
  );
};

export default RouteInfoPopup;
