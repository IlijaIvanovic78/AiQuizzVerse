import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-path-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Learning path" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathPageComponent {
  readonly pathId = input.required<string>();
}
