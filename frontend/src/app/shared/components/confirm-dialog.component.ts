import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModalComponent } from './modal.component';

type ConfirmTone = 'primary' | 'danger';

// Asks "are you sure?" before something that can't be undone. Cancel gets the first focus.
@Component({
  selector: 'app-confirm-dialog',
  imports: [ModalComponent],
  template: `
    <app-modal size="sm" [title]="title()" (closed)="closed.emit()">
      <p class="read-text">{{ message() }}</p>
      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" class="btn btn-secondary" (click)="closed.emit()">
          {{ cancelLabel() }}
        </button>
        <button
          type="button"
          class="btn"
          [class]="tone() === 'danger' ? 'btn-danger' : 'btn-primary'"
          [disabled]="busy()"
          (click)="confirmed.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </div>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input('Keep it');
  readonly tone = input<ConfirmTone>('danger');
  readonly busy = input(false);
  readonly confirmed = output<void>();
  readonly closed = output<void>();
}
