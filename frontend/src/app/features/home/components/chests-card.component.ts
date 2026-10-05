import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { SectionStatus } from '../home.types';

@Component({
  selector: 'app-chests-card',
  imports: [RouterLink, PixelIconComponent, SpinnerComponent],
  templateUrl: './chests-card.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestsCardComponent {
  readonly count = input.required<number>();
  readonly status = input.required<SectionStatus>();
}
