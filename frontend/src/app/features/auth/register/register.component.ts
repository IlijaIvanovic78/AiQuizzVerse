import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  of,
  startWith,
} from 'rxjs';
import { AuthService } from '../../../core/services';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectError, selectLoading } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private authService = inject(AuthService);

  registerForm!: FormGroup;

  loading$;
  error$;

  // Username availability states
  usernameAvailability: 'idle' | 'checking' | 'available' | 'taken' = 'idle';

  private destroy$ = new Subject<void>();

  constructor() {
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
  }

  ngOnInit(): void {
    this.initForm();
    this.setupUsernameAvailabilityCheck();
    this.clearErrorOnFormChange();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        username: [
          '',
          [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_-]+$/)],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private setupUsernameAvailabilityCheck(): void {
    this.username?.valueChanges
      .pipe(
        startWith(''),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((username: string) => {
          // Reset if empty or invalid
          if (!username || username.length < 3 || this.username?.errors) {
            this.usernameAvailability = 'idle';
            return of(null);
          }

          this.usernameAvailability = 'checking';

          return this.authService.checkUsernameAvailability(username).pipe(
            map((response) => {
              this.usernameAvailability = response.available ? 'available' : 'taken';
              return response.available;
            }),
            catchError(() => {
              this.usernameAvailability = 'idle';
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private clearErrorOnFormChange(): void {
    this.registerForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.store.dispatch(AuthActions.clearError());
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid || this.usernameAvailability === 'taken') {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { confirmPassword, ...credentials } = this.registerForm.value;
    this.store.dispatch(AuthActions.register({ credentials }));
  }

  // Form control getters for template
  get email() {
    return this.registerForm.get('email');
  }
  get username() {
    return this.registerForm.get('username');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get passwordMismatch() {
    return (
      this.registerForm.errors?.['passwordMismatch'] &&
      this.confirmPassword?.touched
    );
  }
}
