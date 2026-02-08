import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService } from '../../../services';
import { Toast } from '../../../models';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      @for (toast of toasts$ | async; track toast.id) {
        <div
          [@slideIn]
          [ngClass]="{
            'bg-green-50 border-green-500 text-green-800': toast.type === 'success',
            'bg-red-50 border-red-500 text-red-800': toast.type === 'error',
            'bg-blue-50 border-blue-500 text-blue-800': toast.type === 'info',
            'bg-yellow-50 border-yellow-500 text-yellow-800': toast.type === 'warning',
          }"
          class="border-l-4 p-4 rounded-lg shadow-lg flex items-start justify-between space-x-3"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            @if (toast.type === 'success') {
              <svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            } @else if (toast.type === 'info') {
              <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold">{{ toast.title }}</p>
            <p class="text-sm mt-1">{{ toast.message }}</p>

            @if (toast.action) {
              <button
                (click)="handleAction(toast)"
                class="mt-2 text-sm font-medium underline hover:no-underline"
              >
                {{ toast.action.label }}
              </button>
            }
          </div>

          <!-- Close Button -->
          <button (click)="close(toast.id)" class="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class ToastContainerComponent implements OnInit {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.getToasts();

  ngOnInit() {}

  close(id: string) {
    this.toastService.remove(id);
  }

  handleAction(toast: Toast) {
    if (toast.action) {
      toast.action.callback();
      this.close(toast.id);
    }
  }
}
