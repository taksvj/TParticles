import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateParticles = (shape: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;

    switch (shape) {
      case ShapeType.HEART: {
        // Heart shape parametric equation
        const t = Math.random() * Math.PI * 2;
        const r = Math.random(); // volume filler
        // Spread particles inside
        const scale = 0.5 * Math.sqrt(r); 
        x = scale * (16 * Math.pow(Math.sin(t), 3));
        y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        z = (Math.random() - 0.5) * 2; // Thickness
        // Normalize roughly
        x *= 0.2; y *= 0.2;
        break;
      }
      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.4;
        if (isRing) {
          // Ring
          const angle = Math.random() * Math.PI * 2;
          const radius = 2.5 + Math.random() * 1.5;
          x = Math.cos(angle) * radius;
          z = Math.sin(angle) * radius;
          y = (Math.random() - 0.5) * 0.1; // Thin disk
          // Tilt
          const tilt = Math.PI / 6;
          const ty = y * Math.cos(tilt) - z * Math.sin(tilt);
          const tz = y * Math.sin(tilt) + z * Math.cos(tilt);
          y = ty; z = tz;
        } else {
          // Planet Body
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 1.2 * Math.cbrt(Math.random());
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        }
        break;
      }
      case ShapeType.FLOWER: {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        const r = 2 + Math.sin(5 * u) * Math.sin(5 * v); // 5 petals
        const dist = Math.random() * r; // Fill
        
        // Polar to Cartesian
        // Flattened flower logic
        const angle = u;
        const radius = dist;
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);
        z = (Math.random() - 0.5) * 0.5 + Math.sin(dist * 2) * 0.5; // Wavy petals
        break;
      }
      case ShapeType.BUDDHA: {
        // Approximate meditative pose with primitives
        const part = Math.random();
        
        if (part < 0.2) {
          // Head
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 0.6 * Math.cbrt(Math.random());
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) + 1.2; // Offset up
          z = r * Math.cos(phi);
        } else if (part < 0.5) {
          // Torso (Cylindrical-ish)
          const theta = Math.random() * Math.PI * 2;
          const h = Math.random() * 1.4;
          const r = (0.5 + 0.3 * Math.sin(h * Math.PI)) * Math.sqrt(Math.random()); // Tapered
          x = r * Math.cos(theta);
          y = h - 0.2;
          z = r * Math.sin(theta);
        } else {
          // Base/Legs (Wide oval)
          const theta = Math.random() * Math.PI * 2;
          const r = 1.5 * Math.sqrt(Math.random());
          x = r * Math.cos(theta);
          y = (Math.random() - 0.5) * 0.4 - 0.4;
          z = r * 0.7 * Math.sin(theta); // Squashed z
        }
        break;
      }
      case ShapeType.FIREWORKS: {
         // Explosion sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 4 * Math.cbrt(Math.random()); // Large spread
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        break;
      }
      case ShapeType.SPHERE:
      default: {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 3 * Math.cbrt(Math.random());
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};
