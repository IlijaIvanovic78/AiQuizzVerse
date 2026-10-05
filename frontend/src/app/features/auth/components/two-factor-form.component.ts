import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TWO_FACTOR_CODE_PATTERN } from '../../../core/auth/auth.constants';
import { CodeFieldComponent } from '../../../shared/components/code-field.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../../shared/forms/form-signals';

@Component({
  selector: 'app-two-factor-form',
  imports: [ReactiveFormsModule, CodeFieldComponent, PixelIconComponent],
  templateUrl: './two-factor-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoFactorFormComponent {
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  readonly codeSubmitted = output<string>();
  readonly back = output<void>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.pattern(TWO_FACTOR_CODE_PATTERN)]],
  });
  protected readonly codeInvalid = touchedAndInvalid(this.form.controls.code);

  private readonly codeField = viewChild.required(CodeFieldComponent);

  constructor() {
    afterNextRender(() => this.codeField().focus());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.codeSubmitted.emit(this.form.controls.code.value);
  }
}
