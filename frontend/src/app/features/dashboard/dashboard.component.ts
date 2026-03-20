import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectUser,
  selectUserDisplayName,
  selectUserLevel,
  selectUserXP,
  selectUserCoins,
  selectUserAvatarUrl,
  selectUserPetUrl,
  selectUserStreak,
  selectUserLongestStreak,
  selectUserId,
} from '../../store/auth/auth.selectors';
import {
  loadGlobalLeaderboard,
  loadFriendsLeaderboard,
  selectGlobalRanking,
  selectFriendsRanking,
  selectLeaderboardLoading,
} from '../../store/leaderboard';
import { FriendsSidebarComponent } from './friends-sidebar/friends-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';
import { CreateQuizComponent } from './create-quiz/create-quiz.component';
import { MyQuizzesComponent } from './my-quizzes/my-quizzes.component';
import { ShopComponent } from '../shop/shop.component';
import { RankedDetailComponent } from '../ranked/ranked-detail.component';
import { AvatarDisplayComponent } from '../../shared/components/avatar-display/avatar-display.component';
import { AvatarPickerComponent } from '../../shared/components/avatar-picker/avatar-picker.component';
import { AvatarChangerComponent } from '../../shared/components/avatar-changer/avatar-changer.component';
import { PetChangerComponent } from '../../shared/components/pet-changer/pet-changer.component';
import { BoostsOverviewComponent } from '../../shared/components/boosts-overview/boosts-overview.component';
import { StreakDisplayComponent } from '../../shared/components/streak-display/streak-display.component';
import { LeaderboardTableComponent } from '../../shared/components/leaderboard-table/leaderboard-table.component';
import { PlayComponent } from './play/play.component';
import { MatchHistoryComponent } from '../match-history/match-history.component';
import { FormatCoinsPipe } from '../../shared/pipes/format-coins.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FriendsSidebarComponent, ProfileComponent, CreateQuizComponent, MyQuizzesComponent, ShopComponent, RankedDetailComponent, AvatarDisplayComponent, AvatarPickerComponent, AvatarChangerComponent, PetChangerComponent, BoostsOverviewComponent, StreakDisplayComponent, LeaderboardTableComponent, PlayComponent, MatchHistoryComponent, FormatCoinsPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private store = inject(Store);

  user$;
  displayName$;
  level$;
  xp$;
  coins$;
  avatarUrl$;
  petUrl$;
  streak$;
  longestStreak$;
  userId$;
  globalRanking$;
  friendsRanking$;
  leaderboardLoading$;

  activeTab = 'home';
  showAvatarChanger = false;
  selectedJourneyId: string | null = null;
  shopInitialTab: 'avatars' | 'pets' | 'boosts' = 'avatars';

  constructor() {
    this.user$ = this.store.select(selectUser);
    this.displayName$ = this.store.select(selectUserDisplayName);
    this.avatarUrl$ = this.store.select(selectUserAvatarUrl);
    this.petUrl$ = this.store.select(selectUserPetUrl);
    this.level$ = this.store.select(selectUserLevel);
    this.xp$ = this.store.select(selectUserXP);
    this.coins$ = this.store.select(selectUserCoins);
    this.streak$ = this.store.select(selectUserStreak);
    this.longestStreak$ = this.store.select(selectUserLongestStreak);
    this.userId$ = this.store.select(selectUserId);
    this.globalRanking$ = this.store.select(selectGlobalRanking);
    this.friendsRanking$ = this.store.select(selectFriendsRanking);
    this.leaderboardLoading$ = this.store.select(selectLeaderboardLoading);
  }

  ngOnInit(): void {
    this.store.dispatch(loadGlobalLeaderboard());
    this.store.dispatch(loadFriendsLeaderboard());
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.selectedJourneyId = null;
    if (tab !== 'shop') {
      this.shopInitialTab = 'avatars';
    }
    if (tab === 'home') {
      this.store.dispatch(loadGlobalLeaderboard());
      this.store.dispatch(loadFriendsLeaderboard());
    }
  }

  openJourney(id: string) {
    this.selectedJourneyId = id;
    this.activeTab = 'ranked-detail';
  }

  closeJourney() {
    this.selectedJourneyId = null;
    this.activeTab = 'play';
  }

  goToShopBoosts() {
    this.shopInitialTab = 'boosts';
    this.activeTab = 'shop';
  }
}
