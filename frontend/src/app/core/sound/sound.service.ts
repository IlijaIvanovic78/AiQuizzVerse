import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import {
  CHEST_NOTES,
  COIN_NOTES,
  CORRECT_NOTES,
  LEVEL_UP_NOTES,
  MUTED_STORAGE_KEY,
  NOTE_GAP_SECONDS,
  SILENT_VOLUME,
  TICK_FREQUENCY,
  TICK_SECONDS,
  TONE_SECONDS,
  TONE_VOLUME,
  WRONG_NOTES,
} from './sound.constants';

@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly muted = signal(localStorage.getItem(MUTED_STORAGE_KEY) === 'true');
  private audioContext: AudioContext | null = null;

  constructor() {
    // Browsers keep audio suspended until the player interacts with the page.
    inject(DOCUMENT).addEventListener('click', () => void this.context().resume(), {
      once: true,
    });
  }

  toggleMuted(): void {
    const muted = !this.muted();
    this.muted.set(muted);
    localStorage.setItem(MUTED_STORAGE_KEY, String(muted));
  }

  playCorrect(): void {
    this.playNotes(CORRECT_NOTES, 'square');
  }

  playWrong(): void {
    this.playNotes(WRONG_NOTES, 'sawtooth');
  }

  playCoin(): void {
    this.playNotes(COIN_NOTES, 'square');
  }

  playTick(): void {
    this.playTone(TICK_FREQUENCY, 0, 'square', TICK_SECONDS);
  }

  playLevelUp(): void {
    this.playNotes(LEVEL_UP_NOTES, 'triangle');
  }

  playChestOpen(): void {
    this.playNotes(CHEST_NOTES, 'square');
  }

  private playNotes(notes: number[], wave: OscillatorType): void {
    notes.forEach((frequency, i) =>
      this.playTone(frequency, i * NOTE_GAP_SECONDS, wave, TONE_SECONDS),
    );
  }

  private playTone(
    frequency: number,
    delaySeconds: number,
    wave: OscillatorType,
    durationSeconds: number,
  ): void {
    if (this.muted()) {
      return;
    }
    const context = this.context();
    const startAt = context.currentTime + delaySeconds;
    const oscillator = context.createOscillator();
    const volume = context.createGain();

    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(TONE_VOLUME, startAt);
    volume.gain.exponentialRampToValueAtTime(SILENT_VOLUME, startAt + durationSeconds);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + durationSeconds);
  }

  private context(): AudioContext {
    this.audioContext ??= new AudioContext();
    return this.audioContext;
  }
}
