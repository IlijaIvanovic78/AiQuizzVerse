import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Friend } from '../../../core/models/friend.model';
import { CreateMatchRequest, MatchMode } from '../../../core/models/match.model';
import { ChoiceCardComponent } from '../../../shared/components/choice-card.component';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { ModalComponent } from '../../../shared/components/modal.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';
import { MODE_CHOICES } from '../library.constants';

// Everything a new match needs except the quiz, which the page knows.
export type PlayChoice = Omit<CreateMatchRequest, 'quizId'>;

const MODAL_TITLES: Record<MatchMode, string> = {
  SOLO: 'Play solo',
  DUEL: 'Duel a friend',
  TEAM: 'Team up',
};

// Picks how to play a quiz. Duels and teams then pick an online friend, or get a code to share.
@Component({
  selector: 'app-play-modal',
  imports: [
    RouterLink,
    ChoiceCardComponent,
    LevelBadgeComponent,
    ModalComponent,
    SpinnerComponent,
    UserAvatarComponent,
  ],
  templateUrl: './play-modal.component.html',
  styleUrl: './play-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayModalComponent {
  readonly quizTitle = input.required<string>();
  // null starts with the choice between solo, duel and team.
  readonly startMode = input<MatchMode | null>(null);
  readonly onlineFriends = input.required<Friend[]>();
  readonly friendsLoading = input(false);
  readonly busy = input(false);
  readonly play = output<PlayChoice>();
  readonly closed = output<void>();

  protected readonly modeChoices = MODE_CHOICES;
  protected readonly chosenMode = linkedSignal(() => this.startMode());
  protected readonly title = computed(() => {
    const mode = this.chosenMode();
    return mode ? MODAL_TITLES[mode] : 'How do you want to play?';
  });

  protected chooseMode(mode: MatchMode): void {
    if (mode === 'SOLO') {
      this.play.emit({ mode });
      return;
    }
    this.chosenMode.set(mode);
  }
}
