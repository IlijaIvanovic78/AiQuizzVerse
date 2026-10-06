import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { SoundService } from '../../core/sound/sound.service';
import { PixelIconComponent } from './pixel-icon.component';

type ModalSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  imports: [PixelIconComponent],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly title = input.required<string>();
  // Parchment is for reading: study cards, questions and anything with learning text.
  readonly parchment = input(false);
  readonly size = input<ModalSize>('md');
  // False while something must be seen to the end, like a chest that is still opening.
  readonly dismissible = input(true);
  readonly closed = output<void>();

  protected readonly titleId = `modal-title-${++nextModalId}`;
  protected readonly dialogClass = computed(() => {
    const surface = this.parchment() ? 'panel-parchment' : 'panel';
    return `${surface} ${SIZE_CLASSES[this.size()]}`;
  });

  private readonly document = inject(DOCUMENT);
  private readonly sound = inject(SoundService);
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly openedFrom = this.document.activeElement;
  // A press that starts inside the dialog and ends outside it (selecting text, a shaky tap)
  // still fires its click on the backdrop, so the backdrop only closes presses that began on it.
  private pressStartedOnBackdrop = false;

  // The dialog pops up when it opens and pops down when it closes.
  constructor() {
    this.sound.playModalOpen();
    afterNextRender(() => this.focusFirstElement());
    inject(DestroyRef).onDestroy(() => {
      this.restoreFocus();
      this.sound.playModalClose();
    });
  }

  protected rememberPressStart(event: PointerEvent): void {
    this.pressStartedOnBackdrop = event.target === event.currentTarget;
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    const clickedBackdrop = event.target === event.currentTarget;
    if (this.dismissible() && clickedBackdrop && this.pressStartedOnBackdrop) {
      this.closed.emit();
    }
  }

  // Escape reaches only the dialog that holds the focus, which is the one on top. It stops here,
  // so a dialog opened inside another one does not close both.
  protected closeOnEscape(event: Event): void {
    event.stopPropagation();
    if (this.dismissible()) {
      this.closed.emit();
    }
  }

  // Tab and Shift+Tab wrap around inside the dialog instead of leaving it.
  protected keepFocusInside(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = this.focusableElements(this.dialog().nativeElement);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement(): void {
    const [firstInBody] = this.focusableElements(this.body().nativeElement);
    (firstInBody ?? this.dialog().nativeElement).focus();
  }

  private restoreFocus(): void {
    if (this.openedFrom instanceof HTMLElement) {
      this.openedFrom.focus();
    }
  }

  private focusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}
