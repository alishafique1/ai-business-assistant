import React, { useEffect, useRef, useState } from 'react';

interface VantaRingProps {
  className?: string;
  color?: string;
  backgroundColor?: string;
  scale?: number;
  scaleMobile?: number;
}

export const VantaRing: React.FC<VantaRingProps> = ({
  className = '',
  color = 0x3b82f6,
  backgroundColor = 0x000000,
  scale = 1,
  scaleMobile = 0.8
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    let effect: any = null;

    const initVanta = async () => {
      try {
        // Dynamically import Vanta and Three.js
        const [VANTA, THREE] = await Promise.all([
          import('vanta/dist/vanta.rings.min.js'),
          import('three')
        ]);

        if (!vantaRef.current) return;

        // Check if mobile
        const isMobile = window.innerWidth < 768;

        effect = (VANTA.default || VANTA).RINGS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: isMobile ? scaleMobile : scale,
          scaleMobile: scaleMobile,
          color: color,
          backgroundColor: backgroundColor,
          forceAnimate: true,
          speed: 0.8,
          zoom: 1.0,
          xOffset: 0.0,
          yOffset: 0.0
        });
        
        console.log('Vanta Ring effect initialized:', effect);

        setVantaEffect(effect);
      } catch (error) {
        console.warn('Vanta.js failed to load:', error);
      }
    };

    initVanta();

    // Cleanup function
    return () => {
      if (effect) {
        try {
          effect.destroy();
        } catch (error) {
          console.warn('Error destroying Vanta effect:', error);
        }
      }
    };
  }, [color, backgroundColor, scale, scaleMobile]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (vantaEffect && vantaEffect.resize) {
        vantaEffect.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [vantaEffect]);

  return (
    <div 
      ref={vantaRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ 
        zIndex: 0,
        opacity: 0.6 
      }}
    />
  );
};