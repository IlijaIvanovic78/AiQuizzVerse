import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { QuizProgress } from '../../../core/models/realtime-events.model';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { TABLET_UP, screenMatches } from '../../../shared/media-query';
import { PATH_STEP_COUNT, QUIZ_GENERATION_STEPS } from '../create.constants';
import { pathProgressFraction, quizProgressFraction, quizStepStates } from '../create.rules';
import { CreateKind } from '../create.types';

const HERO_SCALE = 2;
const WIDE_HERO_SCALE = 3;
const PET_SCALE = 1;
const WIDE_PET_SCALE = 2;

// The hero walks towards the treasure while the quiz master writes. Every quiz:progress event
// from the server moves the hero along and lights up a step.
@Component({
  selector: 'app-generation-progress',
  imports: [HeroSpriteComponent, PetSpriteComponent, PixelIconComponent],
  templateUrl: './generation-progress.component.html',
  styleUrl: './generation-progress.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationProgressComponent {
  readonly kind = input.required<CreateKind>();
  readonly progress = input.required<QuizProgress | null>();
  readonly heroKey = input.required<string | null>();
  readonly petKey = input<string | null>(null);

  private readonly wideScreen = screenMatches(TABLET_UP);

  protected readonly heroScale = computed(() => (this.wideScreen() ? WIDE_HERO_SCALE : HERO_SCALE));
  protected readonly petScale = computed(() => (this.wideScreen() ? WIDE_PET_SCALE : PET_SCALE));

  protected readonly quizSteps = computed(() => {
    const states = quizStepStates(this.progress());
    return QUIZ_GENERATION_STEPS.map(({ label }, index) => ({ label, state: states[index] }));
  });
  protected readonly pathStepsReady = computed(() => this.progress()?.done ?? 0);
  protected readonly pathSteps = Array.from({ length: PATH_STEP_COUNT }, (_, index) => index + 1);
  protected readonly walked = computed(() =>
    this.kind() === 'PATH'
      ? pathProgressFraction(this.progress())
      : quizProgressFraction(quizStepStates(this.progress())),
  );
}
