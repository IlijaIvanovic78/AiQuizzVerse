import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Toast, ToastService } from './core/notifications/toast.service';
import { DuelInviteDialogComponent } from './layout/duel-invite-dialog.component';
import { ToastContainerComponent } from './shared/components/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, DuelInviteDialogComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly store = inject(Store);
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;

  protected runToastAction(toast: Toast): void {
    if (toast.action) {
      this.store.dispatch(toast.action);
    }
    this.toastService.dismiss(toast.id);
  }

  protected dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }
}
