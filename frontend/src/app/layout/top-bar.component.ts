import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CurrentUser } from '../core/models/user.model';
import { CoinAmountComponent } from '../shared/components/coin-amount.component';
import { HeroSpriteComponent } from '../shared/components/hero-sprite.component';
import { LevelBadgeComponent } from '../shared/components/level-badge.component';
import { MAIN_LINKS, PHONE_MENU_LINKS } from './layout.constants';

@Component({
  selector: 'app-top-bar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CoinAmountComponent,
    HeroSpriteComponent,
    LevelBadgeComponent,
  ],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
  host: {
    '(document:click)': 'closeMenuOnOutsideClick($event)',
    '(document:keydown.escape)': 'closeMenuWithKeyboard()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent {
  readonly user = input.required<CurrentUser>();
  readonly logout = output<void>();

  protected readonly links = MAIN_LINKS;
  protected readonly phoneLinks = PHONE_MENU_LINKS;
  protected readonly menuOpen = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected closeMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  protected closeMenuWithKeyboard(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      this.menuButton().nativeElement.focus();
    }
  }

  protected logOut(): void {
    this.closeMenu();
    this.logout.emit();
  }
}
