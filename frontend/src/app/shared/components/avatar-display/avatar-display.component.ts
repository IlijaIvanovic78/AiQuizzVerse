import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpriteAnimatorComponent } from '../sprite-animator/sprite-animator.component';

@Component({
  selector: 'app-avatar-display',
  standalone: true,
  imports: [CommonModule, SpriteAnimatorComponent],
  template: `
    <div class="relative inline-block" [style.width.px]="size" [style.height.px]="size">
      <div class="relative flex items-center justify-center w-full h-full">
        @if (avatarUrl) {
          <div
            [class.ring-2]="ring"
            [class.ring-primary-500]="ring"
            class="rounded-full overflow-hidden flex items-center justify-center"
            [style.width.px]="size"
            [style.height.px]="size"
          >
            <div [style.margin-top.px]="size * -0.18"
                 [style.transform]="'translateX(' + (size * 0.06) + 'px)'"
            >
              <app-sprite-animator
                [characterId]="avatarUrl"
                [displaySize]="spriteSize"
              ></app-sprite-animator>
            </div>
          </div>
        } @else {
          <div
            class="w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600"
            [class.ring-2]="ring"
            [class.ring-primary-500]="ring"
          >
            <svg
              [attr.width]="size * 0.5"
              [attr.height]="size * 0.5"
              viewBox="0 0 24 24"
              fill="white"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </div>
        }
      </div>
      @if (petUrl) {
        <div
          class="absolute z-10"
          [style.width.px]="petSize"
          [style.height.px]="petSize"
          [style.bottom.px]="size * 0.18"
          [style.left.px]="size * -0.05"
        >
          <app-sprite-animator [characterId]="petUrl" [displaySize]="petSize"></app-sprite-animator>
        </div>
      }
    </div>
  `,
})
export class AvatarDisplayComponent {
  @Input() avatarUrl: string | null = null;
  @Input() petUrl: string | null = null;
  @Input() size = 80;
  @Input() ring = false;

  private readonly smallPets = new Set([
    'pet-bird', 'pet-hermie', 'pet-roach', 'pet-mr-circuit',
    'pet-orchid-owl', 'pet-martian-red', 'pet-robot-walky',
  ]);

  get petSize(): number {
    const base = this.size * 0.65;
    if (this.petUrl && this.smallPets.has(this.petUrl)) {
      return Math.round(base * 0.7);
    }
    return Math.round(base);
  }

  get spriteSize(): number {
    return Math.round(this.size * 1.15);
  }
}
