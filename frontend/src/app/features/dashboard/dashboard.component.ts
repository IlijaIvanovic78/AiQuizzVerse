import { Component, inject } from '@angular/core';
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
} from '../../store/auth/auth.selectors';
import { FriendsSidebarComponent } from './friends-sidebar/friends-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';
import { CreateQuizComponent } from './create-quiz/create-quiz.component';
import { MyQuizzesComponent } from './my-quizzes/my-quizzes.component';
import { JoinGameComponent } from '../game/join-game/join-game.component';
import { ShopComponent } from '../shop/shop.component';
import { RankedListComponent } from '../ranked/ranked-list.component';
import { RankedDetailComponent } from '../ranked/ranked-detail.component';
import { AvatarDisplayComponent } from '../../shared/components/avatar-display/avatar-display.component';
import { AvatarPickerComponent } from '../../shared/components/avatar-picker/avatar-picker.component';
import { AvatarChangerComponent } from '../../shared/components/avatar-changer/avatar-changer.component';
import { PetChangerComponent } from '../../shared/components/pet-changer/pet-changer.component';
import { BoostsOverviewComponent } from '../../shared/components/boosts-overview/boosts-overview.component';
import { FormatCoinsPipe } from '../../shared/pipes/format-coins.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FriendsSidebarComponent, ProfileComponent, CreateQuizComponent, MyQuizzesComponent, JoinGameComponent, ShopComponent, RankedListComponent, RankedDetailComponent, AvatarDisplayComponent, AvatarPickerComponent, AvatarChangerComponent, PetChangerComponent, BoostsOverviewComponent, FormatCoinsPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private store = inject(Store);

  user$;
  displayName$;
  level$;
  xp$;
  coins$;
  avatarUrl$;
  petUrl$;

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
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.selectedJourneyId = null;
    if (tab !== 'shop') {
      this.shopInitialTab = 'avatars';
    }
  }

  openJourney(id: string) {
    this.selectedJourneyId = id;
  }

  closeJourney() {
    this.selectedJourneyId = null;
  }

  goToShopBoosts() {
    this.shopInitialTab = 'boosts';
    this.activeTab = 'shop';
  }
}
