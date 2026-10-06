import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import {
  ALMOST_NOTES,
  ANSWER_CLICK,
  BLIP,
  CHEST_NOTES,
  COIN_NOTES,
  CORRECT_NOTES,
  COUNTDOWN_BEEP,
  DANGER,
  EQUIP_CLINK,
  FAINT_VOLUME,
  FOG_WHOOSH,
  FREEZE_SHIMMER,
  FULL_VOLUME,
  GO,
  INK_SPLAT,
  KEY,
  KEY_DELETE,
  LEVEL_UP_NOTES,
  MENU,
  MIRROR_BOING,
  MODAL_CLOSE,
  MODAL_OPEN,
  MUTED_STORAGE_KEY,
  NOTE_GAP_SECONDS,
  OTHER_ANSWERED,
  POWER_UP_NOTES,
  QUAKE_RUMBLE,
  ROUND_LOST_NOTES,
  SCRAMBLE_BLIPS,
  SELECT,
  SHIELD_CLANG,
  SOFT_VOLUME,
  STAR,
  TICK,
  TIME_UP,
  TOAST_ERROR,
  TOAST_INFO,
  TOAST_SUCCESS,
  TOGGLE,
  TYPING_VOLUME,
  UI_SOUND_GAP_MS,
  VICTORY,
  WHISPER_VOLUME,
  WRONG_NOTES,
} from './sound.constants';
import { jingle, noise, slide, tone, tremolo } from './synth';

type Sound = (context: AudioContext, start: number) => void;

