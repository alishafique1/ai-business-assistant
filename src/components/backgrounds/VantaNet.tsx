import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

interface VantaNetProps {
  className?: string;
}

export const VantaNet: React.FC<VantaNetProps> = ({
  className = ''
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    let effect: any = null;

    const initVanta = () => {
      try {
        // Check if Vanta and Three.js are loaded
        if (vantaRef.current && window.VANTA && window.THREE) {
          effect = window.VANTA.NET({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xff0033,
            backgroundColor: 0x000000,
            points: 20.00,
            maxDistance: 14.00,
            spacing: 10.00
          });

          setVantaEffect(effect);
          console.log('Vanta Net effect initialized successfully!');
        } else {
          console.warn('Vanta.js or Three.js not loaded yet, retrying...');
          // Retry after a short delay
          setTimeout(initVanta, 500);
        }
      } catch (error) {
        console.error('Failed to initialize Vanta.js Net:', error);
      }
    };

    // Wait a bit for scripts to load, then initialize
    const timer = setTimeout(initVanta, 1000);

    return () => {
      clearTimeout(timer);
      if (effect) {
        try {
          effect.destroy();
        } catch (error) {
          console.warn('Error destroying Vanta Net effect:', error);
        }
      }
    };
  }, []);

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
        minHeight: '400px'
      }}
    />
  );
};