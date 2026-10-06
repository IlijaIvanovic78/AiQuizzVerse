import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { animationFrameScheduler, filter, fromEvent, map, observeOn, throttleTime } from 'rxjs';
import { TYPING_SOUND_GAP_MS } from './sound.constants';
import { SoundService } from './sound.service';
import { ClickSound, clickSound, isTextField, keySound } from './ui-sounds.rules';

// The sounds of the whole app: buttons, links, tabs and toggles click, and text fields tick while
// typing. One listener on the page hears them all, so no button needs code of its own for it.
// Started once when the app starts.
@Injectable({ providedIn: 'root' })
export class UiSoundsService {
  private readonly document = inject(DOCUMENT);
  private readonly sound = inject(SoundService);
  private readonly destroyRef = inject(DestroyRef);
  private keysTyped = 0;

  private readonly clickSounds: Record<ClickSound, () => void> = {
    select: () => this.sound.playSelect(),
    danger: () => this.sound.playDanger(),
    menu: () => this.sound.playMenu(),
    toggle: () => this.sound.playToggle(),
    blip: () => this.sound.playBlip(),
  };

  start(): void {
    this.listenToClicks();
    this.listenToTyping();
  }

  // The click waits for the next frame, when Angular has already shown what the click changed.
  // A click that opened or closed a dialog, or made a sound of its own, has been heard by then,
  // and SoundService skips the click sound.
  private listenToClicks(): void {
    fromEvent<MouseEvent>(this.document, 'click')
      .pipe(
        map((event) => clickSound(event.target)),
        filter((sound) => sound !== null),
        observeOn(animationFrameScheduler),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((sound) => this.clickSounds[sound]());
  }

  private listenToTyping(): void {
    fromEvent(this.document, 'input')
      .pipe(
        filter((event) => isTextField(event.target)),
        throttleTime(TYPING_SOUND_GAP_MS),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.playTyping(event));
  }

  private playTyping(event: Event): void {
    if (keySound(event) === 'delete') {
      this.sound.playKeyDelete();
    } else {
      this.sound.playKey(this.keysTyped);
      this.keysTyped++;
    }
  }
}
