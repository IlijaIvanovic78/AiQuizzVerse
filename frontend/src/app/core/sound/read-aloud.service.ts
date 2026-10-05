import { Injectable, signal } from '@angular/core';
import { QuizLanguage } from '../models/quiz.model';

const SPEECH_LANGUAGES: Record<QuizLanguage, string> = {
  EN: 'en-US',
  SR: 'sr-RS',
};

@Injectable({ providedIn: 'root' })
export class ReadAloudService {
  readonly isSupported = 'speechSynthesis' in window;
  readonly speaking = signal(false);
  private current: SpeechSynthesisUtterance | null = null;

  speak(text: string, language: QuizLanguage): void {
    if (!this.isSupported) {
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANGUAGES[language];
    utterance.onend = () => this.finished(utterance);
    utterance.onerror = () => this.finished(utterance);
    this.current = utterance;
    this.speaking.set(true);
    speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (this.isSupported) {
      speechSynthesis.cancel();
    }
    this.current = null;
    this.speaking.set(false);
  }

  // cancel() ends the previous text a moment later, which must not stop the new one.
  private finished(utterance: SpeechSynthesisUtterance): void {
    if (utterance === this.current) {
      this.current = null;
      this.speaking.set(false);
    }
  }
}
