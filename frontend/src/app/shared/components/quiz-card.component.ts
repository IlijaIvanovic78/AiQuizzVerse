import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizSummary, QuizTheme } from '../../core/models/quiz.model';
import { AudienceLabelPipe } from '../pipes/audience-label.pipe';
import { LanguageLabelPipe } from '../pipes/language-label.pipe';
import { DifficultyBadgeComponent } from './difficulty-badge.component';
import { PixelIconComponent } from './pixel-icon.component';
import { ThemeBadgeComponent } from './theme-badge.component';

// The colored band on top of a card, so quizzes of one theme are easy to spot.
const THEME_RIBBONS: Record<QuizTheme, string> = {
  SPACE: 'bg-mana-600',
  HISTORY: 'bg-torch-600',
  SCIENCE: 'bg-jade-600',
  NATURE: 'bg-jade-400',
  GEOGRAPHY: 'bg-mana-400',
  MATH: 'bg-torch-400',
  LANGUAGE: 'bg-ruby-600',
  ART: 'bg-ruby-400',
  MUSIC: 'bg-gold',
  SPORTS: 'bg-torch-500',
  TECHNOLOGY: 'bg-night-500',
  GENERAL: 'bg-fog-400',
};

@Component({
  selector: 'app-quiz-card',
  imports: [
    RouterLink,
    AudienceLabelPipe,
    LanguageLabelPipe,
    DifficultyBadgeComponent,
    PixelIconComponent,
    ThemeBadgeComponent,
  ],
  templateUrl: './quiz-card.component.html',
  styleUrl: './quiz-card.component.css',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizCardComponent {
  readonly quiz = input.required<QuizSummary>();
  // Featured quizzes can be played by everyone, but only their owner can open them.
  readonly link = input<string[] | null>(null);
  readonly busy = input(false);
  readonly play = output<void>();

  protected readonly ribbon = computed(() => THEME_RIBBONS[this.quiz().theme]);
}
