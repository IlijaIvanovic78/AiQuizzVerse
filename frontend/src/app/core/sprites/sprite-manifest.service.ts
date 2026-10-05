import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, shareReplay } from 'rxjs';
import { SpriteEntry } from '../models/sprite.model';

const SPRITES_URL = '/assets/sprites/';
const MANIFEST_URL = `${SPRITES_URL}manifest.json`;

function preloadImage(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

// The manifest is a static asset, so it is loaded with fetch and never goes through the
// HttpClient auth interceptor.
@Injectable({ providedIn: 'root' })
export class SpriteManifestService {
  private readonly sprites$ = from(this.load()).pipe(shareReplay(1));
  readonly sprites = toSignal(this.sprites$, { initialValue: [] });

  getSprite(key: string | null): SpriteEntry | null {
    return this.sprites().find((sprite) => sprite.key === key) ?? null;
  }

  sheetUrl(sprite: SpriteEntry): string {
    return SPRITES_URL + sprite.sheet;
  }

  private async load(): Promise<SpriteEntry[]> {
    const sprites = await this.fetchManifest();
    await this.preloadSheets(sprites);
    return sprites;
  }

  private async fetchManifest(): Promise<SpriteEntry[]> {
    try {
      const response = await fetch(MANIFEST_URL);
      if (!response.ok) {
        return [];
      }
      const sprites: SpriteEntry[] = await response.json();
      return sprites;
    } catch {
      return [];
    }
  }

  private async preloadSheets(sprites: SpriteEntry[]): Promise<void> {
    try {
      await Promise.all(sprites.map((sprite) => preloadImage(this.sheetUrl(sprite))));
    } catch {
      // A sheet that failed to preload is simply fetched again when it is first shown.
    }
  }
}
