import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface SpriteManifestEntry {
  id: string;
  type: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  sheet: string;
  fps: number;
  rows?: number;
  cols?: number;
}

@Component({
  selector: 'app-sprite-animator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #spriteEl
      class="sprite-container"
      [style.width.px]="displaySize"
      [style.height.px]="displaySize"
      [style.image-rendering]="'pixelated'"
      [style.transform]="verticalShift ? 'translateY(-' + verticalShift + 'px)' : ''"
    ></div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .sprite-container {
        background-repeat: no-repeat;
        image-rendering: pixelated;
      }
    `,
  ],
})
export class SpriteAnimatorComponent implements OnInit, OnChanges, OnDestroy {
  private http = inject(HttpClient);

  /** The character id from manifest (e.g. 'mini-sword-man') */
  @Input() characterId: string | null = null;

  /** Display pixel size (square) */
  @Input() displaySize = 96;

  @ViewChild('spriteEl', { static: true }) spriteEl!: ElementRef<HTMLDivElement>;

  private manifest: SpriteManifestEntry[] = [];
  private entry: SpriteManifestEntry | null = null;
  private animFrameId = 0;
  private currentFrame = 0;
  private lastFrameTime = 0;
  private loaded = false;
  verticalShift = 0;

  ngOnInit() {
    this.http
      .get<SpriteManifestEntry[]>('/assets/avatars/manifest.json')
      .subscribe((data) => {
        this.manifest = data;
        this.loaded = true;
        this.setupSprite();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['characterId'] && this.loaded) {
      this.setupSprite();
    }
  }

  ngOnDestroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private yOffset = 0;

  private setupSprite() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }

    if (!this.characterId) return;

    this.entry = this.manifest.find((e) => e.id === this.characterId) ?? null;
    if (!this.entry) return;

    const el = this.spriteEl.nativeElement;
    const sheetUrl = `/assets/avatars${this.entry.sheet}`;
    const scale = this.displaySize / this.entry.frameWidth;
    const cols = this.entry.cols ?? this.entry.frames;
    const totalWidth = this.entry.frameWidth * cols;
    const rows = this.entry.rows ?? 1;
    const scaledHeight = this.entry.frameHeight * scale;

    el.style.backgroundImage = `url('${sheetUrl}')`;
    el.style.backgroundSize = `${totalWidth * scale}px ${scaledHeight * rows}px`;

    // Center vertically if sprite is taller than display area
    this.yOffset = (scaledHeight - this.displaySize) / 2;

    // For square frames, yOffset ≈ 0 but the character sits at the bottom
    // of the frame. Shift the container up to visually center the character.
    this.verticalShift = this.yOffset < 1 ? Math.round(this.displaySize * 0.15) : 0;
    el.style.backgroundPosition = `0 -${this.yOffset}px`;

    this.currentFrame = 0;
    this.lastFrameTime = 0;
    this.animate(0);
  }

  private animate = (timestamp: number) => {
    if (!this.entry) return;

    const frameDuration = 1000 / this.entry.fps;

    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    if (timestamp - this.lastFrameTime >= frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.entry.frames;
      this.lastFrameTime = timestamp;

      const scale = this.displaySize / this.entry.frameWidth;
      const offsetX = this.currentFrame * this.entry.frameWidth * scale;
      this.spriteEl.nativeElement.style.backgroundPosition = `-${offsetX}px -${this.yOffset}px`;
    }

    this.animFrameId = requestAnimationFrame(this.animate);
  };
}
