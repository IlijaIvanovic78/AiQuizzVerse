import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ProfileApiService } from '../../services';
import { UserProfile } from '../../models';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectUserAvatarUrl } from '../../store/auth/auth.selectors';
import { TwoFASetupComponent } from '../auth/two-fa-setup/two-fa-setup.component';
import { AvatarDisplayComponent } from '../../shared/components/avatar-display/avatar-display.component';
import { AvatarChangerComponent } from '../../shared/components/avatar-changer/avatar-changer.component';
import { BoostsOverviewComponent } from '../../shared/components/boosts-overview/boosts-overview.component';
import { FormatCoinsPipe } from '../../shared/pipes/format-coins.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TwoFASetupComponent, AvatarDisplayComponent, AvatarChangerComponent, BoostsOverviewComponent, FormatCoinsPipe],
  template: `
    <div class="h-full overflow-y-auto">
      <!-- Profile Banner -->
      <div class="border-b border-primary-700/30 bg-dark-800/40">
        <div class="px-8 py-6 flex items-center gap-6">
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <div class="w-24 h-24">
              <app-avatar-display [avatarUrl]="(avatarUrl$ | async) ?? profile()?.avatarUrl ?? null" [size]="96"></app-avatar-display>
            </div>
            <div class="absolute -bottom-1 -right-1 bg-dark-900 border-2 border-accent-500 rounded-full w-8 h-8 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.4)]">
              <span class="font-pixel text-[10px] text-accent-400 leading-none">{{ profile()?.level }}</span>
            </div>
          </div>
          <!-- User Info -->
          <div class="flex-1 min-w-0">
            @if (loading()) {
              <div class="h-6 w-40 bg-dark-700 rounded animate-pulse mb-2"></div>
              <div class="h-4 w-56 bg-dark-700 rounded animate-pulse"></div>
            } @else if (profile()) {
              <h1 class="font-pixel text-2xl text-primary-300 mb-1 truncate">{{ profile()!.username }}</h1>
              <p class="font-retro text-sm text-dark-400">{{ profile()!.email }}</p>
            }
          </div>
          <!-- Stats Row -->
          @if (profile() && !loading()) {
            <div class="hidden md:flex items-center gap-6">
              <div class="text-center">
                <p class="font-pixel text-xl text-accent-400 glow-yellow leading-none">{{ profile()!.level }}</p>
                <p class="font-retro text-[11px] text-dark-400 mt-1 uppercase">Level</p>
              </div>
              <div class="w-px h-8 bg-primary-700/30"></div>
              <div class="text-center">
                <p class="font-pixel text-xl text-primary-400 glow-purple leading-none">{{ profile()!.xp }}</p>
                <p class="font-retro text-[11px] text-dark-400 mt-1 uppercase">XP</p>
              </div>
              <div class="w-px h-8 bg-primary-700/30"></div>
              <div class="text-center">
                <p class="font-pixel text-xl text-accent-400 glow-yellow leading-none">{{ profile()!.coins | formatCoins }}</p>
                <p class="font-retro text-[11px] text-dark-400 mt-1 uppercase">Coins</p>
              </div>
              <div class="w-px h-8 bg-primary-700/30"></div>
              <div class="text-center">
                <p class="font-pixel text-xl text-primary-400 leading-none">{{ profile()!.friendsCount }}</p>
                <p class="font-retro text-[11px] text-dark-400 mt-1 uppercase">Friends</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400"></div>
          <p class="ml-4 font-retro text-dark-400">Loading profile...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="mx-8 mt-6 bg-red-900/20 border border-red-500/40 rounded-lg p-4">
          <p class="font-retro text-red-300 text-sm">{{ error() }}</p>
          <button (click)="loadProfile()" class="mt-2 font-retro text-red-400 hover:text-red-300 underline text-xs">Try again</button>
        </div>
      }

      <!-- Profile Content -->
      @if (profile() && !loading()) {
        <div class="px-8 py-6 space-y-6">

          <!-- Mobile Stats (visible on small screens) -->
          <div class="grid grid-cols-4 gap-3 md:hidden">
            <div class="bg-dark-800/60 border border-primary-700/20 rounded-lg p-3 text-center">
              <p class="font-pixel text-lg text-accent-400 glow-yellow">{{ profile()!.level }}</p>
              <p class="font-retro text-[10px] text-dark-400 uppercase">Level</p>
            </div>
            <div class="bg-dark-800/60 border border-primary-700/20 rounded-lg p-3 text-center">
              <p class="font-pixel text-lg text-primary-400 glow-purple">{{ profile()!.xp }}</p>
              <p class="font-retro text-[10px] text-dark-400 uppercase">XP</p>
            </div>
            <div class="bg-dark-800/60 border border-primary-700/20 rounded-lg p-3 text-center">
              <p class="font-pixel text-lg text-accent-400 glow-yellow">{{ profile()!.coins | formatCoins }}</p>
              <p class="font-retro text-[10px] text-dark-400 uppercase">Coins</p>
            </div>
            <div class="bg-dark-800/60 border border-primary-700/20 rounded-lg p-3 text-center">
              <p class="font-pixel text-lg text-primary-400">{{ profile()!.friendsCount }}</p>
              <p class="font-retro text-[10px] text-dark-400 uppercase">Friends</p>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Edit Profile -->
            <div class="bg-dark-800/40 border border-primary-700/20 rounded-xl p-6">
              <h3 class="font-pixel text-base text-primary-400 mb-5 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
                Edit Profile
              </h3>
              <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
                <div class="mb-5">
                  <label for="username" class="block font-retro text-xs text-dark-300 mb-1.5 uppercase tracking-wider">Username</label>
                  <input id="username" type="text" formControlName="username" class="input-field" placeholder="Enter username" />
                  @if (editForm.get('username')?.invalid && editForm.get('username')?.touched) {
                    <p class="mt-1 font-retro text-xs text-red-400">Username must be between 3 and 20 characters</p>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <button type="submit" [disabled]="editForm.invalid || saving()" class="btn btn-primary text-sm">
                    @if (saving()) { <span>Saving...</span> } @else { <span>SAVE CHANGES</span> }
                  </button>
                  <button type="button" (click)="resetForm()" [disabled]="saving()" class="btn btn-ghost text-sm">CANCEL</button>
                </div>
                @if (successMessage()) {
                  <div class="mt-4 p-3 bg-green-900/20 border border-green-500/40 rounded-lg">
                    <p class="font-retro text-sm text-green-400">{{ successMessage() }}</p>
                  </div>
                }
              </form>
            </div>

            <!-- 2FA Section -->
            <div>
              <app-two-fa-setup></app-two-fa-setup>
            </div>
          </div>

          <!-- Avatar & Boosts -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <app-avatar-changer></app-avatar-changer>
            <app-boosts-overview></app-boosts-overview>
          </div>

          <!-- Bottom Row: Account Info + Session -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Account Info -->
            <div class="bg-dark-800/40 border border-primary-700/20 rounded-xl p-6">
              <h3 class="font-pixel text-base text-primary-400 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                Account Information
              </h3>
              <div class="space-y-3 font-retro text-sm">
                <div class="flex justify-between items-center py-1.5 border-b border-primary-700/10">
                  <span class="text-dark-400">Member since</span>
                  <span class="text-dark-300">{{ formatDate(profile()!.createdAt) }}</span>
                </div>
                <div class="flex justify-between items-center py-1.5">
                  <span class="text-dark-400">Last updated</span>
                  <span class="text-dark-300">{{ formatDate(profile()!.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Session / Logout -->
            <div class="bg-dark-800/40 border border-red-500/15 rounded-xl p-6">
              <h3 class="font-pixel text-base text-red-400 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Session
              </h3>
              <p class="font-retro text-xs text-dark-400 mb-4">Sign out of your account on this device.</p>
              <button
                (click)="logout()"
                class="w-full px-5 py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-pixel text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/60"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                LOG OUT
              </button>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [],
})
export class ProfileComponent implements OnInit {
  private profileApi = inject(ProfileApiService);
  private fb = inject(FormBuilder);
  private store = inject(Store);

  avatarUrl$ = this.store.select(selectUserAvatarUrl);

  profile = signal<UserProfile | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  editForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
  });

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.error.set(null);

    this.profileApi.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.editForm.patchValue({
          username: profile.username,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load profile');
        this.loading.set(false);
      },
    });
  }

  onSubmit() {
    if (this.editForm.invalid) return;

    this.saving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const dto = this.editForm.value;

    this.profileApi.updateProfile(dto).subscribe({
      next: (updatedProfile) => {
        this.profile.set(updatedProfile);
        this.successMessage.set('Profile updated successfully!');
        this.saving.set(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to update profile');
        this.saving.set(false);
      },
    });
  }

  resetForm() {
    if (this.profile()) {
      this.editForm.patchValue({
        username: this.profile()!.username,
      });
    }
    this.successMessage.set(null);
    this.error.set(null);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
