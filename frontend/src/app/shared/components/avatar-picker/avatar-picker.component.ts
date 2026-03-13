import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AvatarActions, selectAvatarStarters, selectAvatarLoading } from '../../../store/avatar';
import { ShopItem } from '../../../models';
import { SpriteAnimatorComponent } from '../sprite-animator/sprite-animator.component';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [CommonModule, SpriteAnimatorComponent],
  template: `
    <!-- Full-screen modal overlay -->
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-dark-900/95 backdrop-blur-md">
      <div class="w-full max-w-2xl mx-4 bg-dark-800 border-2 border-primary-700/50 rounded-2xl shadow-glow-purple-sm overflow-hidden">

        <!-- Header -->
        <div class="text-center p-6 pb-2">
          <h2 class="font-pixel text-2xl text-primary-400 mb-2">Choose Your Avatar</h2>
          <p class="font-retro text-sm text-dark-400">Pick your starter avatar — you can unlock more in the Shop later!</p>
        </div>

        <!-- Avatar Grid -->
        <div class="flex justify-center gap-6 p-6">
          @for (avatar of starters$ | async; track avatar.id) {
            <button
              (click)="selected.set(avatar)"
              class="flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-105"
              [class]="selected()?.id === avatar.id
                ? 'border-accent-500 bg-accent-500/10 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                : 'border-dark-600 bg-dark-700/50 hover:border-primary-500'"
            >
              <div class="w-32 h-32 rounded-lg overflow-hidden bg-dark-600/50 flex items-center justify-center">
                <app-sprite-animator [characterId]="avatar.imagePath" [displaySize]="128"></app-sprite-animator>
              </div>
              <span class="font-retro text-sm text-white">{{ avatar.name }}</span>
            </button>
          }
        </div>

        <!-- Confirm Button -->
        <div class="p-6 pt-2 text-center">
          <button
            (click)="confirm()"
            [disabled]="!selected() || (loading$ | async)"
            class="px-8 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-dark-700 disabled:text-dark-500 text-white font-pixel text-sm rounded-xl transition-colors"
          >
            @if (loading$ | async) {
              Selecting...
            } @else {
              SELECT AVATAR
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AvatarPickerComponent implements OnInit {
  private readonly store = inject(Store);

  starters$ = this.store.select(selectAvatarStarters);
  loading$ = this.store.select(selectAvatarLoading);
  selected = signal<ShopItem | null>(null);

  ngOnInit() {
    this.store.dispatch(AvatarActions.loadStarters());
  }

  confirm() {
    const avatar = this.selected();
    if (avatar) {
      this.store.dispatch(AvatarActions.selectStarter({ itemId: avatar.id }));
    }
  }
}
