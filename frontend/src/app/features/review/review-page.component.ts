import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-review-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Mistakes notebook" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPageComponent {}
