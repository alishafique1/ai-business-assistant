import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  variant?: 'particles' | 'waves' | 'geometric' | 'neural' | 'matrix';
  color?: string;
  intensity?: number;
  className?: string;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  variant = 'particles',
  color = '#3b82f6',
  intensity = 1,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Common materials
    const primaryColor = new THREE.Color(color);
    
    // Particle System
    if (variant === 'particles') {
      const particleCount = 3000;
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100;
        
        velocities[i] = (Math.random() - 0.5) * 0.02;
        velocities[i + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i + 2] = (Math.random() - 0.5) * 0.02;
        
        const color = primaryColor.clone();
        color.setHSL(
          color.getHSL({ h: 0, s: 0, l: 0 }).h + (Math.random() - 0.5) * 0.2,
          0.7,
          0.5 + Math.random() * 0.3
        );
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }

      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6 * intensity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });

      const particleSystem = new THREE.Points(particles, particleMaterial);
      scene.add(particleSystem);

      // Animation
      const animate = () => {
        const positions = particles.getAttribute('position').array as Float32Array;
        const velocities = particles.getAttribute('velocity').array as Float32Array;

        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Boundary checking
          if (Math.abs(positions[i]) > 50) velocities[i] *= -1;
          if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1;
          if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1;
        }

        particles.getAttribute('position').needsUpdate = true;
        particleSystem.rotation.y += 0.001;

        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };

      camera.position.z = 30;
      animate();
    }

    // Wave System
    else if (variant === 'waves') {
      const geometry = new THREE.PlaneGeometry(80, 80, 100, 100);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: primaryColor },
          intensity: { value: intensity }
        },
        vertexShader: `
          uniform float time;
          uniform float intensity;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            vUv = uv;
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            
            float elevation = sin(modelPosition.x * 0.3 + time) * 0.5;
            elevation += sin(modelPosition.y * 0.2 + time * 1.5) * 0.3;
            elevation += sin(modelPosition.x * 0.1 + modelPosition.y * 0.1 + time * 0.5) * 0.2;
            
            modelPosition.z += elevation * intensity;
            vElevation = elevation;
            
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            
            gl_Position = projectedPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float intensity;
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            float alpha = 0.3 + vElevation * 0.5;
            alpha *= intensity * 0.8;
            
            vec3 finalColor = color;
            finalColor.rgb += vElevation * 0.5;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        wireframe: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 4;
      scene.add(mesh);

      const animate = () => {
        material.uniforms.time.value += 0.01;
        mesh.rotation.z += 0.002;
        
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };

      camera.position.set(0, 20, 30);
      camera.lookAt(0, 0, 0);
      animate();
    }

    // Neural Network
    else if (variant === 'neural') {
      const nodeCount = 50;
      const nodes: THREE.Mesh[] = [];
      const connections: THREE.Line[] = [];

      // Create nodes
      for (let i = 0; i < nodeCount; i++) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: primaryColor,
          transparent: true,
          opacity: 0.8 * intensity
        });
        const node = new THREE.Mesh(geometry, material);
        
        node.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40
        );
        
        nodes.push(node);
        scene.add(node);
      }

      // Create connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = nodes[i].position.distanceTo(nodes[j].position);
          if (distance < 15 && Math.random() > 0.7) {
            const points = [nodes[i].position, nodes[j].position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: primaryColor,
              transparent: true,
              opacity: 0.3 * intensity
            });
            const line = new THREE.Line(geometry, material);
            connections.push(line);
            scene.add(line);
          }
        }
      }

      const animate = () => {
        nodes.forEach((node, i) => {
          node.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
          const scale = 1 + Math.sin(Date.now() * 0.003 + i) * 0.2;
          node.scale.setScalar(scale);
        });

        scene.rotation.y += 0.002;
        
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };

      camera.position.z = 50;
      animate();
    }

    // Matrix Digital Rain
    else if (variant === 'matrix') {
      const columns = 80;
      const characters: THREE.Mesh[] = [];
      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < 30; j++) {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = 32;
          canvas.height = 32;
          
          context.fillStyle = primaryColor.getStyle();
          context.font = '24px monospace';
          context.textAlign = 'center';
          context.fillText(
            chars[Math.floor(Math.random() * chars.length)], 
            16, 
            24
          );

          const texture = new THREE.CanvasTexture(canvas);
          const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            opacity: (1 - j / 30) * 0.8 * intensity
          });
          const sprite = new THREE.Sprite(material);
          
          sprite.position.set(
            (i - columns / 2) * 2,
            (j - 15) * 2,
            0
          );
          sprite.scale.setScalar(2);
          
          characters.push(sprite);
          scene.add(sprite);
        }
      }

      const animate = () => {
        characters.forEach((char, i) => {
          char.position.y -= 0.2;
          if (char.position.y < -30) {
            char.position.y = 30;
            
            // Update character
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.width = 32;
            canvas.height = 32;
            context.fillStyle = primaryColor.getStyle();
            context.font = '24px monospace';
            context.textAlign = 'center';
            context.fillText(
              chars[Math.floor(Math.random() * chars.length)], 
              16, 
              24
            );
            (char.material as THREE.SpriteMaterial).map = new THREE.CanvasTexture(canvas);
          }
        });
        
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };

      camera.position.z = 40;
      animate();
    }

    // Geometric Patterns
    else if (variant === 'geometric') {
      const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.ConeGeometry(0.5, 1, 6),
        new THREE.OctahedronGeometry(0.6)
      ];

      const shapes: THREE.Mesh[] = [];

      for (let i = 0; i < 100; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshBasicMaterial({
          color: primaryColor.clone().offsetHSL(
            (Math.random() - 0.5) * 0.2, 
            0, 
            (Math.random() - 0.5) * 0.3
          ),
          transparent: true,
          opacity: 0.6 * intensity,
          wireframe: Math.random() > 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 80
        );
        mesh.scale.setScalar(Math.random() * 3 + 1);
        
        shapes.push(mesh);
        scene.add(mesh);
      }

      const animate = () => {
        shapes.forEach((shape, i) => {
          shape.rotation.x += 0.01 + (i % 10) * 0.001;
          shape.rotation.y += 0.01 + (i % 7) * 0.001;
          shape.position.y += Math.sin(Date.now() * 0.001 + i) * 0.02;
        });

        scene.rotation.y += 0.001;
        
        renderer.render(scene, camera);
        frameRef.current = requestAnimationFrame(animate);
      };

      camera.position.z = 50;
      animate();
    }

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
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
  }, [variant, color, intensity]);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};