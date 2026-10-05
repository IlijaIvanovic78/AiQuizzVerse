import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-join-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Join a game" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPageComponent {
  readonly code = input<string>();
}
