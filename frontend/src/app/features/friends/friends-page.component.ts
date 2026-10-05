import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-friends-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Friends" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendsPageComponent {}
