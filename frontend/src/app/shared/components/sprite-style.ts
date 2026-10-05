import { SpriteEntry } from '../../core/models/sprite.model';

const PLACEHOLDER_FRAME_SIZE = 32;

export type SpriteStyle = Record<string, string>;

// The sheet is one row of frames, so moving the background by the full sheet width in
// steps(frames) shows every frame once per loop.
export function spriteStyle(sprite: SpriteEntry, sheetUrl: string, scale: number): SpriteStyle {
  const frameWidth = sprite.frameWidth * scale;
  const frameHeight = sprite.frameHeight * scale;
  const sheetWidth = frameWidth * sprite.frames;
  return {
    width: `${frameWidth}px`,
    height: `${frameHeight}px`,
    'background-image': `url(${sheetUrl})`,
    'background-size': `${sheetWidth}px ${frameHeight}px`,
    'animation-duration': `${sprite.frames / sprite.fps}s`,
    'animation-timing-function': `steps(${sprite.frames})`,
    '--sprite-sheet-width': `${sheetWidth}px`,
  };
}

// Keeps the space reserved while the manifest is still loading.
export function placeholderStyle(scale: number): SpriteStyle {
  const size = `${PLACEHOLDER_FRAME_SIZE * scale}px`;
  return { width: size, height: size };
}
