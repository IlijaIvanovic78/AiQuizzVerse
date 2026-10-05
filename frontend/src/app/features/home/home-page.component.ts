import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-home-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Home" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {}
