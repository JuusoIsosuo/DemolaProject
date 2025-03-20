import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const TransportButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: ${props => props.selected ? '#2563eb' : 'white'};
  color: ${props => props.selected ? 'white' : '#2563eb'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? '#1d4ed8' : '#f8fafc'};
  }

  &:first-child {
    border-color: ${props => props.selected ? '#2563eb' : '#e2e8f0'};
  }
`;

const TransportTypeSelector = ({ selectedTypes, onTypeSelect }) => {
  const transportTypes = [
    { id: 'all', label: 'All' },
    { id: 'truck', label: 'Truck' },
    { id: 'rail', label: 'Rail' },
    { id: 'sea', label: 'Sea' },
    { id: 'air', label: 'Air' }
  ];

  const handleTypeClick = (typeId) => {
    if (typeId === 'all') {
      onTypeSelect(['all']);
      return;
    }

    const newTypes = selectedTypes.includes('all')
      ? [typeId]
      : selectedTypes.includes(typeId)
        ? selectedTypes.filter(t => t !== typeId)
        : [...selectedTypes, typeId];

    if (newTypes.length === 0) {
      onTypeSelect(['all']);
    } else {
      onTypeSelect(newTypes);
    }
  };

  return (
    <Container>
      {transportTypes.map(type => (
        <TransportButton
          key={type.id}
          selected={selectedTypes.includes(type.id)}
          onClick={() => handleTypeClick(type.id)}
        >
          {type.label}
        </TransportButton>
      ))}
    </Container>
  );
};

export default TransportTypeSelector; 