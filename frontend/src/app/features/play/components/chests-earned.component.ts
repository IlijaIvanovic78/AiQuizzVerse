import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChestView } from '../../../core/models/chest.model';
import { CHEST_ICONS, CHEST_NAMES, CHEST_SOURCES } from '../../../shared/chests';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';

const CHEST_POP_DELAY_MS = 150;

// The chests this match gave the player, with the way to the treasure room where they open.
@Component({
  selector: 'app-chests-earned',
  imports: [RouterLink, PixelIconComponent],
  templateUrl: './chests-earned.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestsEarnedComponent {
  readonly chests = input.required<ChestView[]>();

  protected readonly chestIcons = CHEST_ICONS;
  protected readonly chestNames = CHEST_NAMES;
  protected readonly chestSources = CHEST_SOURCES;
  protected readonly popDelayMs = CHEST_POP_DELAY_MS;
}
