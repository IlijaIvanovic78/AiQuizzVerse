import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FriendRequest } from '../../../core/models/friend.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-friend-requests',
  imports: [RouterLink, UserAvatarComponent, RelativeTimePipe],
  templateUrl: './friend-requests.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendRequestsComponent {
  readonly incoming = input.required<FriendRequest[]>();
  readonly outgoing = input.required<FriendRequest[]>();
  readonly busy = input(false);
  readonly accept = output<string>();
  // Declining a request I got and cancelling one I sent are the same call.
  readonly remove = output<string>();
}
