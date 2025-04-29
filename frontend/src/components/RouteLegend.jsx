import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  position: absolute;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background-color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  right: 5rem;
  z-index: 1;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

const DashBox = styled.div`
  width: 24px;
  height: 2px;
  background: repeating-linear-gradient(
    to right,
    ${props => props.color} 0,
    ${props => props.color} ${props => props.dash[0]}px,
    transparent ${props => props.dash[0]}px,
    transparent ${props => props.dash[0] + props.dash[1]}px
  );
`;

const RouteLegend = () => {
  const transportTypes = [
    { id: 'truck', label: 'Truck Transport', color: '#374151', dash: [1, 0] },
    { id: 'rail', label: 'Rail Transport', color: '#059669', dash: [8, 4] },
    { id: 'sea', label: 'Sea Transport', color: '#2563eb', dash: [1, 0] },
    { id: 'air', label: 'Air Transport', color: '#dc2626', dash: [3, 3] }
  ];

  return (
    <Container>
      {transportTypes.map(type => (
        <LegendItem key={type.id}>
          <DashBox color={type.color} dash={type.dash} />
          <span>{type.label}</span>
        </LegendItem>
      ))}
    </Container>
  );
};

export default RouteLegend; 