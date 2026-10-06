import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopItem } from '../../../core/models/shop.model';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { REDUCED_MOTION } from '../../../shared/media-query';
import { tabIndexAfterKey } from '../../../shared/tabs';
import { WARDROBE_FRAGMENT, WARDROBE_TABS } from '../profile.constants';
import { wardrobeItems, wearingLine } from '../wardrobe.rules';

// The heroes and pets the player owns, to pick the ones they wear. Only on their own profile.
@Component({
  selector: 'app-wardrobe',
  imports: [
    RouterLink,
    HeroSpriteComponent,
    PetSpriteComponent,
    PixelIconComponent,
    SpinnerComponent,
  ],
  templateUrl: './wardrobe.component.html',
  styleUrl: './wardrobe.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WardrobeComponent {
  // All the shop items; the wardrobe picks the owned heroes and pets from them.
  readonly items = input.required<ShopItem[]>();
  readonly loaded = input.required<boolean>();
  readonly failed = input(false);
  readonly busy = input(false);
  // The shop's "Equip in your profile" link opens the profile on the wardrobe.
  readonly showOnStart = input(false);
  readonly equip = output<ShopItem>();
  readonly unequipPet = output<void>();
  readonly retry = output<void>();

  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected readonly sectionId = WARDROBE_FRAGMENT;
  protected readonly activeIndex = signal(0);
  protected readonly tabs = computed(() =>
    WARDROBE_TABS.map((tab) => ({
      ...tab,
      count: wardrobeItems(this.items(), tab.itemType).length,
    })),
  );
  protected readonly activeTab = computed(() => this.tabs()[this.activeIndex()]);
  protected readonly shelf = computed(() => wardrobeItems(this.items(), this.activeTab().itemType));
  protected readonly wearing = computed(() => wearingLine(this.items()));

  constructor() {
    afterNextRender(() => {
      if (this.showOnStart()) {
        this.show();
      }
    });
  }

  // The focus moves here too, so keyboard and screen reader users land in the wardrobe.
  show(): void {
    const section = this.section().nativeElement;
    const behavior = window.matchMedia(REDUCED_MOTION).matches ? 'auto' : 'smooth';
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior, block: 'start' });
  }

  protected selectTab(index: number): void {
    this.activeIndex.set(index);
  }

  protected moveTab(event: KeyboardEvent, index: number): void {
    const nextIndex = tabIndexAfterKey(event.key, index, WARDROBE_TABS.length);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    this.activeIndex.set(nextIndex);
    this.tabButtons()[nextIndex].nativeElement.focus();
  }
}
