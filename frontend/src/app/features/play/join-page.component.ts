import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { HeroSpriteComponent } from '../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { touchedAndInvalid } from '../../shared/forms/form-signals';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN } from './play.constants';

const NOT_CODE_CHARACTERS = /[^A-Z0-9]/g;

@Component({
  selector: 'app-join-page',
  imports: [
    ReactiveFormsModule,
    HeroSpriteComponent,
    PetSpriteComponent,
    PixelIconComponent,
    SpinnerComponent,
  ],
  templateUrl: './join-page.component.html',
  styleUrl: './join-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPageComponent {
  // Filled when the page is opened from a share link like /join/ABC234.
  readonly code = input<string>();

  private readonly store = inject(Store);

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly busy = this.store.selectSignal(matchFeature.selectBusy);

  protected readonly codeLength = INVITE_CODE_LENGTH;
  protected readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(INVITE_CODE_PATTERN)],
    }),
  });
  private readonly codeControl = this.form.controls.code;
  protected readonly showCodeError = touchedAndInvalid(this.codeControl);

  constructor() {
    effect(() => {
      const code = this.code();
      if (code) {
        untracked(() => this.joinWithLink(code));
      }
    });
  }

  protected normalizeCode(): void {
    const value = this.codeControl.value.toUpperCase().replace(NOT_CODE_CHARACTERS, '');
    if (value !== this.codeControl.value) {
      this.codeControl.setValue(value);
    }
  }

  protected join(): void {
    this.codeControl.markAsTouched();
    if (this.codeControl.invalid || this.busy()) {
      return;
    }
    this.store.dispatch(MatchActions.join({ inviteCode: this.codeControl.value }));
  }

  private joinWithLink(code: string): void {
    this.codeControl.setValue(code);
    this.normalizeCode();
    this.join();
  }
}
