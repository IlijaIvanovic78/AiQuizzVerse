import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChestOdds, ChestType } from '../../../core/models/chest.model';
import { CHEST_ICONS, CHEST_NAMES } from '../../../shared/chests';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';

const CHEST_TYPES: ChestType[] = ['WOODEN', 'SILVER', 'GOLDEN'];

// The drop rates straight from the server, so players can see there is no trick.
@Component({
  selector: 'app-chest-odds',
  imports: [PixelIconComponent, SpinnerComponent],
  templateUrl: './chest-odds.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestOddsComponent {
  readonly odds = input.required<ChestOdds | null>();

  protected readonly types = CHEST_TYPES;
  protected readonly chestIcons = CHEST_ICONS;
  protected readonly chestNames = CHEST_NAMES;
}
