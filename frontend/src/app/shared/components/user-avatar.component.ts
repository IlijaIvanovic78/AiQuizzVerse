import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HeroSpriteComponent } from './hero-sprite.component';

type AvatarSize = 'sm' | 'md';

const AVATAR_SIZES: Record<AvatarSize, { framePx: number; scale: number }> = {
  sm: { framePx: 40, scale: 2 },
  md: { framePx: 56, scale: 3 },
};

@Component({
  selector: 'app-user-avatar',
  imports: [HeroSpriteComponent],
  template: `
    <span
      class="frame"
      [style.width.px]="dimensions().framePx"
      [style.height.px]="dimensions().framePx"
    >
      <app-hero-sprite
        class="hero"
        [heroKey]="heroKey()"
        [scale]="dimensions().scale"
        [decorative]="true"
        [style.bottom.px]="-dimensions().scale"
      />
    </span>
    @if (online() !== null) {
      <span class="dot" [class.dot-online]="online()" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
    }

    .frame {
      position: relative;
      display: block;
      overflow: hidden;
      border: 3px solid var(--outline);
      border-radius: 4px;
      background-color: var(--night-700);
      box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.3);
    }

    /* The sprite frame has empty space around the hero, so only its lower middle is shown. */
    .hero {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }

    .dot {
      position: absolute;
      right: -4px;
      bottom: -4px;
      width: 14px;
      height: 14px;
      border: 3px solid var(--outline);
      background-color: var(--fog-400);
    }

    .dot-online {
      background-color: var(--jade-400);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  readonly heroKey = input.required<string | null>();
  readonly size = input<AvatarSize>('sm');
  // null hides the presence dot; true and false show it green or grey.
  readonly online = input<boolean | null>(null);

  protected readonly dimensions = computed(() => AVATAR_SIZES[this.size()]);
}
