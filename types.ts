export enum ShapeType {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  FIREWORKS = 'Fireworks',
}

export interface ParticleConfig {
  count: number;
  color: string;
  shape: ShapeType;
  expansion: number; // 0.0 to 1.0
  trailLength: number;
}

export interface ToolResponse {
  expansion: number;
}
