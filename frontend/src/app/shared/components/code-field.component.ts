import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TWO_FACTOR_CODE_LENGTH } from '../../core/auth/auth.constants';
import { PixelIconComponent } from './pixel-icon.component';

// The box for the code from an authenticator app, with its label and error message.
@Component({
  selector: 'app-code-field',
  imports: [ReactiveFormsModule, PixelIconComponent],
  template: `
    <label class="field-label" [for]="inputId()">{{ label() }}</label>
    <input
      #codeInput
      class="input text-center font-display text-xl tracking-[0.4em]"
      inputmode="numeric"
      autocomplete="one-time-code"
      [id]="inputId()"
      [formControl]="control()"
      [attr.maxlength]="codeLength"
      [attr.aria-describedby]="errorId()"
      [attr.aria-invalid]="invalid()"
    />
    <div [id]="errorId()">
      @if (invalid()) {
        <p class="field-error">
          <app-pixel-icon name="cross" [scale]="1" />
          Type the {{ codeLength }} digits from your app.
        </p>
      }
    </div>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly invalid = input.required<boolean>();

  protected readonly codeLength = TWO_FACTOR_CODE_LENGTH;
  protected readonly errorId = computed(() => `${this.inputId()}-error`);

  private readonly codeInput = viewChild.required<ElementRef<HTMLInputElement>>('codeInput');

  focus(): void {
    this.codeInput().nativeElement.focus();
  }
}
