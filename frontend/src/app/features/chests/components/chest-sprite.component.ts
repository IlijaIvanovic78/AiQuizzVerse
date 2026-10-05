import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChestType } from '../../../core/models/chest.model';
import { CHESTS_URL, CHEST_FRAME_COUNT, CHEST_FRAME_SIZE } from '../chests.constants';

type ChestPose = 'closed' | 'shaking' | 'opening';

// One chest from its strip of 4 frames: closed, shaking, lid half open and open.
// Shaking flips between the first two frames; opening plays the last two once and stays open.
// The text next to the chest names it, so the picture is hidden from screen readers.
@Component({
  selector: 'app-chest-sprite',
  template: `<div class="chest" [class]="'chest-' + pose()" [style]="style()"></div>`,
  styleUrl: './chest-sprite.component.css',
  host: { class: 'block', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestSpriteComponent {
  readonly type = input.required<ChestType>();
  readonly pose = input<ChestPose>('closed');
  // Screen pixels per art pixel; whole numbers keep the pixels sharp.
  readonly scale = input(3);

  protected readonly style = computed(() => {
    const frame = CHEST_FRAME_SIZE * this.scale();
    return {
      width: `${frame}px`,
      height: `${frame}px`,
      'background-image': `url(${CHESTS_URL}${this.type().toLowerCase()}.png)`,
      'background-size': `${frame * CHEST_FRAME_COUNT}px ${frame}px`,
      '--frame': `${frame}px`,
    };
  });
}
