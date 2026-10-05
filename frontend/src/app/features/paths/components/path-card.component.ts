import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PathSummary } from '../../../core/models/path.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { AudienceLabelPipe } from '../../../shared/pipes/audience-label.pipe';
import { LanguageLabelPipe } from '../../../shared/pipes/language-label.pipe';
import { trailSteps } from '../path-map';

@Component({
  selector: 'app-path-card',
  imports: [RouterLink, PixelIconComponent, AudienceLabelPipe, LanguageLabelPipe],
  templateUrl: './path-card.component.html',
  styleUrl: './path-card.component.css',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathCardComponent {
  readonly path = input.required<PathSummary>();

  protected readonly complete = computed(() => this.path().nextStep === null);
  protected readonly perfect = computed(() => this.path().stars === this.path().maxStars);
  protected readonly pips = computed(() => trailSteps(this.path()));
}
