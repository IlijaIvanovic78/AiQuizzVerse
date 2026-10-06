import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { concat, map, of, switchMap, timer } from 'rxjs';
import { ChestReward, ChestView } from '../../../core/models/chest.model';
import { ShopItem } from '../../../core/models/shop.model';
import { SoundService } from '../../../core/sound/sound.service';
import { CHEST_NAMES } from '../../../shared/chests';
import { ModalComponent } from '../../../shared/components/modal.component';
import { rewardSummary } from '../chest-reward';
import { CHEST_SHAKE_MS, LID_OPEN_MS, REWARD_POP_MS, SPARKLES } from '../chests.constants';
import { ChestRewardComponent } from './chest-reward.component';
import { ChestSpriteComponent } from './chest-sprite.component';

// The chest shakes while the server rolls the reward, then the lid opens and the reward pops out.
@Component({
  selector: 'app-chest-opening',
  imports: [ModalComponent, ChestRewardComponent, ChestSpriteComponent],
  templateUrl: './chest-opening.component.html',
  styleUrl: './chest-opening.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestOpeningComponent {
  private readonly sound = inject(SoundService);

  readonly chest = input.required<ChestView>();
  // Null until the server has rolled what is inside.
  readonly reward = input<ChestReward | null>(null);
  // Chests still waiting after this one when the player opens them all.
  readonly nextCount = input(0);
  readonly equipped = input(false);
  readonly next = output<void>();
  readonly equip = output<ShopItem>();
  readonly closed = output<void>();

  // Every new chest shakes from the start, even when the server answers right away.
  private readonly shakeDone = toSignal(
    toObservable(this.chest).pipe(
      switchMap(() => concat(of(false), timer(CHEST_SHAKE_MS).pipe(map(() => true)))),
    ),
    { initialValue: false },
  );

  protected readonly opened = computed(() => this.shakeDone() && this.reward() !== null);
  // The dialog can only be closed once the reward has fully popped out, so nobody misses what
  // they got: not with the X, Escape or a click next to the dialog, and there is no Done yet.
  protected readonly canClose = toSignal(
    toObservable(this.opened).pipe(
      switchMap((opened) =>
        opened ? timer(LID_OPEN_MS + REWARD_POP_MS).pipe(map(() => true)) : of(false),
      ),
    ),
    { initialValue: false },
  );
  protected readonly title = computed(() => CHEST_NAMES[this.chest().type]);
  protected readonly announcement = computed(() => {
    const reward = this.reward();
    return this.opened() && reward ? `You got: ${rewardSummary(reward)}` : '';
  });
  protected readonly sparkles = SPARKLES;
  protected readonly rewardDelayMs = LID_OPEN_MS;
  protected readonly rewardPopMs = REWARD_POP_MS;

  constructor() {
    effect(() => {
      if (this.opened()) {
        untracked(() => this.sound.playChestOpen());
      }
    });
  }
}
