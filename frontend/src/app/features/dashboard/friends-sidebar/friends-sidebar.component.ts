import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { FriendsActions } from '../../../store/friends';
import {
  selectAllFriends,
  selectOnlineFriends,
  selectOfflineFriends,
  selectOnlineFriendsCount,
  selectPendingRequests,
  selectPendingRequestsCount,
  selectSearchResults,
  selectFriendsLoading,
} from '../../../store/friends/friends.selectors';
import {
  selectUserDisplayName,
  selectUserLevel,
  selectUserAvatarUrl,
  selectUserPetUrl,
} from '../../../store/auth/auth.selectors';
import { Friend } from '../../../models';
import { SpriteAnimatorComponent } from '../../../shared/components/sprite-animator/sprite-animator.component';
import { AvatarDisplayComponent } from '../../../shared/components/avatar-display/avatar-display.component';

@Component({
  selector: 'app-friends-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpriteAnimatorComponent, AvatarDisplayComponent],
  template: `
    <div class="h-full flex flex-col bg-dark-800/80 backdrop-blur-sm overflow-hidden">

      <!-- User Profile Section -->
      <div class="h-[88px] px-4 flex items-center border-b-2 border-primary-700/40 flex-shrink-0">
        <div class="flex items-center gap-3">
          <!-- Avatar with level badge (clickable) -->
          <a routerLink="/profile" class="relative flex-shrink-0 group cursor-pointer" title="View Profile">
            <div class="w-12 h-12">
              <app-avatar-display [avatarUrl]="(avatarUrl$ | async) ?? null" [petUrl]="(petUrl$ | async) ?? null" [size]="48" [ring]="true"></app-avatar-display>
            </div>
            <!-- Level badge - bottom right corner -->
            <div class="absolute -bottom-1 -right-1 bg-dark-900 border-2 border-accent-500 rounded-full w-6 h-6 flex items-center justify-center shadow-[0_0_8px_rgba(250,204,21,0.4)]">
              <span class="font-pixel text-[9px] text-accent-400 leading-none">{{ level$ | async }}</span>
            </div>
          </a>
          <!-- Username + Status -->
          <div class="flex-1 min-w-0">
            <a routerLink="/profile" class="font-pixel text-sm text-primary-400 hover:text-primary-300 truncate block transition-colors">
              {{ displayName$ | async }}
            </a>
            <p class="font-retro text-xs text-green-400 flex items-center gap-1">
              <span class="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Online
            </p>
          </div>
        </div>
      </div>

      <!-- Social Header + Actions -->
      <div class="px-4 pt-3 pb-2 border-b border-primary-700/30">
        <div class="flex items-center justify-between mb-1">
          <h2 class="font-pixel text-[10px] text-dark-400 uppercase tracking-wider">Social</h2>
          <div class="flex items-center gap-2">
            <!-- Add Friend Button -->
            <button
              (click)="showAddFriendModal.set(true)"
              class="p-1.5 rounded-lg hover:bg-primary-700/30 transition-colors group"
              title="Add Friend"
            >
              <svg class="w-4 h-4 text-primary-400 group-hover:text-accent-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </button>
            <!-- Search Toggle -->
            <button
              (click)="toggleSearch()"
              class="p-1.5 rounded-lg hover:bg-primary-700/30 transition-colors group"
              title="Search"
            >
              <svg class="w-4 h-4 text-primary-400 group-hover:text-accent-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Bar (animated slide) -->
        <div
          class="overflow-hidden transition-all duration-300 ease-in-out"
          [style.max-height]="searchOpen() ? '50px' : '0px'"
          [style.opacity]="searchOpen() ? '1' : '0'"
          [style.margin-top]="searchOpen() ? '8px' : '0px'"
        >
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              [formControl]="searchControl"
              class="w-full pl-9 pr-3 py-2 bg-dark-700 border border-primary-700/30 rounded-lg text-sm text-gray-200 font-retro placeholder:text-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Search friends..."
            />
          </div>
        </div>
      </div>

      <!-- Pending Requests Badge -->
      @if ((pendingCount$ | async); as count) {
        @if (count > 0) {
          <button
            (click)="showPendingModal.set(true)"
            class="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-accent-500/10 border border-accent-500/30 rounded-lg hover:bg-accent-500/20 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
            </svg>
            <span class="font-retro text-sm text-accent-400">{{ count }} pending request{{ count > 1 ? 's' : '' }}</span>
          </button>
        }
      }

      <!-- Friends List (scrollable) -->
      <div class="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">

        <!-- Filtered results when searching -->
        @if (searchControl.value && searchControl.value.length >= 2) {
          <div class="mb-2">
            <p class="font-pixel text-[10px] text-dark-400 uppercase tracking-wider px-2 py-1">Search Results</p>
          </div>
          @for (friend of filteredFriends(); track friend.id) {
            <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-primary-700/20 transition-colors cursor-pointer group">
              <div class="relative flex-shrink-0">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                  {{ friend.username.charAt(0).toUpperCase() }}
                </div>
                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800"
                  [class.bg-green-500]="friend.status === 'online'"
                  [class.bg-gray-500]="friend.status === 'offline'">
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-retro text-sm text-gray-200 truncate">{{ friend.username }}</p>
                <p class="font-retro text-xs" [class.text-green-400]="friend.status === 'online'" [class.text-dark-400]="friend.status === 'offline'">
                  {{ friend.status === 'online' ? 'Online' : 'Offline' }}
                </p>
              </div>
            </div>
          } @empty {
            <p class="text-center text-dark-400 font-retro text-sm py-4">No matches found</p>
          }
        } @else {
          <!-- Online Section -->
          @if ((onlineFriends$ | async); as onlineFriends) {
            @if (onlineFriends.length > 0) {
              <div class="mb-2">
                <p class="font-pixel text-[10px] text-green-400 uppercase tracking-wider px-2 py-1">
                  Online — {{ onlineFriends.length }}
                </p>
              </div>
              @for (friend of onlineFriends; track friend.id) {
                <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-primary-700/20 transition-colors cursor-pointer group">
                  <div class="relative flex-shrink-0">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                      {{ friend.username.charAt(0).toUpperCase() }}
                    </div>
                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-800"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-retro text-sm text-gray-200 truncate">{{ friend.username }}</p>
                    <p class="font-retro text-xs text-green-400">Online</p>
                  </div>
                  <!-- Unfriend on hover -->
                  <button
                    (click)="removeFriend(friend.id, $event)"
                    class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                    title="Unfriend"
                  >
                    <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12zM13 8a1 1 0 100 2h4a1 1 0 100-2h-4z"/>
                    </svg>
                  </button>
                </div>
              }
            }
          }

          <!-- Offline Section -->
          @if ((offlineFriends$ | async); as offlineFriends) {
            @if (offlineFriends.length > 0) {
              <div class="mb-2" [class.mt-3]="(onlineFriendsCount$ | async)! > 0">
                <p class="font-pixel text-[10px] text-dark-400 uppercase tracking-wider px-2 py-1">
                  Offline — {{ offlineFriends.length }}
                </p>
              </div>
              @for (friend of offlineFriends; track friend.id) {
                <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-primary-700/20 transition-colors cursor-pointer group opacity-60 hover:opacity-100">
                  <div class="relative flex-shrink-0">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-sm font-bold">
                      {{ friend.username.charAt(0).toUpperCase() }}
                    </div>
                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-500 rounded-full border-2 border-dark-800"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-retro text-sm text-gray-400 truncate">{{ friend.username }}</p>
                    <p class="font-retro text-xs text-dark-400">Offline</p>
                  </div>
                  <!-- Unfriend on hover -->
                  <button
                    (click)="removeFriend(friend.id, $event)"
                    class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                    title="Unfriend"
                  >
                    <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12zM13 8a1 1 0 100 2h4a1 1 0 100-2h-4z"/>
                    </svg>
                  </button>
                </div>
              }
            }
          }

          <!-- Empty State -->
          @if ((allFriends$ | async)?.length === 0 && !(loading$ | async)) {
            <div class="flex flex-col items-center justify-center py-8 px-4 text-center">
              <svg class="w-12 h-12 text-dark-400 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p class="font-retro text-sm text-dark-400 mb-3">No friends yet</p>
              <button
                (click)="showAddFriendModal.set(true)"
                class="font-pixel text-[10px] text-accent-400 uppercase hover:text-accent-300 transition-colors"
              >
                + Add Friends
              </button>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-primary-700/30">
        <div class="flex items-center justify-between">
          <span class="font-retro text-xs text-dark-400">
            {{ (onlineFriendsCount$ | async) || 0 }}/{{ (allFriends$ | async)?.length || 0 }} Online
          </span>
          <button
            (click)="showAddFriendModal.set(true)"
            class="font-pixel text-[10px] text-accent-400 uppercase hover:text-accent-300 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== ADD FRIEND MODAL ==================== -->
    @if (showAddFriendModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeAddModal($event)">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-dark-800 border-2 border-primary-700/50 rounded-xl shadow-glow-purple-sm overflow-hidden z-10">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-4 border-b border-primary-700/30">
            <h3 class="font-pixel text-sm text-primary-400 uppercase">Add Friend</h3>
            <button
              (click)="showAddFriendModal.set(false); clearModalSearch()"
              class="p-1 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <svg class="w-5 h-5 text-dark-400 hover:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <!-- Search Input -->
          <div class="p-4">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                [formControl]="modalSearchControl"
                class="w-full pl-10 pr-4 py-3 bg-dark-700 border-2 border-primary-700/30 rounded-lg text-gray-200 font-retro placeholder:text-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Search by username..."
                autofocus
              />
            </div>
            <p class="font-retro text-xs text-dark-400 mt-2">Type at least 2 characters to search</p>
          </div>

          <!-- Results -->
          <div class="max-h-64 overflow-y-auto px-4 pb-4">
            @if (modalLoading()) {
              <div class="flex justify-center py-6">
                <div class="spinner w-8 h-8"></div>
              </div>
            } @else if ((searchResults$ | async); as results) {
              @if (results.length > 0) {
                <div class="space-y-2">
                  @for (user of results; track user.id) {
                    <div class="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-primary-700/20">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                          {{ user.username.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="font-retro text-sm text-gray-200">{{ user.username }}</p>
                          <p class="font-retro text-xs text-dark-400">{{ user.email }}</p>
                        </div>
                      </div>
                      <div>
                        @if (user.friendshipStatus === 'accepted') {
                          <span class="badge badge-success text-[10px]">Friends</span>
                        } @else if (user.friendshipStatus === 'pending') {
                          <span class="badge badge-primary text-[10px]">Pending</span>
                        } @else {
                          <button
                            (click)="sendRequest(user.id)"
                            class="btn-primary btn-sm text-[10px] py-1 px-3"
                          >
                            Add
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else if (modalSearchControl.value && modalSearchControl.value.length >= 2 && !modalLoading()) {
                <div class="text-center py-6">
                  <p class="font-retro text-sm text-dark-400">No users found</p>
                </div>
              }
            }

            @if (!modalSearchControl.value || modalSearchControl.value.length < 2) {
              <div class="text-center py-6">
                <svg class="w-10 h-10 mx-auto text-dark-400 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p class="font-retro text-sm text-dark-400">Enter a username to find friends</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- ==================== PENDING REQUESTS MODAL ==================== -->
    @if (showPendingModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closePendingModal($event)">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <div class="relative w-full max-w-md bg-dark-800 border-2 border-primary-700/50 rounded-xl shadow-glow-purple-sm overflow-hidden z-10">
          <div class="flex items-center justify-between p-4 border-b border-primary-700/30">
            <h3 class="font-pixel text-sm text-primary-400 uppercase">Friend Requests</h3>
            <button
              (click)="showPendingModal.set(false)"
              class="p-1 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <svg class="w-5 h-5 text-dark-400 hover:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <div class="max-h-80 overflow-y-auto p-4">
            @if ((pendingRequests$ | async); as requests) {
              @if (requests.length === 0) {
                <div class="text-center py-6">
                  <svg class="w-10 h-10 mx-auto text-dark-400 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="font-retro text-sm text-dark-400">No pending requests</p>
                </div>
              } @else {
                <div class="space-y-3">
                  @for (req of requests; track req.id) {
                    <div class="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-primary-700/20">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {{ req.from.username.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="font-retro text-sm text-gray-200">{{ req.from.username }}</p>
                          <p class="font-retro text-xs text-dark-400">wants to be your friend</p>
                        </div>
                      </div>
                      <div class="flex gap-1">
                        <button
                          (click)="acceptRequest(req.id)"
                          class="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/40 transition-colors"
                          title="Accept"
                        >
                          <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                        <button
                          (click)="rejectRequest(req.id)"
                          class="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 transition-colors"
                          title="Reject"
                        >
                          <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.3); border-radius: 4px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(124, 58, 237, 0.6); }
  `],
})
export class FriendsSidebarComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private destroy$ = new Subject<void>();

  // UI state
  searchOpen = signal(false);
  showAddFriendModal = signal(false);
  showPendingModal = signal(false);
  modalLoading = signal(false);

  // Form controls
  searchControl = new FormControl('');
  modalSearchControl = new FormControl('');

  // Auth selectors (user profile)
  displayName$ = this.store.select(selectUserDisplayName);
  level$ = this.store.select(selectUserLevel);
  avatarUrl$ = this.store.select(selectUserAvatarUrl);
  petUrl$ = this.store.select(selectUserPetUrl);

  // Store selectors
  allFriends$ = this.store.select(selectAllFriends);
  onlineFriends$ = this.store.select(selectOnlineFriends);
  offlineFriends$ = this.store.select(selectOfflineFriends);
  onlineFriendsCount$ = this.store.select(selectOnlineFriendsCount);
  pendingRequests$ = this.store.select(selectPendingRequests);
  pendingCount$ = this.store.select(selectPendingRequestsCount);
  searchResults$ = this.store.select(selectSearchResults);
  loading$ = this.store.select(selectFriendsLoading);

  // Computed: filter friends by sidebar search input
  private allFriendsCache: Friend[] = [];
  filteredFriends = signal<Friend[]>([]);

  ngOnInit() {
    // Load friends and pending requests
    this.store.dispatch(FriendsActions.loadFriends());
    this.store.dispatch(FriendsActions.loadPendingRequests());

    // Cache all friends for filtering
    this.allFriends$
      .pipe(takeUntil(this.destroy$))
      .subscribe((friends) => {
        this.allFriendsCache = friends;
        this.filterFriends(this.searchControl.value || '');
      });

    // Sidebar search — local filter only
    this.searchControl.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(150))
      .subscribe((value) => this.filterFriends(value || ''));

    // Modal search — dispatches to API
    this.modalSearchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe((value) => {
        if (value && value.length >= 2) {
          this.modalLoading.set(true);
          this.store.dispatch(FriendsActions.searchUsers({ query: value }));
          // Loading will be cleared when results come back
          setTimeout(() => this.modalLoading.set(false), 1500);
        } else {
          this.store.dispatch(FriendsActions.clearSearchResults());
          this.modalLoading.set(false);
        }
      });

    // Clear modal loading when results arrive
    this.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.modalLoading.set(false));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSearch() {
    this.searchOpen.update((v) => !v);
    if (!this.searchOpen()) {
      this.searchControl.setValue('');
    }
  }

  private filterFriends(query: string) {
    if (!query || query.length < 2) {
      this.filteredFriends.set([]);
      return;
    }
    const lower = query.toLowerCase();
    this.filteredFriends.set(
      this.allFriendsCache.filter((f) =>
        f.username.toLowerCase().includes(lower)
      )
    );
  }

  sendRequest(userId: string) {
    this.store.dispatch(FriendsActions.sendFriendRequest({ userId }));
  }

  acceptRequest(friendshipId: string) {
    this.store.dispatch(FriendsActions.acceptFriendRequest({ friendshipId }));
  }

  rejectRequest(friendshipId: string) {
    this.store.dispatch(FriendsActions.rejectFriendRequest({ friendshipId }));
  }

  removeFriend(friendshipId: string, event: MouseEvent) {
    event.stopPropagation();
    this.store.dispatch(FriendsActions.removeFriend({ friendshipId }));
  }

  closeAddModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.showAddFriendModal.set(false);
      this.clearModalSearch();
    }
  }

  closePendingModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.showPendingModal.set(false);
    }
  }

  clearModalSearch() {
    this.modalSearchControl.setValue('');
    this.store.dispatch(FriendsActions.clearSearchResults());
  }
}
