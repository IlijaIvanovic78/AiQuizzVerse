import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TWO_FACTOR_CODE_PATTERN } from '../../../core/auth/auth.constants';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../../shared/forms/form-signals';

@Component({
  selector: 'app-two-factor-form',
  imports: [ReactiveFormsModule, PixelIconComponent],
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

  private readonly codeInput = viewChild.required<ElementRef<HTMLInputElement>>('codeInput');

  constructor() {
    afterNextRender(() => this.codeInput().nativeElement.focus());
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.codeSubmitted.emit(this.form.controls.code.value);
  }
}
