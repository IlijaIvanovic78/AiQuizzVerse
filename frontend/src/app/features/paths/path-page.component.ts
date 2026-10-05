import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { StepView } from '../../core/models/path.model';
import { ReadAloudService } from '../../core/sound/read-aloud.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { DESKTOP_UP, screenMatches } from '../../shared/media-query';
import { AudienceLabelPipe } from '../../shared/pipes/audience-label.pipe';
import { LanguageLabelPipe } from '../../shared/pipes/language-label.pipe';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { PathsActions } from '../../store/paths/paths.actions';
import { pathsFeature } from '../../store/paths/paths.reducer';
import { PathMapComponent } from './components/path-map.component';
import { StepPanelComponent } from './components/step-panel.component';
import { findNextStep } from './path-map';
import { MAX_STARS_PER_STEP, SOURCE_LABELS } from './paths.constants';

@Component({
  selector: 'app-path-page',
  imports: [
    RouterLink,
    AudienceLabelPipe,
    LanguageLabelPipe,
    EmptyStateComponent,
    ModalComponent,
    PixelIconComponent,
    ProgressBarComponent,
    SpinnerComponent,
    PathMapComponent,
    StepPanelComponent,
  ],
  templateUrl: './path-page.component.html',
  styleUrl: './path-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathPageComponent {
  readonly pathId = input.required<string>();

  private readonly store = inject(Store);
  private readonly readAloud = inject(ReadAloudService);

  private readonly detail = this.store.selectSignal(pathsFeature.selectDetail);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly loading = this.store.selectSignal(pathsFeature.selectLoading);
  protected readonly error = this.store.selectSignal(pathsFeature.selectError);
  protected readonly startingQuiz = this.store.selectSignal(matchFeature.selectBusy);
  protected readonly speaking = this.readAloud.speaking;
  protected readonly canReadAloud = this.readAloud.isSupported;

  // The store may still hold the path opened before this one.
  protected readonly path = computed(() => {
    const detail = this.detail();
    return detail?.id === this.pathId() ? detail : null;
  });
  protected readonly steps = computed(() => this.path()?.steps ?? []);
  protected readonly heroKey = computed(() => this.user()?.avatarKey ?? null);

  protected readonly totalStars = computed(() =>
    this.steps().reduce((sum, step) => sum + step.stars, 0),
  );
  protected readonly maxStars = computed(() => this.steps().length * MAX_STARS_PER_STEP);
  protected readonly stepsCleared = computed(
    () => this.steps().filter((step) => step.cleared).length,
  );
  protected readonly clearedFraction = computed(() =>
    this.steps().length > 0 ? this.stepsCleared() / this.steps().length : 0,
  );
  protected readonly complete = computed(
    () => this.steps().length > 0 && this.stepsCleared() === this.steps().length,
  );

  protected readonly sourceLabels = SOURCE_LABELS;

  protected readonly selectedStepId = signal<string | null>(null);
  // Until a stop is picked, the panel shows the next step (or the castle once all are cleared).
  protected readonly selectedStep = computed<StepView | null>(() => {
    const steps = this.steps();
    const picked = steps.find((step) => step.id === this.selectedStepId());
    return picked ?? findNextStep(steps) ?? steps.at(-1) ?? null;
  });
  protected readonly dialogOpen = signal(false);
  protected readonly confirmingDelete = signal(false);

  // The step panel sits next to the map on wide screens; smaller ones open it as a dialog.
  protected readonly isWide = screenMatches(DESKTOP_UP);

  constructor() {
    effect(() => {
      const pathId = this.pathId();
      untracked(() => this.openPath(pathId));
    });
    inject(DestroyRef).onDestroy(() => this.readAloud.stop());
  }

  protected reload(): void {
    this.store.dispatch(PathsActions.loadDetail({ pathId: this.pathId() }));
  }

  protected selectStep(step: StepView): void {
    this.readAloud.stop();
    this.selectedStepId.set(step.id);
    this.dialogOpen.set(!this.isWide());
  }

  protected closeDialog(): void {
    this.readAloud.stop();
    this.dialogOpen.set(false);
  }

  protected toggleReadAloud(step: StepView): void {
    const path = this.path();
    if (this.speaking() || !path) {
      this.readAloud.stop();
      return;
    }
    this.readAloud.speak([step.title, ...step.keyPoints].join('. '), path.language);
  }

  protected takeQuiz(step: StepView): void {
    this.readAloud.stop();
    this.store.dispatch(MatchActions.create({ request: { quizId: step.quizId, mode: 'SOLO' } }));
  }

  protected deletePath(): void {
    this.confirmingDelete.set(false);
    this.store.dispatch(PathsActions.delete({ pathId: this.pathId() }));
  }

  private openPath(pathId: string): void {
    this.selectedStepId.set(null);
    this.dialogOpen.set(false);
    this.store.dispatch(PathsActions.loadDetail({ pathId }));
  }
}
