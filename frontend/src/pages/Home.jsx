import React from 'react';
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

const Title = styled.h1`
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 3rem;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button`
  padding: 1rem 2rem;
  font-size: 1.125rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;

  &:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Title>Demola Logistics</Title>
      <ButtonContainer>
        <Button onClick={() => navigate('/map')}>
          Single Route
        </Button>
        <Button onClick={() => navigate('/multiple-routes')}>
          Multiple Routes
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default Home;
