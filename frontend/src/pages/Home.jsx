import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8fafc;
`;

const Form = styled.form`
  width: 100%;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
              0 2px 4px -2px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(8px);
`;

const Input = styled.input`
  width: 100%;
  max-width: 240px;
  padding: 0.75rem 1rem;
  margin: 0.5rem auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: block;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const WeightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 240px;
  margin: 0.5rem auto;
`;

const WeightInput = styled(Input)`
  margin: 0;
  flex: 1;
`;

const UnitSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  width: 70px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const RouteTypeSelect = styled.div`
  display: flex;
  gap: 0.5rem;
  max-width: 240px;
  margin: 1rem auto;
`;

const RouteTypeButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background-color: ${props => {
    if (props.active) {
      return props.isGreen ? '#059669' : '#2563eb';
    }
    return 'white';
  }};
  color: ${props => props.active ? 'white' : props.isGreen ? '#059669' : '#2563eb'};
  border: 1px solid ${props => props.isGreen ? '#059669' : '#2563eb'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => {
      if (props.active) {
        return props.isGreen ? '#047857' : '#1d4ed8';
      }
      return '#f8fafc';
    }};
  }
`;

const Button = styled.button`
  width: 100%;
  max-width: 240px;
  padding: 0.75rem 1.5rem;
  margin: 1rem auto 0;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;

  &:hover {
    background-color: #1d4ed8;
    transform: translateY(-1px);
  }
`;

const Title = styled.h1`
  color: #1e293b;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1.75rem;
`;

const Home = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [routeType, setRouteType] = useState('green');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (origin && destination) {
      navigate('/map', { 
        state: { 
          origin, 
          destination,
          weight,
          weightUnit,
          routeType,
          shouldCalculateRoute: true 
        }
      });
    }
  };

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Form onSubmit={handleSubmit}>
          <Title>Route Calculator</Title>
          <Input
            type="text"
            placeholder="Origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <Input
            type="text"
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
              <option value="kg">kg</option>
              <option value="t">t</option>
            </UnitSelect>
          </WeightContainer>
          <RouteTypeSelect>
            <RouteTypeButton
              type="button"
              active={routeType === 'green'}
              onClick={() => setRouteType('green')}
              isGreen={true}
            >
              Lowest Emission
            </RouteTypeButton>
            <RouteTypeButton
              type="button"
              active={routeType === 'fastest'}
              onClick={() => setRouteType('fastest')}
            >
              Fastest Route
            </RouteTypeButton>
          </RouteTypeSelect>
          <Button type="submit">Calculate Route</Button>
        </Form>
      </motion.div>
    </Container>
  );
};

export default Home;
