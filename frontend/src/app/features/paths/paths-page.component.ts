import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-paths-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Learning paths" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PathsPageComponent {}
