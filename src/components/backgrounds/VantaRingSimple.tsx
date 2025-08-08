import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

interface VantaRingSimpleProps {
  className?: string;
}

export const VantaRingSimple: React.FC<VantaRingSimpleProps> = ({
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
          effect = window.VANTA.RINGS({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.5,
            scaleMobile: 1.0,
            color: 0x6366f1,
            backgroundColor: 0x0f1419,
            forceAnimate: true,
            speed: 0.8,
            zoom: 0.9
          });

          setVantaEffect(effect);
          console.log('Vanta Ring effect initialized successfully!');
        } else {
          console.warn('Vanta.js or Three.js not loaded yet');
          // Retry after a short delay
          setTimeout(initVanta, 500);
        }
      } catch (error) {
        console.error('Failed to initialize Vanta.js:', error);
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
          console.warn('Error destroying Vanta effect:', error);
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