import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { AuthApiService } from '../../core/api/auth-api.service';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_CHECK_DEBOUNCE_MS,
  USERNAME_PATTERN,
  USERNAME_RULE,
} from '../../core/auth/auth.constants';
import { PetSpriteComponent } from '../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../shared/forms/form-signals';
import { AuthActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { AuthLayoutComponent } from './components/auth-layout.component';
import { PasswordFieldComponent } from './components/password-field.component';

type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'unknown';

const WELCOME_PETS = ['pet-bunny', 'pet-fox', 'pet-bear'];

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    PasswordFieldComponent,
    PetSpriteComponent,
    PixelIconComponent,
  ],
  templateUrl: './register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);

  protected readonly pets = WELCOME_PETS;
  protected readonly passwordMin = PASSWORD_MIN_LENGTH;
  protected readonly passwordMax = PASSWORD_MAX_LENGTH;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH),
      ],
    ],
  });
  protected readonly emailInvalid = touchedAndInvalid(this.form.controls.email);
  protected readonly passwordInvalid = touchedAndInvalid(this.form.controls.password);
  private readonly usernameInvalid = touchedAndInvalid(this.form.controls.username);
  protected readonly usernameStatus = toSignal(this.watchUsername(), { initialValue: 'idle' });
  protected readonly usernameProblem = computed(() => {
    if (this.usernameStatus() === 'taken') {
      return 'Someone already has that name. Try another one.';
    }
    if (this.usernameStatus() === 'invalid' || this.usernameInvalid()) {
      return USERNAME_RULE;
    }
    return null;
  });
  protected readonly pending = this.store.selectSignal(authFeature.selectPending);

  private readonly password = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly passwordLengthOk = computed(() => {
    const length = this.password().length;
    return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH;
  });
  protected readonly passwordRuleClass = computed(() => {
    if (this.passwordInvalid()) {
      return 'field-error';
    }
    return this.passwordLengthOk() ? 'field-ok' : 'field-hint';
  });

  // The auth error is shared with the login page, so only errors from this page are shown.
  private readonly submitted = signal(false);
  private readonly authError = this.store.selectSignal(authFeature.selectError);
  protected readonly error = computed(() => (this.submitted() ? this.authError() : null));

  // The live name check can lag behind typing, so a taken name is left to the server to reject.
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.set(true);
    this.store.dispatch(AuthActions.register({ request: this.form.getRawValue() }));
  }

  // Only the newest name matters, so an older check is cancelled while the player keeps typing.
  private watchUsername(): Observable<UsernameStatus> {
    return this.form.controls.username.valueChanges.pipe(
      debounceTime(USERNAME_CHECK_DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((username) => this.checkUsername(username)),
    );
  }

  private checkUsername(username: string): Observable<UsernameStatus> {
    if (!username) {
      return of('idle');
    }
    if (!USERNAME_PATTERN.test(username)) {
      return of('invalid');
    }
    return this.authApi.isUsernameAvailable(username).pipe(
      map(({ available }): UsernameStatus => (available ? 'available' : 'taken')),
      catchError(() => of<UsernameStatus>('unknown')),
      startWith<UsernameStatus>('checking'),
    );
  }
}
