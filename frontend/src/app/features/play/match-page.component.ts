import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-match-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Play" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchPageComponent {
  readonly matchId = input.required<string>();
}
