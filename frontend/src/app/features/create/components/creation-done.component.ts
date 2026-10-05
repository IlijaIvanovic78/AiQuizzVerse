import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PathDetail } from '../../../core/models/path.model';
import { QuizDetail } from '../../../core/models/quiz.model';
import { DifficultyBadgeComponent } from '../../../shared/components/difficulty-badge.component';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { ThemeBadgeComponent } from '../../../shared/components/theme-badge.component';

// Shown when the new quiz or learning path is saved. Exactly one of quiz and path is set.
@Component({
  selector: 'app-creation-done',
  imports: [RouterLink, DifficultyBadgeComponent, HeroSpriteComponent, ThemeBadgeComponent],
  templateUrl: './creation-done.component.html',
  styleUrl: './creation-done.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationDoneComponent {
  readonly quiz = input<QuizDetail | null>(null);
  readonly path = input<PathDetail | null>(null);
  readonly heroKey = input.required<string | null>();
  readonly busy = input(false);
  readonly play = output<string>();
  readonly startOver = output<void>();

  // Each coin has its own flight direction in the stylesheet (done-coin-1 to done-coin-5).
  protected readonly coins = [1, 2, 3, 4, 5];
}
