import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { DEFAULT_PACK_ART, PACK_ART } from '../shop.constants';

@Component({
  selector: 'app-pack-art',
  imports: [PixelIconComponent],
  templateUrl: './pack-art.component.html',
  styleUrl: './pack-art.component.css',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackArtComponent {
  readonly packageId = input.required<string>();

  protected readonly art = computed(() => PACK_ART[this.packageId()] ?? DEFAULT_PACK_ART);
}
