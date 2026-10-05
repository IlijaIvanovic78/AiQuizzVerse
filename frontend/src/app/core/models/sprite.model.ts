export type SpriteType = 'hero' | 'pet';

export interface SpriteEntry {
  key: string;
  type: SpriteType;
  name: string;
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
}
