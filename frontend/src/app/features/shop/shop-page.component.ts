import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-shop-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Shop" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopPageComponent {}
