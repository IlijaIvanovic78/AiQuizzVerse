import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

// A password box with a Show/Hide button. The page puts the label and the message under it.
@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex gap-2">
      <input
        class="input"
        [id]="inputId()"
        [type]="shown() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [formControl]="control()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="invalid()"
      />
      <button type="button" class="btn btn-secondary shrink-0" (click)="toggle()">
        {{ shown() ? 'Hide' : 'Show' }}<span class="sr-only"> password</span>
      </button>
    </div>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly autocomplete = input.required<'current-password' | 'new-password'>();
  readonly describedBy = input.required<string>();
  readonly invalid = input.required<boolean>();

  protected readonly shown = signal(false);

  protected toggle(): void {
    this.shown.update((shown) => !shown);
  }
}
