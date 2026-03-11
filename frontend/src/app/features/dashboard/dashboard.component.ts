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
} from '../../store/auth/auth.selectors';
import { FriendsSidebarComponent } from './friends-sidebar/friends-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';
import { CreateQuizComponent } from './create-quiz/create-quiz.component';
import { MyQuizzesComponent } from './my-quizzes/my-quizzes.component';
import { JoinGameComponent } from '../game/join-game/join-game.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FriendsSidebarComponent, ProfileComponent, CreateQuizComponent, MyQuizzesComponent, JoinGameComponent],
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

  activeTab = 'home';

  constructor() {
    this.user$ = this.store.select(selectUser);
    this.displayName$ = this.store.select(selectUserDisplayName);
    this.level$ = this.store.select(selectUserLevel);
    this.xp$ = this.store.select(selectUserXP);
    this.coins$ = this.store.select(selectUserCoins);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
