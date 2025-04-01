import React from 'react';
import styled from '@emotion/styled';

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
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 2rem;
`;

const MultipleRoutes = () => {
  return (
    <Container>
      <Title>Multiple Routes</Title>
      {/* Content will be added later */}
    </Container>
  );
};

export default MultipleRoutes; 