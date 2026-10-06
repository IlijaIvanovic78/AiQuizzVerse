import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { SoundService } from '../core/sound/sound.service';
import { AuthActions } from '../store/auth/auth.actions';
import { authFeature } from '../store/auth/auth.reducer';
import { chestsFeature } from '../store/chests/chests.reducer';
import { BottomNavComponent } from './bottom-nav.component';
import { TopBarComponent } from './top-bar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopBarComponent, BottomNavComponent],
  template: `
    @if (user(); as user) {
      <app-top-bar
        [user]="user"
        [chestsToOpen]="chestsToOpen()"
        [muted]="sound.muted()"
        (logout)="logout()"
        (toggleSound)="sound.toggleMuted()"
      />
    }
    <main class="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">
      <router-outlet />
    </main>
    @if (user(); as user) {
      <app-bottom-nav [heroKey]="user.avatarKey" />
    }
  `,
  host: { class: 'block min-h-dvh' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly store = inject(Store);
  protected readonly sound = inject(SoundService);

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly chestsToOpen = this.store.selectSignal(chestsFeature.selectUnopenedCount);

  protected logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
