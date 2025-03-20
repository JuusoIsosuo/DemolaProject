import React from 'react';
import styled from '@emotion/styled';

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  color: #4b5563;
  margin-bottom: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1e293b;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
`;

const RadioInput = styled.input`
  width: 1rem;
  height: 1rem;
  cursor: pointer;
`;

const EmissionControls = ({
  truckEmissionClass,
  onTruckEmissionChange,
  trainType,
  onTrainTypeChange
}) => {
  const euroClasses = [
    'EURO I',
    'EURO II',
    'EURO III',
    'EURO IV',
    'EURO V',
    'EURO VI'
  ];

  return (
    <>
      <Section>
        <SectionTitle>Truck Emission Class</SectionTitle>
        <Select
          value={truckEmissionClass}
          onChange={(e) => onTruckEmissionChange(e.target.value)}
        >
          {euroClasses.map(className => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </Select>
      </Section>

      <Section>
        <SectionTitle>Train Type</SectionTitle>
        <RadioGroup>
          <RadioLabel>
            <RadioInput
              type="radio"
              name="trainType"
              value="electric"
              checked={trainType === 'electric'}
              onChange={(e) => onTrainTypeChange(e.target.value)}
            />
            Electric Train
          </RadioLabel>
          <RadioLabel>
            <RadioInput
              type="radio"
              name="trainType"
              value="diesel"
              checked={trainType === 'diesel'}
              onChange={(e) => onTrainTypeChange(e.target.value)}
            />
            Diesel Train
          </RadioLabel>
        </RadioGroup>
      </Section>
    </>
  );
};

export default EmissionControls; 