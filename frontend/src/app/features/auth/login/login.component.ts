import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectError,
  selectIs2FARequired,
  selectLoading,
  selectPending2FAUserId,
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  loginForm!: FormGroup;
  twoFAForm!: FormGroup;

  loading$;
  error$;
  is2FARequired$;
  pending2FAUserId$;

  private destroy$ = new Subject<void>();

  constructor() {
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
    this.is2FARequired$ = this.store.select(selectIs2FARequired);
    this.pending2FAUserId$ = this.store.select(selectPending2FAUserId);
  }

  ngOnInit(): void {
    this.initForms();
    this.clearErrorOnFormChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.twoFAForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  private clearErrorOnFormChange(): void {
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.store.dispatch(AuthActions.clearError());
    });

    this.twoFAForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.store.dispatch(AuthActions.clearError());
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.value;
    this.store.dispatch(AuthActions.login({ credentials }));
  }

  onVerify2FA(): void {
    if (this.twoFAForm.invalid) {
      this.twoFAForm.markAllAsTouched();
      return;
    }

    let userId: string | null = null;
    this.pending2FAUserId$.pipe(takeUntil(this.destroy$)).subscribe((id) => (userId = id));

    if (!userId) {
      return;
    }

    const request = {
      userId,
      code: this.twoFAForm.value.code,
    };

    this.store.dispatch(AuthActions.login2FA({ request }));
  }

  onBack2FA(): void {
    this.twoFAForm.reset();
    // Reset 2FA state by clearing error (component will show login form again)
    this.store.dispatch(AuthActions.clearError());
  }

  // Form control getters for template
  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
  get code() {
    return this.twoFAForm.get('code');
  }
}
