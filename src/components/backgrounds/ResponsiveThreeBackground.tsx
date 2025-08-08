import React, { useState, useEffect } from 'react';
import { ThreeBackground } from './ThreeBackground';
import { SimpleThreeBackground } from './SimpleThreeBackground';

// Simple mobile detection hook
const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileKeywords = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const screenWidth = window.innerWidth;
      
      setIsMobile(mobileKeywords.test(userAgent) || screenWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

interface ResponsiveThreeBackgroundProps {
  variant?: 'particles' | 'waves' | 'geometric' | 'neural' | 'matrix' | 'dots' | 'lines' | 'grid';
  color?: string;
  intensity?: number;
  className?: string;
  forceSimple?: boolean;
}

export const ResponsiveThreeBackground: React.FC<ResponsiveThreeBackgroundProps> = ({
  variant = 'particles',
  color = '#3b82f6',
  intensity = 1,
  className = '',
  forceSimple = false
}) => {
  const isMobile = useMobile();
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Performance detection
    const detectPerformance = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        setIsLowPerformance(true);
        return;
      }

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setShouldRender(false);
        return;
      }

      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 2;
      if (cores < 4) {
        setIsLowPerformance(true);
      }

      // Check memory (if available)
      const memory = (navigator as any).deviceMemory;
      if (memory && memory < 4) {
        setIsLowPerformance(true);
      }

      // Battery API check
      (navigator as any).getBattery?.().then((battery: any) => {
        if (battery.level < 0.3) {
          setIsLowPerformance(true);
        }
      });
    };

    detectPerformance();
  }, []);

  // Don't render anything if user prefers reduced motion
  if (!shouldRender) {
    return (
      <div className={`absolute inset-0 pointer-events-none ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </div>
    );
  }

  // Use simple version for mobile, low performance devices, or when forced
  if (isMobile || isLowPerformance || forceSimple) {
    const simpleVariant = (['particles', 'waves', 'geometric', 'neural', 'matrix'].includes(variant)) 
      ? 'dots' 
      : variant as 'dots' | 'lines' | 'grid';

    return (
      <SimpleThreeBackground
        variant={simpleVariant}
        color={color}
        className={className}
      />
    );
  }

  // Use full Three.js version for desktop with good performance
  return (
    <ThreeBackground
      variant={variant as 'particles' | 'waves' | 'geometric' | 'neural' | 'matrix'}
      color={color}
      intensity={intensity}
      className={className}
    />
  );
};