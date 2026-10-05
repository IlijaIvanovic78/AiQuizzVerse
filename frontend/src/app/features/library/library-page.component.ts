import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-library-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Library" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPageComponent {}
