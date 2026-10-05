import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Friend } from '../../../core/models/friend.model';
import { PublicUser } from '../../../core/models/user.model';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';

@Component({
  selector: 'app-friend-list',
  imports: [DatePipe, RouterLink, LevelBadgeComponent, PixelIconComponent, UserAvatarComponent],
  templateUrl: './friend-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendListComponent {
  readonly friends = input.required<Friend[]>();
  readonly busy = input(false);
  readonly inviteBusy = input(false);
  readonly invite = output<PublicUser>();
  readonly remove = output<Friend>();
}
