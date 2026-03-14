import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AvatarActions, selectUserPets, selectAvatarLoading } from '../../../store/avatar';
import { selectUserPetUrl } from '../../../store/auth/auth.selectors';
import { UserItem } from '../../../models';
import { SpriteAnimatorComponent } from '../sprite-animator/sprite-animator.component';

@Component({
  selector: 'app-pet-changer',
  standalone: true,
  imports: [CommonModule, SpriteAnimatorComponent],
  template: `
    <div class="bg-dark-800/40 border border-primary-700/20 rounded-xl p-5">
      <h3 class="font-pixel text-base text-primary-400 mb-4 flex items-center gap-2">
        <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.5 2a3.5 3.5 0 00-2.48 5.978A4.002 4.002 0 006 16h8a4 4 0 001.98-7.478A3.5 3.5 0 0013.5 2a3.49 3.49 0 00-2.65 1.222A3.49 3.49 0 008.5 2.5 3.49 3.49 0 006.5 2z"/>
        </svg>
        Change Pet
      </h3>

      @if (pets$ | async; as pets) {
        @if (pets.length === 0) {
          <p class="font-retro text-dark-400 text-sm">No pets owned yet. Visit the Shop to buy some!</p>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <!-- No Pet card (always visible) -->
            <button
              (click)="removePet()"
              [disabled]="!currentPetUrl || ((loading$ | async) ?? false)"
              class="relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105"
              [class]="!currentPetUrl ? 'border-accent-500 bg-accent-500/10 shadow-[0_0_12px_rgba(250,204,21,0.3)]' : 'border-dark-600 bg-dark-700/40 hover:border-primary-500'">
              <div class="w-16 h-16 rounded-lg flex items-center justify-center">
                <svg class="w-10 h-10 text-dark-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <span class="font-retro text-[10px] text-dark-400 truncate w-full text-center">No Pet</span>
              @if (!currentPetUrl) {
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              }
            </button>
            @for (ui of pets; track ui.id) {
              <button
                (click)="selectPet(ui)"
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
export class PetChangerComponent implements OnInit {
  private readonly store = inject(Store);

  pets$ = this.store.select(selectUserPets);
  loading$ = this.store.select(selectAvatarLoading);
  currentPetUrl$ = this.store.select(selectUserPetUrl);

  currentPetUrl: string | null = null;

  ngOnInit() {
    this.store.dispatch(AvatarActions.loadPets());
    this.currentPetUrl$.subscribe(url => this.currentPetUrl = url);
  }

  isEquipped(ui: UserItem): boolean {
    return ui.item.imagePath === this.currentPetUrl;
  }

  selectPet(ui: UserItem) {
    if (this.isEquipped(ui)) return;
    this.store.dispatch(AvatarActions.selectPet({ userItemId: ui.id }));
  }

  removePet() {
    this.store.dispatch(AvatarActions.unequipPet());
  }
}
