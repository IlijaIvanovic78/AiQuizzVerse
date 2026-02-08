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

  // 2FA setup data (received from enable2FA action)
  qrCodeUrl: string | null = null;
  secret: string | null = null;
  setupStep: 'initial' | 'qr-display' | 'verified' = 'initial';

  private destroy$ = new Subject<void>();

  constructor() {
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
    this.is2FAEnabled$ = this.store.select(selectUser2FAEnabled);
  }

  ngOnInit(): void {
    this.initForm();
    this.clearErrorOnFormChange();
    this.listenForSetupSuccess();
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

  private listenForSetupSuccess(): void {
    // Listen for enable2FA success to get QR code
    // Note: In real implementation, you'd use Effects to handle this
    // For now, we'll handle it through a service or state update
  }

  onEnable2FA(): void {
    this.setupStep = 'qr-display';
    this.store.dispatch(AuthActions.enable2FA());
    
    // Mock data for demonstration - in real app this comes from the effect
    // You would listen to the enable2FASuccess action in effects and store this data
    setTimeout(() => {
      // This is a placeholder - actual data comes from the API response
      this.qrCodeUrl = 'data:image/png;base64,PLACEHOLDER';
      this.secret = 'PLACEHOLDER_SECRET_KEY';
    }, 1000);
  }

  onVerify2FA(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const request = {
      code: this.verifyForm.value.code,
    };

    this.store.dispatch(AuthActions.verify2FA({ request }));
  }

  onCancel(): void {
    this.setupStep = 'initial';
    this.qrCodeUrl = null;
    this.secret = null;
    this.verifyForm.reset();
    this.store.dispatch(AuthActions.clearError());
  }

  // Form control getters for template
  get code() {
    return this.verifyForm.get('code');
  }
}
