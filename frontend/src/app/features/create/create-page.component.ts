import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-create-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Create" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePageComponent {}
