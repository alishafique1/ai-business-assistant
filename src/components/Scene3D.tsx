import { Canvas } from '@react-three/fiber';
import { Float, Text3D, OrbitControls, Environment, Sphere, Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function FloatingElements() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[0.5, 32, 32]} position={[2, 1, 0]}>
          <meshStandardMaterial color="#8B5CF6" transparent opacity={0.8} />
        </Sphere>
      </Float>
      
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.7}>
        <Box args={[0.8, 0.8, 0.8]} position={[-2, -1, 1]}>
          <meshStandardMaterial color="#06B6D4" transparent opacity={0.7} />
        </Box>
      </Float>
      
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.6}>
        <Sphere args={[0.3, 16, 16]} position={[0, 2, -1]}>
          <meshStandardMaterial color="#F59E0B" transparent opacity={0.9} />
        </Sphere>
      </Float>
    </group>
  );
}

export const Scene3D = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    >
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <FloatingElements />
      
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
};