import React, { useState } from 'react';
import styled from '@emotion/styled';
import Map from '../components/Map';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PulseLoader } from "react-spinners";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RouteLegend from '../components/RouteLegend';

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

const DownloadButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  margin-left: auto;

  &:hover {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatBox = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatTitle = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 500;
`;

const ChartContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
`;

const ChartTitle = styled.div`
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const RouteDetailsContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const RouteDetailsTitle = styled.div`
  color: #1e293b;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
`;

const RouteDetailsTable = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 0.8fr 1fr 0.8fr 0.5fr;
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

  > div:nth-of-type(-n+5) {
    font-weight: 500;
    color: #1e293b;
    cursor: pointer;
    
    &:hover {
      color: #2563eb;
    }
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

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

// RouteDetails Component used in both views
const RouteDetails = ({
  sortedRoutes,
  sortField,
  sortDirection,
  handleSort,
  selectedRoutes,
  routes,
  handleSelectAll,
  handleRouteToggle,
  handleDeleteRoute,
  ActionButton
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
        <div onClick={() => handleSort('cost')} style={{ cursor: 'pointer' }}>
          € {sortField === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
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
          const emissionPerKg = route.routeData?.lowestEmission?.totalEmission || 0;
          const totalEmission = emissionPerKg * weightInKg;
          
          return (
            <React.Fragment key={route.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {`${route.origin} to ${route.destination}`}
              </div>
              <div>{route.weight}</div>
              <div>{totalEmission.toFixed(2)}</div>
              <div>{(route.cost || 0).toFixed(2)}</div>
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

const MultipleRoutes = () => {
  const [activeTab, setActiveTab] = useState('kartta');
  const [routes, setRoutes] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('t');
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState(new Set());
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

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

  const capitalizeString = (str) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize first letter of each word
      .join(' ');
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

      let totalCost = 0;
      const weightInTonnes = weightUnit === 'kg' ? parseFloat(weight) / 1000 : parseFloat(weight);
      
      // Cost per tonne-kilometer for each transport mode (estimated values)
      const costPerTonneKm = {
        truck: 0.115,  // €/tonne-km
        rail: 0.017,   // €/tonne-km
        sea: 0.0013,   // €/tonne-km
        air: 0.18     // €/tonne-km
      };

      response.data.lowestEmission.geojson.features.forEach(feature => {
        const distanceKm = feature.properties.distance;
        const transport = feature.properties.transport.toLowerCase();
        const costRate = costPerTonneKm[transport] || costPerTonneKm.truck;
        
        // Cost = distance * weight * cost per tonne-kilometer
        const segmentCost = distanceKm * weightInTonnes * costRate;
        totalCost += segmentCost;

        console.log(`Segment cost calculation:`, {
          transport,
          distanceKm,
          weightInTonnes,
          costRate,
          segmentCost
        });
      });

      console.log(`Total cost calculation:`, {
        weightInTonnes,
        totalCost
      });
      
      const newRoute = {
        id: Date.now().toString(),  // Add unique ID for each route
        origin: capitalizeString(origin).trim(),
        destination: capitalizeString(destination).trim(),
        weight: `${weight}${weightUnit}`,
        routeData: response.data,
        cost: totalCost
      };

      console.log(`Final route data:`, {
        route: `${origin} to ${destination}`,
        weight: `${weight}${weightUnit}`,
        weightInTonnes,
        totalCost
      });

      setRoutes([...routes, newRoute]);
      setSelectedRoutes(prev => new Set([...prev, newRoute.id]));  // Select new route by default
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

  const handleDeleteRoute = (routeId) => {
    setRoutes(routes.filter(route => route.id !== routeId));
    setSelectedRoutes(prev => {
      const next = new Set(prev);
      next.delete(routeId);
      return next;
    });
    if (routes.length <= 1) {
      setRouteData(null);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Routes Summary Report", 15, 10);

    const headers = [["Origin", "Destination", "Weight", "CO2 (kg)", "Cost (€)"]];

    // Extract the values for the table rows
    const rows = routes.map(route => [
      route.origin,
      route.destination,
      route.weight,
      parseFloat(route.routeData?.lowestEmission?.totalEmission).toFixed(2),
      parseFloat(route.cost).toFixed(2)
    ]);

    // Example totals; adjust if needed
    const totals = routes
      .filter(route => selectedRoutes.has(route.id))
      .reduce((sum, route) => {
        const weightInKg = route.weight.includes('kg') 
          ? parseFloat(route.weight)
          : parseFloat(route.weight) * 1000;
        const emissionPerKg = route.routeData?.lowestEmission?.totalEmission || 0;
        const totalEmission = emissionPerKg * weightInKg;
        return {
          emissions: sum.emissions + totalEmission,
          cost: sum.cost + (route.cost || 0)
        };
      }, { emissions: 0, cost: 0 });

    rows.push([
      "Total",
      "",
      "",
      totals.emissions.toFixed(2),
      totals.cost.toFixed(2)
    ]);
  
    // Generate the table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [20, 71, 230] },

      willDrawCell: (data) => {
        if (data.row.index === rows.length - 1) {
          doc.setFont("helvetica", "bold");
          doc.setFillColor(190, 219, 255);
        }
      }
    });
    
    doc.save("routes_summary.pdf");
  };

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate totals only for selected routes
  const totals = routes
    .filter(route => selectedRoutes.has(route.id))
    .reduce((sum, route) => {
      // Convert weight to kg
      const weightInKg = route.weight.includes('kg') 
        ? parseFloat(route.weight)
        : parseFloat(route.weight) * 1000; // Convert tonnes to kg
      
      // Get emission per kg and multiply by weight in kg
      const emissionPerKg = route.routeData?.lowestEmission?.totalEmission || 0;
      const totalEmission = emissionPerKg * weightInKg;
      
      console.log('Route emissions calculation:', {
        route: `${route.origin} to ${route.destination}`,
        weightInKg,
        emissionPerKg,
        totalEmission
      });
      
      return {
        emissions: sum.emissions + totalEmission,
        cost: sum.cost + (route.cost || 0)
      };
    }, { emissions: 0, cost: 0 });

  console.log('Total emissions:', totals.emissions);

  // Prepare chart data only for selected routes
  const emissionsChartData = routes
    .filter(route => selectedRoutes.has(route.id))
    .map(route => {
      // Convert weight to kg
      const weightInKg = route.weight.includes('kg') 
        ? parseFloat(route.weight)
        : parseFloat(route.weight) * 1000; // Convert tonnes to kg
      
      // Get emission per kg and multiply by weight in kg
      const emissionPerKg = route.routeData?.lowestEmission?.totalEmission || 0;
      const totalEmission = emissionPerKg * weightInKg;
      
      console.log('Chart data route:', {
        name: `${route.origin} to ${route.destination}`,
        weightInKg,
        emissionPerKg,
        totalEmission
      });
      
      return {
        name: `${route.origin} to ${route.destination}`,
        value: totalEmission
      };
    })
    .filter(item => item.value > 0);

  console.log('Emissions chart data:', emissionsChartData);

  const costChartData = routes
    .filter(route => selectedRoutes.has(route.id))
    .map(route => {
      // Convert weight to tonnes
      const weightInTonnes = route.weight.includes('kg') 
        ? parseFloat(route.weight) / 1000 
        : parseFloat(route.weight);
      
      const costPerTonne = (route.cost || 0) / weightInTonnes;
      
      console.log('Cost per tonne calculation:', {
        route: `${route.origin} to ${route.destination}`,
        totalCost: route.cost,
        weightInTonnes,
        costPerTonne
      });

      return {
        name: `${route.origin} to ${route.destination}`,
        value: costPerTonne
      };
    })
    .filter(item => item.value > 0);

  // Sort routes for display
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
      aValue = a.routeData?.lowestEmission?.totalEmission || 0;
      bValue = b.routeData?.lowestEmission?.totalEmission || 0;
    } else if (sortField === 'cost') {
      aValue = a.cost || 0;
      bValue = b.cost || 0;
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

  // Colors for the pie charts
  const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRoutes(new Set(routes.map(route => route.id)));
    } else {
      setSelectedRoutes(new Set());
    }
  };

    // Compute selected routes' data
    const selectedRoutesData = routes
      .filter(route => selectedRoutes.has(route.id))
      .map(route => route.routeData);

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
          <RouteLegend />
          <MapContainer>
            <Map routeData={selectedRoutesData} />
          </MapContainer>
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
                  <option value="t">t</option>
                  <option value="kg">kg</option>
                </UnitSelect>
              </WeightContainer>
              <AddButton 
                onClick={handleAddRoute}
                disabled={isLoading || !origin || !destination || !weight}
              >
                {isLoading ? <PulseLoader color="white" size={8} speedMultiplier={0.75}/> : 'Add Route'}
              </AddButton>
              <DownloadButton 
                onClick={handleDownloadPDF}
                disabled={isLoading || !routes || routes.length === 0}
              >
                Download PDF
              </DownloadButton>
            </SearchContainer>
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
              ActionButton={ActionButton}
            />
          </ContentContainer>
      ) : (
        <ContentContainer>
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
            <ChartContainer>
              <ChartTitle>Emissions Distribution</ChartTitle>
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
                      label={({ name, value }) => `${name}: ${value.toFixed(2)} kg CO₂`}
                    >
                      {emissionsChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value.toFixed(2)} kg CO₂`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartMessage>
                  Add routes to see emissions distribution
                </EmptyChartMessage>
              )}
            </ChartContainer>

            <ChartContainer>
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
                      label={({ name, value }) => `${name}: €${value.toFixed(2)}/t`}
                    >
                      {costChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `€${value.toFixed(2)}/t`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartMessage>
                  Add routes to see cost per tonne distribution
                </EmptyChartMessage>
              )}
            </ChartContainer>
          </ChartsContainer>

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
                <option value="t">t</option>
                <option value="kg">kg</option>
              </UnitSelect>
            </WeightContainer>
            <AddButton 
              onClick={handleAddRoute}
              disabled={isLoading || !origin || !destination || !weight}
            >
              {isLoading ? <PulseLoader color="white" size={8} speedMultiplier={0.75}/> : 'Add Route'}
            </AddButton>
            <DownloadButton 
              onClick={handleDownloadPDF}
              disabled={isLoading || !routes || routes.length === 0}
            >
              Download PDF
            </DownloadButton>
          </SearchContainer>
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
            ActionButton={ActionButton}
          />
        </ContentContainer>
      )}
    </Container>
  );
};

export default MultipleRoutes;
