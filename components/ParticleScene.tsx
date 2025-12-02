import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { generateParticles } from '../utils/geometry';
import { ShapeType } from '../types';

interface SceneProps {
  shape: ShapeType;
  color: string;
  expansion: number;
  trailLength: number;
}

const PARTICLE_COUNT = 4000; // Reduced for performance with trails
const MAX_TRAIL_LENGTH = 30; // Maximum buffer size

// Custom Shader for fading particles
const ParticleShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color() },
  },
  vertexShader: `
    attribute float size;
    attribute float opacity;
    varying float vOpacity;
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying float vOpacity;
    void main() {
      // Circle shape
      if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
      gl_FragColor = vec4(color, vOpacity);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const Particles: React.FC<SceneProps> = ({ shape, color, expansion, trailLength }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Base positions for the shape (templates)
  const templatePositions = useMemo(() => generateParticles(shape, PARTICLE_COUNT), [shape]);
  
  // Buffers for the full trail system
  // Structure: [HeadBatch, Trail1Batch, Trail2Batch, ...]
  const { positions, opacities, sizes } = useMemo(() => {
    const totalPoints = PARTICLE_COUNT * MAX_TRAIL_LENGTH;
    const pos = new Float32Array(totalPoints * 3);
    const ops = new Float32Array(totalPoints);
    const szs = new Float32Array(totalPoints);
    
    // Initialize opacities and sizes based on trail index
    for (let t = 0; t < MAX_TRAIL_LENGTH; t++) {
        const opacity = Math.max(0, 1.0 - (t / MAX_TRAIL_LENGTH)); // Linear fade
        const size = Math.max(0, 0.03 * (1.0 - (t / MAX_TRAIL_LENGTH) * 0.5)); // Slight size fade

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const idx = t * PARTICLE_COUNT + i;
            ops[idx] = opacity;
            szs[idx] = size;
        }
    }
    
    // Initialize positions with template to avoid flash at (0,0,0)
    for (let t = 0; t < MAX_TRAIL_LENGTH; t++) {
        pos.set(templatePositions, t * PARTICLE_COUNT * 3);
    }

    return { positions: pos, opacities: ops, sizes: szs };
  }, [templatePositions]);

  // Update uniform color when prop changes
  useEffect(() => {
    if (pointsRef.current) {
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.color.value.set(color);
    }
  }, [color]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;

    // 1. Shift positions down to create trails
    // We copy the range [0 ... End-Batch] to [Batch ... End]
    // effectively: Trail_N = Trail_{N-1}, Trail_1 = Head
    const array = positionAttribute.array as Float32Array;
    const shiftSize = (MAX_TRAIL_LENGTH - 1) * PARTICLE_COUNT * 3;
    
    // copyWithin(target, start, end)
    array.copyWithin(PARTICLE_COUNT * 3, 0, shiftSize);

    // 2. Calculate new Head positions
    const targetScale = 0.5 + (expansion * 2.0); 
    const rotSpeed = 0.1 + expansion * 0.5;
    const angle = time * rotSpeed;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      
      // Original template position
      const bx = templatePositions[idx];
      const by = templatePositions[idx + 1];
      const bz = templatePositions[idx + 2];

      // Noise
      const noise = Math.sin(time * 0.5 + bx * 0.5) * 0.05;

      // Rotation
      const rx = bx * cosA - bz * sinA;
      const rz = bx * sinA + bz * cosA;
      const ry = by;

      // Expansion
      const x = rx * targetScale + noise;
      const y = ry * targetScale + noise;
      const z = rz * targetScale + noise;

      // Update ONLY the head batch (first PARTICLE_COUNT points)
      array[idx] = x;
      array[idx + 1] = y;
      array[idx + 2] = z;
    }

    positionAttribute.needsUpdate = true;
    
    // 3. Set Draw Range based on desired trail length
    // We render 1 (head) + trailLength batches
    const visibleParticles = PARTICLE_COUNT * (1 + trailLength);
    geometry.setDrawRange(0, Math.min(visibleParticles, PARTICLE_COUNT * MAX_TRAIL_LENGTH));
  });

  return (
    <points ref={pointsRef} material={ParticleShaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT * MAX_TRAIL_LENGTH}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={PARTICLE_COUNT * MAX_TRAIL_LENGTH}
          array={opacities}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT * MAX_TRAIL_LENGTH}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
};

export const ParticleScene: React.FC<SceneProps> = (props) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
        <ambientLight intensity={0.5} />
        
        <Particles {...props} />
        
        <Environment preset="city" />
        
        {/* Background effects */}
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 15]} />
      </Canvas>
    </div>
  );
};
