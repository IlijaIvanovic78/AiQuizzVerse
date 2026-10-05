import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PathSummary } from '../../../core/models/path.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { AudienceLabelPipe } from '../../../shared/pipes/audience-label.pipe';
import { LanguageLabelPipe } from '../../../shared/pipes/language-label.pipe';

type PipState = 'cleared' | 'next' | 'locked';

interface TrailPip {
  position: number;
  state: PipState;
  isCastle: boolean;
}

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

  // Steps unlock one after another, so the cleared count is enough to colour the mini trail.
  protected readonly pips = computed<TrailPip[]>(() => {
    const { stepsCleared, totalSteps } = this.path();
    return Array.from({ length: totalSteps }, (_, index) => ({
      position: index + 1,
      state: pipState(index, stepsCleared),
      isCastle: index === totalSteps - 1,
    }));
  });
}

function pipState(index: number, stepsCleared: number): PipState {
  if (index < stepsCleared) {
    return 'cleared';
  }
  return index === stepsCleared ? 'next' : 'locked';
}
