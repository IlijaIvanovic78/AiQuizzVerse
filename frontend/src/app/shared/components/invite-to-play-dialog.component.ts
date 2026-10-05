import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreateMatchRequest, MatchMode } from '../../core/models/match.model';
import { QuizSummary } from '../../core/models/quiz.model';
import { PublicUser } from '../../core/models/user.model';
import { notInLibrary } from '../featured-quizzes';
import { MODE_CHOICES } from '../play-modes';
import { ModalComponent } from './modal.component';
import { PixelIconComponent } from './pixel-icon.component';
import { SpinnerComponent } from './spinner.component';
import { ThemeBadgeComponent } from './theme-badge.component';
import { UserAvatarComponent } from './user-avatar.component';

interface QuizChoice {
  quiz: QuizSummary;
  featured: boolean;
}

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
  readonly invite = output<CreateMatchRequest>();
  readonly closed = output<void>();

  protected readonly modes = MODE_CHOICES.filter((choice) => choice.mode !== 'SOLO');
  protected readonly mode = signal<MatchMode>('DUEL');
  protected readonly selectedQuizId = signal<string | null>(null);
  protected readonly title = computed(() => `Invite ${this.friend().username}`);

  protected readonly choices = computed<QuizChoice[]>(() => [
    ...this.quizzes().map((quiz) => ({ quiz, featured: false })),
    ...notInLibrary(this.featured(), this.quizzes()).map((quiz) => ({ quiz, featured: true })),
  ]);

  protected send(): void {
    const quizId = this.selectedQuizId();
    if (quizId) {
      this.invite.emit({ quizId, mode: this.mode(), inviteFriendId: this.friend().id });
    }
  }
}
