import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChestView } from '../../../core/models/chest.model';
import { CHEST_NAMES, CHEST_SOURCES } from '../../../shared/chests';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { ChestSpriteComponent } from './chest-sprite.component';

@Component({
  selector: 'app-chest-card',
  imports: [RelativeTimePipe, ChestSpriteComponent],
  templateUrl: './chest-card.component.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestCardComponent {
  readonly chest = input.required<ChestView>();
  readonly busy = input(false);
  readonly open = output<void>();

  protected readonly name = computed(() => CHEST_NAMES[this.chest().type]);
  protected readonly source = computed(() => CHEST_SOURCES[this.chest().source]);
}
