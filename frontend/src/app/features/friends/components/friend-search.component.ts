import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { outputFromObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserSearchResult } from '../../../core/models/friend.model';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { RelationActionsComponent } from '../../../shared/components/relation-actions.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';
import { MIN_SEARCH_LENGTH } from '../../../store/friends/friends.constants';

@Component({
  selector: 'app-friend-search',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LevelBadgeComponent,
    RelationActionsComponent,
    SpinnerComponent,
    UserAvatarComponent,
  ],
  templateUrl: './friend-search.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendSearchComponent {
  protected readonly search = new FormControl('', { nonNullable: true });

  readonly results = input.required<UserSearchResult[]>();
  readonly searching = input.required<boolean>();
  readonly busy = input(false);
  readonly queryChange = outputFromObservable(this.search.valueChanges);
  readonly add = output<string>();
  readonly accept = output<string>();
  readonly cancel = output<string>();

  protected readonly minLength = MIN_SEARCH_LENGTH;
  protected readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly tooShort = computed(() => this.query().trim().length < MIN_SEARCH_LENGTH);

  // A request id is the id of the friendship it creates, so pending results carry it.
  protected acceptResult(result: UserSearchResult): void {
    if (result.friendshipId) {
      this.accept.emit(result.friendshipId);
    }
  }

  protected cancelResult(result: UserSearchResult): void {
    if (result.friendshipId) {
      this.cancel.emit(result.friendshipId);
    }
  }
}
