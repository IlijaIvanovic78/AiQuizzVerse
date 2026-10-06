import { ChangeDetectionStrategy, Component, Signal, computed, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatchMode, MatchResult, MatchResultPlayer } from '../../../core/models/match.model';
import { CHEST_NAMES } from '../../../shared/chests';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import {
  PODIUM_SIZE,
  PodiumComponent,
  PodiumPlace,
} from '../../../shared/components/podium.component';
import { RankBadgeComponent } from '../../../shared/components/rank-badge.component';
import { StarRatingComponent } from '../../../shared/components/star-rating.component';
import { StatTileComponent } from '../../../shared/components/stat-tile.component';
import { TreasureChestComponent } from '../../../shared/components/treasure-chest.component';
import { starsForAccuracy } from '../../../shared/stars';
import { arenaSides, baseFighter } from '../arena-fighter.rules';
import { countUp } from '../count-up';
import {
  ResultTone,
  accuracyPercent,
  chestLabelFor,
  chestSize,
  correctAnswers,
  findPlayer,
  hasTreasureChest,
  mainActionFor,
  missedQuestions,
  rankPlayers,
  resultHeadline,
} from '../match-result.rules';
import { LEVEL_UP_DELAY_MS } from '../play.constants';
import { BattleArenaComponent } from './battle-arena.component';
import { ChestsEarnedComponent } from './chests-earned.component';
import { MistakeListComponent } from './mistake-list.component';

const HEADLINE_COLORS: Record<ResultTone, string> = {
  victory: 'text-torch-300',
  almost: 'text-mana-400',
  draw: 'text-parchment-100',
};

const SCORES_TITLES: Record<MatchMode, string> = {
  SOLO: 'Score',
  TEAM: 'Team scores',
  PARTY: 'Final ranking',
};

const RIVALS_LEFT_NOTE = 'Everyone else left the party, so the win is yours.';

@Component({
  selector: 'app-match-results',
  imports: [
    RouterLink,
    BattleArenaComponent,
    ChestsEarnedComponent,
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
  // False for an old match opened from the match history: it is shown, not celebrated again.
  readonly justFinished = input(false);
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
  protected readonly perfect = computed(
    () => this.me()?.correctCount === this.result().questionCount,
  );
  protected readonly teamCorrect = computed(() => correctAnswers(this.result()));
  protected readonly showChest = computed(() => hasTreasureChest(this.result().mode));
  protected readonly chestTotal = computed(() =>
    chestSize(this.result().players.length, this.result().questionCount),
  );
  protected readonly chestLabel = computed(() => chestLabelFor(this.result().mode));
  protected readonly mainAction = computed(() => mainActionFor(this.result()));
  protected readonly stepReward = computed(() => {
    const reward = this.result().path?.reward;
    if (!reward) {
      return null;
    }
    const chest = reward.chest ? ` and a ${CHEST_NAMES[reward.chest].toLowerCase()}` : '';
    return `+${reward.coins} coins${chest}`;
  });

  protected readonly sides = computed(() => {
    const meFirst = [this.me(), ...this.others()].filter((player) => player !== null);
    const fighters = meFirst.map((player) =>
      baseFighter(
        player.user,
        player.score,
        this.meId(),
        this.celebrates(player) ? 'attack' : 'idle',
      ),
    );
    return arenaSides(this.result().mode, fighters);
  });
  protected readonly ranking = computed(() => rankPlayers(this.result().players));
  protected readonly podium = computed(() =>
    this.ranking()
      .slice(0, PODIUM_SIZE)
      .map(({ rank, player }): PodiumPlace => ({ rank, user: player.user, value: player.score })),
  );
  protected readonly scoresTitle = computed(() => SCORES_TITLES[this.result().mode]);
  // The match page only knows that the others are gone. If the player lost before they left,
  // the win is not theirs, so the note stays hidden.
  protected readonly leftNote = computed(() =>
    this.rivalLeft() && this.me()?.isWinner ? RIVALS_LEFT_NOTE : '',
  );
  // Coins fly into the chest once when the player earned some treasure.
  protected readonly coinsFlying = computed(() => this.teamCorrect() > 0);

  protected readonly shownScore = this.countTo(() => this.me()?.score ?? 0);
  protected readonly shownAccuracy = this.countTo(() => this.accuracy());
  protected readonly shownXp = this.countTo(() => this.me()?.xpEarned ?? 0);
  protected readonly shownCoins = this.countTo(() => this.me()?.coinsEarned ?? 0);
  protected readonly levelUpDelayMs = LEVEL_UP_DELAY_MS;

  protected practiceMistakes(): void {
    this.practice.emit(this.missed().map((question) => question.questionId));
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
