import { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';

const CounterContainer = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
`;

// Easing function for smoother animation
const easeOutExpo = (x) => {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

const AnimatedCounter = ({ value, prefix = '', suffix = '', duration = 1000 }) => {
  const [count, setCount] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const animate = (currentTime) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function to progress
      const easedProgress = easeOutExpo(progress);
      
      // Calculate the current value with proper scaling
      const currentValue = Math.floor(value * easedProgress);
      setCount(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    // Reset animation
    setCount(0);
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return (
    <CounterContainer>
      {prefix}{count.toLocaleString()}{suffix}
    </CounterContainer>
  );
};

export default AnimatedCounter; 