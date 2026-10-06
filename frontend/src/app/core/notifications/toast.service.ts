import { Injectable, inject, signal } from '@angular/core';
import { Action } from '@ngrx/store';
import { SoundService } from '../sound/sound.service';

const TOAST_DURATION_MS = 4000;
const ERROR_TOAST_DURATION_MS = 6000;

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
  actionLabel: string | null;
  action: Action | null;
}

export interface ToastAction {
  label: string;
  action: Action;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly sound = inject(SoundService);
  private readonly toastList = signal<Toast[]>([]);
  private nextId = 1;

  private readonly toneSounds: Record<ToastTone, () => void> = {
    info: () => this.sound.playToastInfo(),
    success: () => this.sound.playToastSuccess(),
    error: () => this.sound.playToastError(),
  };

  readonly toasts = this.toastList.asReadonly();

  info(text: string, button?: ToastAction): void {
    this.show('info', text, button);
  }

  success(text: string, button?: ToastAction): void {
    this.show('success', text, button);
  }

  error(text: string): void {
    this.show('error', text);
  }

  dismiss(id: number): void {
    this.toastList.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(tone: ToastTone, text: string, button?: ToastAction): void {
    const toast: Toast = {
      id: this.nextId++,
      tone,
      text,
      actionLabel: button?.label ?? null,
      action: button?.action ?? null,
    };
    this.toastList.update((toasts) => [...toasts, toast]);
    this.toneSounds[tone]();
    const duration = tone === 'error' ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS;
    setTimeout(() => this.dismiss(toast.id), duration);
  }
}
