import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast, ToastType } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private toastCounter = 0;

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  show(type: ToastType, title: string, message: string, duration = 5000) {
    const toast: Toast = {
      id: `toast-${++this.toastCounter}-${Date.now()}`,
      type,
      title,
      message,
      duration,
    };

    this.addToast(toast);
  }

  showWithAction(
    type: ToastType,
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    duration = 5000
  ) {
    const toast: Toast = {
      id: `toast-${++this.toastCounter}-${Date.now()}`,
      type,
      title,
      message,
      duration,
      action: {
        label: actionLabel,
        callback: actionCallback,
      },
    };

    this.addToast(toast);
  }

  success(title: string, message: string, duration?: number) {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number) {
    this.show('error', title, message, duration);
  }

  info(title: string, message: string, duration?: number) {
    this.show('info', title, message, duration);
  }

  warning(title: string, message: string, duration?: number) {
    this.show('warning', title, message, duration);
  }

  remove(id: string) {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter((toast) => toast.id !== id));
  }

  clear() {
    this.toasts$.next([]);
  }

  private addToast(toast: Toast) {
    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }
  }
}
