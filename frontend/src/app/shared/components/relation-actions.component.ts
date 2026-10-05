import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FriendRelation } from '../../core/models/friend.model';
import { PixelIconComponent } from './pixel-icon.component';

@Component({
  selector: 'app-relation-actions',
  imports: [PixelIconComponent],
  templateUrl: './relation-actions.component.html',
  host: { class: 'inline-flex flex-wrap items-center gap-2' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationActionsComponent {
  readonly relation = input.required<FriendRelation>();
  readonly username = input.required<string>();
  readonly busy = input(false);
  readonly add = output<void>();
  readonly accept = output<void>();
  readonly cancel = output<void>();
}
