import { useState, useEffect } from 'react';

interface UseAnimatedCounterProps {
  end: number;
  duration?: number;
  isVisible: boolean;
  suffix?: string;
}

export const useAnimatedCounter = ({ 
  end, 
  duration = 2000, 
  isVisible,
  suffix = ''
}: UseAnimatedCounterProps) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * end);
      
      setCurrent(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCurrent(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  const displayValue = suffix === '%' ? `${current}${suffix}` : 
                      suffix === '+' ? `${current}${suffix}` : 
                      current.toString();

  return displayValue;
};