import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const ThreeJSBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let animationId: number;
    let buildings: THREE.Mesh[] = [];
    let windowLights: THREE.PointLight[] = [];
    let ground: THREE.Mesh;

    try {
      console.log('Creating cinematic night city...');
      
      // Scene with night sky
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a15);
      scene.fog = new THREE.Fog(0x1a1a25, 80, 400);

      // Cinematic aerial camera
      camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 120, 150);
      camera.lookAt(0, 0, 0);

      // High-quality renderer
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: false,
        powerPreference: "high-performance"
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ReinhardToneMapping;
      renderer.toneMappingExposure = 0.3;
      
      mountRef.current.appendChild(renderer.domElement);

      // Create realistic city ground
      const groundGeometry = new THREE.PlaneGeometry(800, 600);
      const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x1a1a1a,
        emissive: 0x0a0a0a,
        emissiveIntensity: 0.1
      });
      ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      scene.add(ground);

      // Create street grid with subtle glow
      const createStreetGrid = () => {
        const streets: THREE.Line[] = [];
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x333333,
          transparent: true,
          opacity: 0.6
        });

        // Vertical streets
        for (let x = -300; x <= 300; x += 30) {
          const points = [
            new THREE.Vector3(x, 0.1, -250),
            new THREE.Vector3(x, 0.1, 250)
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, lineMaterial);
          scene.add(line);
          streets.push(line);
        }

        // Horizontal streets
        for (let z = -250; z <= 250; z += 30) {
          const points = [
            new THREE.Vector3(-300, 0.1, z),
            new THREE.Vector3(300, 0.1, z)
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, lineMaterial);
          scene.add(line);
          streets.push(line);
        }
      };

      createStreetGrid();

      // Create realistic buildings with proper proportions
      const createBuilding = (x: number, z: number, blockSizeX: number, blockSizeZ: number) => {
        const buildingWidth = 8 + Math.random() * 12;
        const buildingDepth = 8 + Math.random() * 12;
        const buildingHeight = 15 + Math.random() * 80;

        const geometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        
        // Realistic building material
        const material = new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(0.6, 0.1, 0.15 + Math.random() * 0.1),
          emissive: new THREE.Color().setHSL(0.6, 0.2, 0.02),
          emissiveIntensity: 0.1
        });

        const building = new THREE.Mesh(geometry, material);
        building.position.set(
          x + (Math.random() - 0.5) * (blockSizeX - buildingWidth),
          buildingHeight / 2,
          z + (Math.random() - 0.5) * (blockSizeZ - buildingDepth)
        );
        
        building.castShadow = true;
        building.receiveShadow = true;
        buildings.push(building);
        scene.add(building);

        // Add window lights - more realistic distribution
        const windowRows = Math.floor(buildingHeight / 4);
        const windowsPerRow = Math.floor(buildingWidth / 3);
        
        for (let row = 2; row < windowRows - 1; row++) {
          for (let col = 0; col < windowsPerRow; col++) {
            if (Math.random() > 0.4) { // 60% chance of lit window
              const windowLight = new THREE.PointLight(
                Math.random() > 0.7 ? 0xffeedd : 0xddddff, // Warm or cool light
                0.8,
                25
              );
              
              windowLight.position.set(
                building.position.x + (col - windowsPerRow/2) * 3,
                row * 4,
                building.position.z + (Math.random() > 0.5 ? buildingDepth/2 : -buildingDepth/2)
              );
              
              windowLights.push(windowLight);
              scene.add(windowLight);
            }
          }
        }

        // Add rooftop elements occasionally
        if (buildingHeight > 40 && Math.random() > 0.7) {
          // Communication tower
          const towerGeometry = new THREE.CylinderGeometry(0.2, 0.5, 8);
          const towerMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
          const tower = new THREE.Mesh(towerGeometry, towerMaterial);
          tower.position.set(
            building.position.x,
            building.position.y + buildingHeight/2 + 4,
            building.position.z
          );
          scene.add(tower);

          // Red blinking light
          const beaconLight = new THREE.PointLight(0xff3333, 2, 50);
          beaconLight.position.copy(tower.position);
          beaconLight.position.y += 4;
          windowLights.push(beaconLight);
          scene.add(beaconLight);
        }

        return building;
      };

      // Build the city in blocks
      const citySize = 250;
      const blockSize = 25;
      
      console.log('Generating city blocks...');
      for (let x = -citySize; x < citySize; x += blockSize) {
        for (let z = -citySize; z < citySize; z += blockSize) {
          // Skip some blocks for major avenues
          if (x % 60 === 0 || z % 60 === 0) continue;
          
          // Create 1-3 buildings per block
          const buildingsInBlock = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < buildingsInBlock; i++) {
            createBuilding(x, z, blockSize, blockSize);
          }
        }
      }

      // Atmospheric lighting
      const ambientLight = new THREE.AmbientLight(0x222244, 0.3);
      scene.add(ambientLight);

      // Moon/sky light
      const moonLight = new THREE.DirectionalLight(0x4466aa, 0.5);
      moonLight.position.set(200, 300, 100);
      moonLight.castShadow = true;
      moonLight.shadow.mapSize.width = 4096;
      moonLight.shadow.mapSize.height = 4096;
      moonLight.shadow.camera.near = 50;
      moonLight.shadow.camera.far = 800;
      moonLight.shadow.camera.left = -400;
      moonLight.shadow.camera.right = 400;
      moonLight.shadow.camera.top = 400;
      moonLight.shadow.camera.bottom = -400;
      scene.add(moonLight);

      // City glow from below
      const cityGlow = new THREE.HemisphereLight(0x2244aa, 0x111122, 0.4);
      scene.add(cityGlow);

      console.log(`Created ${buildings.length} buildings with ${windowLights.length} lights`);
      setIsLoaded(true);

      // Cinematic animation
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const time = Date.now() * 0.0005;

        // Cinematic aerial camera movement - slow and smooth
        const radius = 180;
        const height = 120 + Math.sin(time * 0.3) * 30;
        
        camera.position.x = Math.sin(time * 0.2) * radius;
        camera.position.z = 150 + Math.cos(time * 0.2) * radius * 0.5;
        camera.position.y = height;
        
        // Always look at city center with slight offset
        const lookAtTarget = new THREE.Vector3(
          Math.sin(time * 0.1) * 20,
          0,
          Math.cos(time * 0.15) * 15
        );
        camera.lookAt(lookAtTarget);

        // Animate building lights (subtle flickering)
        windowLights.forEach((light, index) => {
          if ((light as any).isBeacon) {
            // Blinking beacon lights
            light.intensity = Math.sin(time * 8 + index) > 0 ? 2 : 0;
          } else {
            // Subtle window light variation
            const baseIntensity = (light as any).baseIntensity || 0.8;
            light.intensity = baseIntensity + Math.sin(time * 2 + index * 0.1) * 0.1;
          }
        });

        renderer.render(scene, camera);
      };

      // Mark beacon lights
      windowLights.forEach(light => {
        if (light.color.r > 0.8 && light.color.g < 0.5) {
          (light as any).isBeacon = true;
        } else {
          (light as any).baseIntensity = light.intensity;
        }
      });

      animate();

      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        
        buildings.forEach(building => {
          scene.remove(building);
          building.geometry.dispose();
          (building.material as THREE.Material).dispose();
        });

        windowLights.forEach(light => scene.remove(light));
        
        if (ground) {
          scene.remove(ground);
          ground.geometry.dispose();
          (ground.material as THREE.Material).dispose();
        }
        
        scene.clear();
        renderer.dispose();
        
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };

    } catch (err) {
      console.error('Cinematic city error:', err);
      setError(`3D Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-slate-800 to-black">
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-slate-800 to-black flex items-center justify-center text-white z-10">
          <div className="text-center">
            <div className="text-xl font-light mb-4">Building Metropolis</div>
            <div className="flex space-x-2">
              <div className="w-2 h-8 bg-blue-400 animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-6 bg-blue-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-10 bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-2 h-4 bg-blue-200 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <div className="w-2 h-12 bg-blue-400 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
            </div>
            <div className="text-sm opacity-70 mt-2">Aerial Night View</div>
          </div>
        </div>
      )}
    </div>
  );
};