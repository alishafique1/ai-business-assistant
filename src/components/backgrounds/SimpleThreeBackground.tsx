import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SimpleThreeBackgroundProps {
  variant?: 'dots' | 'lines' | 'grid';
  color?: string;
  className?: string;
}

export const SimpleThreeBackground: React.FC<SimpleThreeBackgroundProps> = ({
  variant = 'dots',
  color = '#3b82f6',
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -50, 50, 30, -30, 0.1, 100
    );
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false,
      powerPreference: 'low-power'
    });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(1); // Fixed pixel ratio for better performance
    mountRef.current.appendChild(renderer.domElement);

    const primaryColor = new THREE.Color(color);

    if (variant === 'dots') {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(200 * 3); // Reduced particle count
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - 0.5) * 80;
        positions[i + 1] = (Math.random() - 0.5) * 60;
        positions[i + 2] = 0;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.PointsMaterial({
        color: primaryColor,
        size: 3,
        transparent: true,
        opacity: 0.4
      });
      
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const animate = () => {
        points.rotation.z += 0.001;
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } else if (variant === 'lines') {
      const lines: THREE.Line[] = [];
      
      for (let i = 0; i < 20; i++) {
        const points = [];
        for (let j = 0; j < 10; j++) {
          points.push(new THREE.Vector3(
            (j - 5) * 8 + (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 40,
            0
          ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: primaryColor,
          transparent: true,
          opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, material);
        lines.push(line);
        scene.add(line);
      }

      const animate = () => {
        lines.forEach((line, i) => {
          line.rotation.z += 0.001 * (i % 3 + 1);
        });
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } else if (variant === 'grid') {
      const gridHelper = new THREE.GridHelper(80, 20, primaryColor, primaryColor);
      gridHelper.rotation.x = Math.PI / 2;
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.2;
      scene.add(gridHelper);

      const animate = () => {
        gridHelper.rotation.z += 0.002;
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }

    camera.position.z = 20;

    const handleResize = () => {
      if (!mountRef.current) return;
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [variant, color]);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};