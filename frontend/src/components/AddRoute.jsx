import React from 'react';
import styled from '@emotion/styled';
import { PulseLoader } from "react-spinners";

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  background: #fff;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const WeightContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
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
  background: #fff;
`;

const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  &:hover { background-color: #1d4ed8; }
  &:disabled { background-color: #93c5fd; cursor: not-allowed; }
`;

const DownloadButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  margin-left: auto;
  &:hover { background-color: #1d4ed8; }
  &:disabled { background-color: #93c5fd; cursor: not-allowed; }
`;

const AddRoute = ({
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
  onChangeWeightUnit
}) => {
  return (
    <SearchContainer>
      <SearchInput
        placeholder="Origin"
        value={origin}
        onChange={onChangeOrigin}
      />
      <SearchInput
        placeholder="Destination"
        value={destination}
        onChange={onChangeDestination}
      />
      <WeightContainer>
        <WeightInput
          type="number"
          placeholder="Weight"
          value={weight}
          onChange={onChangeWeight}
        />
        <UnitSelect
          value={weightUnit}
          onChange={onChangeWeightUnit}
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
      >
        Download PDF
      </DownloadButton>
    </SearchContainer>
  );
};

export default AddRoute;
