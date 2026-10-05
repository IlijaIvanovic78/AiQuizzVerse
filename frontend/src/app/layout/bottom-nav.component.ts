import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HeroSpriteComponent } from '../shared/components/hero-sprite.component';
import { PHONE_TABS } from './layout.constants';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, HeroSpriteComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  readonly heroKey = input.required<string | null>();

  protected readonly tabs = PHONE_TABS;
}
