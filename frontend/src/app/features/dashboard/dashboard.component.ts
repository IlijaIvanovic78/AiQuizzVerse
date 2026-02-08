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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  constructor() {
    this.user$ = this.store.select(selectUser);
    this.displayName$ = this.store.select(selectUserDisplayName);
    this.level$ = this.store.select(selectUserLevel);
    this.xp$ = this.store.select(selectUserXP);
    this.coins$ = this.store.select(selectUserCoins);
  }
}
