import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpriteAnimatorComponent } from '../sprite-animator/sprite-animator.component';

@Component({
  selector: 'app-avatar-display',
  standalone: true,
  imports: [CommonModule, SpriteAnimatorComponent],
  template: `
    <div class="relative flex items-center justify-center" [style.width.px]="size" [style.height.px]="size">
      @if (avatarUrl) {
        <div [class.ring-2]="ring" [class.ring-primary-500]="ring" class="rounded-full overflow-hidden flex items-center justify-center"
             [style.width.px]="size" [style.height.px]="size">
          <app-sprite-animator [characterId]="avatarUrl" [displaySize]="size"></app-sprite-animator>
        </div>
      } @else {
        <div class="w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600"
             [class.ring-2]="ring"
             [class.ring-primary-500]="ring">
          <svg [attr.width]="size * 0.5" [attr.height]="size * 0.5" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
          </svg>
        </div>
      }
    </div>
  `,
})
export class AvatarDisplayComponent {
  @Input() avatarUrl: string | null = null;
  @Input() size = 80;
  @Input() ring = false;
}
