import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout Component
 * Wraps all authenticated routes with common UI elements (future: navbar, sidebar, footer).
 * Currently just renders the router outlet.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-dark-900">
      <router-outlet />
    </div>
  `,
})
export class LayoutComponent {}
