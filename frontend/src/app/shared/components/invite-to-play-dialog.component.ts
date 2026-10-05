import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchMode } from '../../core/models/match.model';
import { QuizSummary } from '../../core/models/quiz.model';
import { PublicUser } from '../../core/models/user.model';
import { ModalComponent } from './modal.component';
import { PixelIconComponent } from './pixel-icon.component';
import { SpinnerComponent } from './spinner.component';
import { ThemeBadgeComponent } from './theme-badge.component';
import { UserAvatarComponent } from './user-avatar.component';

type InviteMode = Exclude<MatchMode, 'SOLO'>;

export interface PlayInvite {
  quizId: string;
  mode: InviteMode;
}

interface QuizChoice {
  quiz: QuizSummary;
  featured: boolean;
}

const MODE_CHOICES: { mode: InviteMode; label: string; text: string }[] = [
  { mode: 'DUEL', label: 'Duel', text: 'Face each other. No power-ups, a fair fight.' },
  { mode: 'TEAM', label: 'Team up', text: 'Answer side by side and fill one team chest.' },
  { mode: 'PARTY', label: 'Party', text: 'Up to 4 players. The first right answer wins!' },
];

@Component({
  selector: 'app-invite-to-play-dialog',
  imports: [
    RouterLink,
    ModalComponent,
    PixelIconComponent,
    SpinnerComponent,
    ThemeBadgeComponent,
    UserAvatarComponent,
  ],
  templateUrl: './invite-to-play-dialog.component.html',
  styleUrl: './invite-to-play-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteToPlayDialogComponent {
  readonly friend = input.required<PublicUser>();
  readonly quizzes = input.required<QuizSummary[]>();
  readonly featured = input.required<QuizSummary[]>();
  readonly loading = input(false);
  readonly busy = input(false);
  readonly invite = output<PlayInvite>();
  readonly closed = output<void>();

  protected readonly modes = MODE_CHOICES;
  protected readonly mode = signal<InviteMode>('DUEL');
  protected readonly selectedQuizId = signal<string | null>(null);
  protected readonly title = computed(() => `Invite ${this.friend().username}`);

  // The seeded quizzes can be both mine and featured, so featured ones I own are listed once.
  protected readonly choices = computed<QuizChoice[]>(() => {
    const mine = this.quizzes().map((quiz) => ({ quiz, featured: false }));
    const myIds = new Set(this.quizzes().map((quiz) => quiz.id));
    const featured = this.featured()
      .filter((quiz) => !myIds.has(quiz.id))
      .map((quiz) => ({ quiz, featured: true }));
    return [...mine, ...featured];
  });

  protected send(): void {
    const quizId = this.selectedQuizId();
    if (quizId) {
      this.invite.emit({ quizId, mode: this.mode() });
    }
  }
}
