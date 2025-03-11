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
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (origin && destination) {
      navigate('/map', { 
        state: { 
          origin, 
          destination,
          weight,
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
          <Input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={{ maxWidth: '240px' }}
          />
          <Button type="submit">Calculate Route</Button>
        </Form>
      </motion.div>
    </Container>
  );
};

export default Home;
