import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthActions } from '../../../store/auth/auth.actions';
import {
  selectError,
  selectLoading,
  selectUser2FAEnabled,
  select2FAQrCodeUrl,
  select2FASecret,
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-two-fa-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './two-fa-setup.component.html',
  styleUrl: './two-fa-setup.component.css',
})
export class TwoFASetupComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  verifyForm!: FormGroup;

  loading$;
  error$;
  is2FAEnabled$;
  qrCodeUrl$;
  secret$;

  setupStep: 'initial' | 'qr-display' | 'verified' = 'initial';

  private destroy$ = new Subject<void>();

  constructor() {
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
    this.is2FAEnabled$ = this.store.select(selectUser2FAEnabled);
    this.qrCodeUrl$ = this.store.select(select2FAQrCodeUrl);
    this.secret$ = this.store.select(select2FASecret);
  }

  ngOnInit(): void {
    this.initForm();
    this.clearErrorOnFormChange();

    // When QR code arrives from the store, show the QR display step
    this.qrCodeUrl$
      .pipe(
        takeUntil(this.destroy$),
        filter((url) => !!url),
      )
      .subscribe(() => {
        this.setupStep = 'qr-display';
      });

    // When 2FA gets enabled (verify success reloads profile), go back to initial
    this.is2FAEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled && this.setupStep === 'qr-display') {
          this.setupStep = 'initial';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  private clearErrorOnFormChange(): void {
    this.verifyForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.store.dispatch(AuthActions.clearError());
    });
  }

  onEnable2FA(): void {
    this.store.dispatch(AuthActions.enable2FA());
  }

  onVerify2FA(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const request = {
      token: this.verifyForm.value.code,
    };

    this.store.dispatch(AuthActions.verify2FA({ request }));
  }

  onDisable2FA(): void {
    this.store.dispatch(AuthActions.disable2FA());
  }

  onCancel(): void {
    this.setupStep = 'initial';
    this.verifyForm.reset();
    this.store.dispatch(AuthActions.clearError());
  }

  copySecret(secret: string): void {
    navigator.clipboard.writeText(secret);
  }

  // Form control getters for template
  get code() {
    return this.verifyForm.get('code');
  }
}
