import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Difficulty } from '../../core/models/quiz.model';

const DIFFICULTY_BADGES: Record<Difficulty, { label: string; className: string }> = {
  EASY: { label: 'Easy', className: 'badge-jade' },
  MEDIUM: { label: 'Medium', className: 'badge-torch' },
  HARD: { label: 'Hard', className: 'badge-ruby' },
};

@Component({
  selector: 'app-difficulty-badge',
  template: `<span class="badge" [class]="badge().className">{{ badge().label }}</span>`,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultyBadgeComponent {
  readonly difficulty = input.required<Difficulty>();

  protected readonly badge = computed(() => DIFFICULTY_BADGES[this.difficulty()]);
}
