import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PixelIconComponent } from './pixel-icon.component';

// A big pickable card with a picture: put the picture inside the element with `choiceArt`.
@Component({
  selector: 'app-choice-card',
  imports: [PixelIconComponent],
  templateUrl: './choice-card.component.html',
  styleUrl: './choice-card.component.css',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoiceCardComponent {
  readonly title = input.required<string>();
  readonly text = input('');
  // null makes a plain action button; true or false makes a toggle that shows "Chosen".
  readonly selected = input<boolean | null>(null);
  readonly disabled = input(false);
  readonly chosen = output<void>();
}
