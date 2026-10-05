import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toPixels } from '../pixel-art';

// Draws a small pixel picture as one SVG square per pixel. The picture fills its host,
// so the caller decides how big it is.
@Component({
  selector: 'app-pixel-art',
  template: `
    <svg
      class="block h-full w-full"
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="none"
      shape-rendering="crispEdges"
      aria-hidden="true"
    >
      @for (pixel of pixels(); track $index) {
        <rect
          [attr.x]="pixel.x"
          [attr.y]="pixel.y"
          width="1"
          height="1"
          [attr.fill]="pixel.color"
        />
      }
    </svg>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelArtComponent {
  readonly rows = input.required<string[]>();
  readonly colors = input.required<Record<string, string>>();

  protected readonly viewBox = computed(() => `0 0 ${this.rows()[0].length} ${this.rows().length}`);
  protected readonly pixels = computed(() => toPixels(this.rows(), this.colors()));
}
