import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  loadHealth,
  selectApiStatus,
  selectServerTime,
  selectError,
  ApiStatus,
} from './store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly store = inject(Store);

  apiStatus$: Observable<ApiStatus> = this.store.select(selectApiStatus);
  serverTime$: Observable<string | undefined> = this.store.select(selectServerTime);
  error$: Observable<string | undefined> = this.store.select(selectError);

  ngOnInit(): void {
    this.store.dispatch(loadHealth());
  }

  onRetry(): void {
    this.store.dispatch(loadHealth());
  }
}
