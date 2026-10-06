import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TWO_FACTOR_CODE_PATTERN,
  USERNAME_PATTERN,
  USERNAME_RULE,
} from '../../../core/auth/auth.constants';
import { TwoFactorSetup } from '../../../core/models/auth.model';
import { CurrentUser } from '../../../core/models/user.model';
import { CodeFieldComponent } from '../../../shared/components/code-field.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../../shared/forms/form-signals';

@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule, CodeFieldComponent, PixelIconComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsComponent {
  readonly user = input.required<CurrentUser>();
  readonly pending = input(false);
  readonly twoFactorSetup = input<TwoFactorSetup | null>(null);
  readonly loadingSetup = input(false);
  readonly muted = input(false);
  readonly rename = output<string>();
  readonly startTwoFactorSetup = output<void>();
  readonly cancelTwoFactorSetup = output<void>();
  readonly enableTwoFactor = output<string>();
  readonly disableTwoFactor = output<string>();
  readonly toggleSound = output<void>();
  readonly logout = output<void>();

  protected readonly nameForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(USERNAME_PATTERN)],
    }),
  });
  // One code form serves both turning 2FA on and turning it off; only one is shown at a time.
  protected readonly codeForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TWO_FACTOR_CODE_PATTERN)],
    }),
  });
  private readonly nameControl = this.nameForm.controls.username;
  protected readonly codeControl = this.codeForm.controls.code;
  protected readonly nameInvalid = touchedAndInvalid(this.nameControl);
  protected readonly codeInvalid = touchedAndInvalid(this.codeControl);
  protected readonly turningOff = signal(false);
  protected readonly usernameRule = USERNAME_RULE;

  private readonly username = computed(() => this.user().username);
  private readonly twoFactorEnabled = computed(() => this.user().twoFaEnabled);

  constructor() {
    // The forms start over whenever the saved name or the 2FA state changes on the server.
    effect(() => {
      const username = this.username();
      untracked(() => this.nameControl.reset(username));
    });
    effect(() => {
      this.twoFactorEnabled();
      untracked(() => {
        this.codeControl.reset();
        this.turningOff.set(false);
      });
    });
  }

  protected submitName(): void {
    if (this.nameControl.invalid) {
      this.nameControl.markAsTouched();
      return;
    }
    const username = this.nameControl.value.trim();
    // Nothing changed, so there is nothing to save.
    if (username === this.user().username) {
      return;
    }
    this.rename.emit(username);
  }

  protected submitCode(): void {
    if (this.codeControl.invalid) {
      this.codeControl.markAsTouched();
      return;
    }
    if (this.user().twoFaEnabled) {
      this.disableTwoFactor.emit(this.codeControl.value);
    } else {
      this.enableTwoFactor.emit(this.codeControl.value);
    }
  }

  protected startTurningOff(): void {
    this.turningOff.set(true);
  }

  protected stopTurningOff(): void {
    this.turningOff.set(false);
    this.codeControl.reset();
  }

  protected cancelSetup(): void {
    this.codeControl.reset();
    this.cancelTwoFactorSetup.emit();
  }
}
