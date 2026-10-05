import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Friend } from '../../../core/models/friend.model';
import { PublicUser } from '../../../core/models/user.model';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';
import { SectionStatus } from '../home.types';

@Component({
  selector: 'app-online-friends',
  imports: [RouterLink, LevelBadgeComponent, SpinnerComponent, UserAvatarComponent],
  templateUrl: './online-friends.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnlineFriendsComponent {
  readonly friends = input.required<Friend[]>();
  readonly onlineCount = input.required<number>();
  readonly hasFriends = input.required<boolean>();
  readonly status = input.required<SectionStatus>();
  readonly busy = input(false);
  readonly invite = output<PublicUser>();
}