// Short, quiet 8-bit sounds, one method for each thing that can happen in the game.
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly document = inject(DOCUMENT);
  readonly muted = signal(localStorage.getItem(MUTED_STORAGE_KEY) === 'true');
  private audioContext: AudioContext | null = null;
  // performance.now() of the last sound that played.
  private lastSoundAt = 0;

  constructor() {
    // Browsers keep audio suspended until the player interacts with the page.
    this.document.addEventListener('click', () => void this.context().resume(), {
      once: true,
    });
  }

  toggleMuted(): void {
    const muted = !this.muted();
    this.muted.set(muted);
    localStorage.setItem(MUTED_STORAGE_KEY, String(muted));
  }

  playCorrect(): void {
    this.playNotes(CORRECT_NOTES, 'square', SOFT_VOLUME);
  }

  playWrong(): void {
    this.playNotes(WRONG_NOTES, 'triangle', FULL_VOLUME);
  }

  playCoin(): void {
    this.playNotes(COIN_NOTES, 'square', SOFT_VOLUME);
  }

  playLevelUp(): void {
    this.playNotes(LEVEL_UP_NOTES, 'triangle', FULL_VOLUME);
  }

  playChestOpen(): void {
    this.playNotes(CHEST_NOTES, 'square', SOFT_VOLUME);
  }

  playCountdownBeep(): void {
    const { frequency, seconds } = COUNTDOWN_BEEP;
    this.play((context, start) => tone(context, frequency, start, seconds, 'square', SOFT_VOLUME));
  }

  playGo(): void {
    this.playNotes(GO.notes, 'square', SOFT_VOLUME, GO.gapSeconds);
  }

  // Urgent ticks are higher, for the very last seconds.
  playTick(urgent: boolean): void {
    const frequency = urgent ? TICK.urgentFrequency : TICK.frequency;
    this.play((context, start) =>
      tone(context, frequency, start, TICK.seconds, 'triangle', SOFT_VOLUME),
    );
  }

  playTimeUp(): void {
    const { frequencies, seconds } = TIME_UP;
    this.play((context, start) =>
      slide(context, frequencies, start, seconds, 'square', SOFT_VOLUME),
    );
  }

  playAnswerLocked(): void {
    const { frequency, seconds } = ANSWER_CLICK;
    this.play((context, start) =>
      tone(context, frequency, start, seconds, 'triangle', SOFT_VOLUME),
    );
  }

  playOtherAnswered(): void {
    const { frequency, seconds } = OTHER_ANSWERED;
    this.play((context, start) => tone(context, frequency, start, seconds, 'sine', FAINT_VOLUME));
  }

  playPowerUp(): void {
    this.playNotes(POWER_UP_NOTES, 'sine', FULL_VOLUME);
  }

  playRoundLost(): void {
    this.playNotes(ROUND_LOST_NOTES, 'triangle', FULL_VOLUME);
  }

  playVictory(): void {
    const { notes, gapSeconds, lastNote, lastSeconds } = VICTORY;
    this.playNotes(notes, 'square', SOFT_VOLUME, gapSeconds);
    const lastNoteAt = notes.length * gapSeconds;
    this.play((context, start) =>
      tone(context, lastNote, start + lastNoteAt, lastSeconds, 'square', SOFT_VOLUME),
    );
  }

  playAlmost(): void {
    this.playNotes(ALMOST_NOTES, 'triangle', FULL_VOLUME);
  }

  // starIndex 0, 1 or 2: every next star plinks a little higher.
  playStar(starIndex: number): void {
    const frequency = STAR.notes[starIndex];
    this.play((context, start) =>
      tone(context, frequency, start, STAR.seconds, 'triangle', FULL_VOLUME),
    );
  }

  // Two square waves ring at once, so each of them stays faint.
  playShieldBlocked(): void {
    const { notes, seconds } = SHIELD_CLANG;
    this.play((context, start) =>
      notes.forEach((frequency) =>
        tone(context, frequency, start, seconds, 'square', FAINT_VOLUME),
      ),
    );
  }

  playInked(): void {
    const { frequency, seconds } = INK_SPLAT;
    this.play((context, start) =>
      noise(context, 'lowpass', frequency, start, seconds, FULL_VOLUME),
    );
  }

  playFrozen(): void {
    const { frequencies, seconds, wobbles } = FREEZE_SHIMMER;
    this.play((context, start) =>
      tremolo(context, frequencies, start, seconds, 'sine', FULL_VOLUME, wobbles),
    );
  }

  playScrambled(): void {
    this.playNotes(SCRAMBLE_BLIPS.notes, 'square', SOFT_VOLUME, SCRAMBLE_BLIPS.gapSeconds);
  }

  playFogged(): void {
    const { frequency, seconds } = FOG_WHOOSH;
    this.play((context, start) =>
      noise(context, 'bandpass', frequency, start, seconds, FULL_VOLUME),
    );
  }

  playShaken(): void {
    const { frequencies, seconds, wobbles } = QUAKE_RUMBLE;
    this.play((context, start) =>
      tremolo(context, frequencies, start, seconds, 'square', SOFT_VOLUME, wobbles),
    );
  }

  playMirrored(): void {
    const { frequencies, seconds } = MIRROR_BOING;
    this.play((context, start) =>
      slide(context, frequencies, start, seconds, 'triangle', FULL_VOLUME),
    );
  }

  // The buttons, links, tabs and toggles all over the app.
  playSelect(): void {
    const { notes, gapSeconds } = SELECT;
    this.playUi((context, start) =>
      jingle(context, notes, start, gapSeconds, 'square', WHISPER_VOLUME),
    );
  }

  playDanger(): void {
    const { frequency, seconds } = DANGER;
    this.playUi((context, start) =>
      tone(context, frequency, start, seconds, 'square', WHISPER_VOLUME),
    );
  }

  playMenu(): void {
    const { frequencies, seconds } = MENU;
    this.playUi((context, start) =>
      slide(context, frequencies, start, seconds, 'triangle', FAINT_VOLUME),
    );
  }

  playBlip(): void {
    const { frequency, seconds } = BLIP;
    this.playUi((context, start) =>
      tone(context, frequency, start, seconds, 'triangle', FAINT_VOLUME),
    );
  }

  playToggle(): void {
    const { frequency, seconds } = TOGGLE;
    this.playUi((context, start) =>
      tone(context, frequency, start, seconds, 'square', WHISPER_VOLUME),
    );
  }

  // keyIndex counts the keys typed, so the tick steps through a few close notes.
  playKey(keyIndex: number): void {
    const frequency = KEY.notes[keyIndex % KEY.notes.length];
    this.play((context, start) =>
      tone(context, frequency, start, KEY.seconds, 'square', TYPING_VOLUME),
    );
  }

  playKeyDelete(): void {
    const { frequency, seconds } = KEY_DELETE;
    this.play((context, start) =>
      tone(context, frequency, start, seconds, 'square', TYPING_VOLUME),
    );
  }

  playModalOpen(): void {
    const { frequencies, seconds } = MODAL_OPEN;
    this.playUi((context, start) =>
      slide(context, frequencies, start, seconds, 'triangle', FAINT_VOLUME),
    );
  }

  playModalClose(): void {
    const { frequencies, seconds } = MODAL_CLOSE;
    this.playUi((context, start) =>
      slide(context, frequencies, start, seconds, 'triangle', FAINT_VOLUME),
    );
  }

  playToastSuccess(): void {
    const { notes, gapSeconds } = TOAST_SUCCESS;
    this.playUi((context, start) =>
      jingle(context, notes, start, gapSeconds, 'triangle', FAINT_VOLUME),
    );
  }

  playToastError(): void {
    const { frequencies, seconds } = TOAST_ERROR;
    this.playUi((context, start) =>
      slide(context, frequencies, start, seconds, 'triangle', FAINT_VOLUME),
    );
  }

  playToastInfo(): void {
    const { frequency, seconds } = TOAST_INFO;
    this.playUi((context, start) => tone(context, frequency, start, seconds, 'sine', FAINT_VOLUME));
  }

  playEquip(): void {
    const { notes, seconds } = EQUIP_CLINK;
    this.play((context, start) =>
      notes.forEach((frequency) =>
        tone(context, frequency, start, seconds, 'square', WHISPER_VOLUME),
      ),
    );
  }

  private playNotes(
    notes: number[],
    wave: OscillatorType,
    volume: number,
    gapSeconds = NOTE_GAP_SECONDS,
  ): void {
    this.play((context, start) => jingle(context, notes, start, gapSeconds, wave, volume));
  }

  // The sounds of buttons, dialogs and toasts never start right after another sound. A click that
  // opens a dialog, or a purchase that shows a toast, is heard once: whichever sound came first.
  private playUi(sound: Sound): void {
    if (performance.now() - this.lastSoundAt < UI_SOUND_GAP_MS) {
      return;
    }
    this.play(sound);
  }

  // Every sound goes through here, so the Sound off button and a hidden tab silence them all.
  // Before the first click or key press the browser keeps audio paused, and the sounds would
  // pile up and all play at once after it, so they are skipped until then.
  private play(sound: Sound): void {
    if (this.muted() || this.document.hidden || !navigator.userActivation.hasBeenActive) {
      return;
    }
    const context = this.context();
    sound(context, context.currentTime);
    this.lastSoundAt = performance.now();
  }

  private context(): AudioContext {
    this.audioContext ??= new AudioContext();
    return this.audioContext;
  }
}
