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
} from '../../store/auth/auth.selectors';
import { FriendsSidebarComponent } from './friends-sidebar/friends-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';
import { CreateQuizComponent } from './create-quiz/create-quiz.component';
import { MyQuizzesComponent } from './my-quizzes/my-quizzes.component';
import { JoinGameComponent } from '../game/join-game/join-game.component';
import { ShopComponent } from '../shop/shop.component';
import { RankedListComponent } from '../ranked/ranked-list.component';
import { AvatarDisplayComponent } from '../../shared/components/avatar-display/avatar-display.component';
import { AvatarPickerComponent } from '../../shared/components/avatar-picker/avatar-picker.component';
import { AvatarChangerComponent } from '../../shared/components/avatar-changer/avatar-changer.component';
import { BoostsOverviewComponent } from '../../shared/components/boosts-overview/boosts-overview.component';
import { FormatCoinsPipe } from '../../shared/pipes/format-coins.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FriendsSidebarComponent, ProfileComponent, CreateQuizComponent, MyQuizzesComponent, JoinGameComponent, ShopComponent, RankedListComponent, AvatarDisplayComponent, AvatarPickerComponent, AvatarChangerComponent, BoostsOverviewComponent, FormatCoinsPipe],
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

  activeTab = 'home';
  showAvatarChanger = false;

  constructor() {
    this.user$ = this.store.select(selectUser);
    this.displayName$ = this.store.select(selectUserDisplayName);
    this.avatarUrl$ = this.store.select(selectUserAvatarUrl);
    this.level$ = this.store.select(selectUserLevel);
    this.xp$ = this.store.select(selectUserXP);
    this.coins$ = this.store.select(selectUserCoins);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
