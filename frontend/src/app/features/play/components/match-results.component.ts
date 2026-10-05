import { ChangeDetectionStrategy, Component, Signal, computed, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatchMode, MatchResult, MatchResultPlayer } from '../../../core/models/match.model';
import { BOOST_LABELS } from '../../../shared/components/boost-icon.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { PodiumComponent, PodiumPlace } from '../../../shared/components/podium.component';
import { RankBadgeComponent } from '../../../shared/components/rank-badge.component';
import { StarRatingComponent } from '../../../shared/components/star-rating.component';
import { StatTileComponent } from '../../../shared/components/stat-tile.component';
import { TreasureChestComponent } from '../../../shared/components/treasure-chest.component';
import { starsForAccuracy } from '../../../shared/stars';
import { ArenaFighter, arenaSides } from '../arena-fighter';
import { countUp } from '../count-up';
import {
  accuracyPercent,
  correctAnswers,
  findPlayer,
  missedQuestions,
  rankPlayers,
  resultHeadline,
} from '../match-result';
import { LEVEL_UP_SOUND_DELAY_MS } from '../play.constants';
import { BattleArenaComponent } from './battle-arena.component';
import { MistakeListComponent } from './mistake-list.component';

const HEADLINE_COLORS = {
  victory: 'text-torch-300',
  almost: 'text-mana-400',
  draw: 'text-parchment-100',
};

const PODIUM_SIZE = 3;

const SCORES_TITLES: Record<MatchMode, string> = {
  SOLO: 'Score',
  DUEL: 'Duel scores',
  TEAM: 'Team scores',
  PARTY: 'Final ranking',
};

const LEFT_NOTES: Record<MatchMode, string> = {
  SOLO: '',
  DUEL: 'Your rival left the match, so the win is yours.',
  TEAM: '',
  PARTY: 'Everyone else left the party, so the win is yours.',
};

@Component({
  selector: 'app-match-results',
  imports: [
    RouterLink,
    BattleArenaComponent,
    MistakeListComponent,
    PixelIconComponent,
    PodiumComponent,
    RankBadgeComponent,
    StarRatingComponent,
    StatTileComponent,
    TreasureChestComponent,
  ],
  templateUrl: './match-results.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchResultsComponent {
  readonly result = input.required<MatchResult>();
  readonly meId = input.required<string>();
  readonly level = input(1);
  readonly busy = input(false);
  readonly rivalLeft = input(false);
  readonly playAgain = output<void>();
  readonly practice = output<string[]>();
  readonly rematch = output<void>();

  protected readonly me = computed(() => findPlayer(this.result(), this.meId()));
  protected readonly others = computed(() =>
    this.result().players.filter((player) => player.user.id !== this.meId()),
  );
  protected readonly headline = computed(() => resultHeadline(this.result(), this.meId()));
  protected readonly headlineColor = computed(() => HEADLINE_COLORS[this.headline().tone]);
  protected readonly accuracy = computed(() =>
    accuracyPercent(this.me()?.correctCount ?? 0, this.result().questionCount),
  );
  protected readonly stars = computed(() => starsForAccuracy(this.accuracy()));
  protected readonly missed = computed(() => missedQuestions(this.result()));
  protected readonly teamCorrect = computed(() => correctAnswers(this.result()));
  protected readonly nextStep = computed(() => {
    const path = this.result().path;
    return path?.cleared && path.nextStepId ? path : null;
  });
  protected readonly stepReward = computed(() => {
    const reward = this.result().path?.reward;
    if (!reward) {
      return null;
    }
    const boost = reward.boost ? ` and a power-up: ${BOOST_LABELS[reward.boost]}` : '';
    return `+${reward.coins} coins${boost}`;
  });

  protected readonly sides = computed(() => {
    const meFirst = [this.me(), ...this.others()].filter((player) => player !== null);
    return arenaSides(
      this.result().mode,
      meFirst.map((player) => this.toFighter(player)),
    );
  });
  protected readonly ranking = computed(() => rankPlayers(this.result().players));
  protected readonly podium = computed(() =>
    this.ranking()
      .slice(0, PODIUM_SIZE)
      .map(({ rank, player }): PodiumPlace => ({ rank, user: player.user, value: player.score })),
  );
  protected readonly scoresTitle = computed(() => SCORES_TITLES[this.result().mode]);
  protected readonly leftNote = computed(() => LEFT_NOTES[this.result().mode]);
  // Coins fly into the chest once when the player earned some treasure.
  protected readonly coinsFlying = computed(() => this.teamCorrect() > 0);

  protected readonly shownScore = this.countTo(() => this.me()?.score ?? 0);
  protected readonly shownAccuracy = this.countTo(() => this.accuracy());
  protected readonly shownXp = this.countTo(() => this.me()?.xpEarned ?? 0);
  protected readonly shownCoins = this.countTo(() => this.me()?.coinsEarned ?? 0);
  protected readonly levelUpDelayMs = LEVEL_UP_SOUND_DELAY_MS;

  protected practiceMistakes(): void {
    this.practice.emit(this.missed().map((question) => question.questionId));
  }

  private toFighter(player: MatchResultPlayer): ArenaFighter {
    return {
      id: player.user.id,
      name: player.user.username,
      heroKey: player.user.avatarKey,
      petKey: player.user.petKey,
      isMe: player.user.id === this.meId(),
      score: player.score,
      action: this.celebrates(player) ? 'attack' : 'idle',
      points: null,
      answered: false,
      away: false,
      charges: 0,
      lockedOut: false,
      frozen: false,
      inked: false,
    };
  }

  private celebrates(player: MatchResultPlayer): boolean {
    if (this.result().mode === 'SOLO') {
      return this.headline().tone === 'victory';
    }
    return player.isWinner;
  }

  private countTo(target: () => number): Signal<number> {
    return toSignal(toObservable(computed(target)).pipe(switchMap(countUp)), {
      initialValue: 0,
    });
  }
}
