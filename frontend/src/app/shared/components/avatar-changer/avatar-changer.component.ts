import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AvatarActions, selectAllUserItems, selectAvatarLoading } from '../../../store/avatar';
import { selectUserAvatarUrl } from '../../../store/auth/auth.selectors';
import { UserItem } from '../../../models';
import { SpriteAnimatorComponent } from '../sprite-animator/sprite-animator.component';

@Component({
  selector: 'app-avatar-changer',
  standalone: true,
  imports: [CommonModule, SpriteAnimatorComponent],
  template: `
    <div class="bg-dark-800/40 border border-primary-700/20 rounded-xl p-5">
      <h3 class="font-pixel text-base text-primary-400 mb-4 flex items-center gap-2">
        <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        </svg>
        Change Avatar
      </h3>

      @if (items$ | async; as items) {
        @if (items.length === 0) {
          <p class="font-retro text-dark-400 text-sm">No avatars owned yet. Visit the Shop to buy some!</p>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            @for (ui of items; track ui.id) {
              <button
                (click)="selectAvatar(ui)"
                [disabled]="(loading$ | async) ?? false"
                class="relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105"
                [class]="isEquipped(ui) ? 'border-accent-500 bg-accent-500/10 shadow-[0_0_12px_rgba(250,204,21,0.3)]' : 'border-dark-600 bg-dark-700/40 hover:border-primary-500'">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                  <app-sprite-animator [characterId]="ui.item.imagePath" [displaySize]="64"></app-sprite-animator>
                </div>
                <span class="font-retro text-[10px] text-dark-300 truncate w-full text-center">{{ ui.item.name }}</span>
                @if (isEquipped(ui)) {
                  <div class="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                }
              </button>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AvatarChangerComponent implements OnInit {
  private readonly store = inject(Store);

  items$ = this.store.select(selectAllUserItems);
  loading$ = this.store.select(selectAvatarLoading);
  currentAvatarUrl$ = this.store.select(selectUserAvatarUrl);

  private currentAvatarUrl: string | null = null;

  ngOnInit() {
    this.store.dispatch(AvatarActions.loadItems());
    this.currentAvatarUrl$.subscribe(url => this.currentAvatarUrl = url);
  }

  isEquipped(ui: UserItem): boolean {
    return ui.item.imagePath === this.currentAvatarUrl;
  }

  selectAvatar(ui: UserItem) {
    if (this.isEquipped(ui)) return;
    this.store.dispatch(AvatarActions.selectAvatar({ userItemId: ui.id }));
  }
}
