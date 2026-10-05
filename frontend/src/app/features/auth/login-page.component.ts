import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { HeroSpriteComponent } from '../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../shared/forms/form-signals';
import { AuthActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { AuthLayoutComponent } from './components/auth-layout.component';
import { TwoFactorFormComponent } from './components/two-factor-form.component';

const WELCOME_HEROES = ['mini-sword-man', 'mini-mage', 'mini-archer-man'];
const WELCOME_PET = 'pet-fox';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    HeroSpriteComponent,
    PetSpriteComponent,
    PixelIconComponent,
    TwoFactorFormComponent,
  ],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly store = inject(Store);

  protected readonly heroes = WELCOME_HEROES;
  protected readonly pet = WELCOME_PET;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly emailInvalid = touchedAndInvalid(this.form.controls.email);
  protected readonly passwordInvalid = touchedAndInvalid(this.form.controls.password);
  protected readonly showPassword = signal(false);
  protected readonly pending = this.store.selectSignal(authFeature.selectPending);
  protected readonly twoFactorToken = this.store.selectSignal(authFeature.selectTwoFactorToken);

  // The auth error is shared with the register page, so only errors from this page are shown.
  private readonly submitted = signal(false);
  private readonly authError = this.store.selectSignal(authFeature.selectError);
  protected readonly error = computed(() => (this.submitted() ? this.authError() : null));

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.set(true);
    this.store.dispatch(AuthActions.login({ credentials: this.form.getRawValue() }));
  }

  protected submitCode(code: string): void {
    this.store.dispatch(AuthActions.submitTwoFactorCode({ code }));
  }

  protected backToLogin(): void {
    this.store.dispatch(AuthActions.twoFactorCancelled());
  }

  protected togglePassword(): void {
    this.showPassword.update((shown) => !shown);
  }
}
