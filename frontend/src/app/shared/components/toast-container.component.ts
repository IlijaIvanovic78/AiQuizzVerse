import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Toast, ToastTone } from '../../core/notifications/toast.service';
import { PixelIconComponent, PixelIconName } from './pixel-icon.component';

const TONE_STYLES: Record<ToastTone, { icon: PixelIconName; stripe: string }> = {
  info: { icon: 'bolt', stripe: 'border-l-mana-400' },
  success: { icon: 'check', stripe: 'border-l-jade-400' },
  error: { icon: 'cross', stripe: 'border-l-ruby-400' },
};

@Component({
  selector: 'app-toast-container',
  imports: [PixelIconComponent],
  templateUrl: './toast-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toasts = input.required<Toast[]>();
  readonly actionClicked = output<Toast>();
  readonly dismissed = output<number>();

  protected readonly items = computed(() =>
    this.toasts().map((toast) => ({ toast, ...TONE_STYLES[toast.tone] })),
  );
}
