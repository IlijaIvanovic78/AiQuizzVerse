import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ItemImageName = 'sword' | 'axes' | 'chest' | 'shield' | 'potion' | 'treasure';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
      <img [src]="imageUrl()" alt="" class="h-20 w-auto" />
      <h2 class="text-xl">{{ title() }}</h2>
      @if (text()) {
        <p class="max-w-md text-muted">{{ text() }}</p>
      }
      <div class="mt-2 flex flex-wrap justify-center gap-3">
        <ng-content />
      </div>
    </div>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly text = input('');
  readonly image = input<ItemImageName>('treasure');

  protected readonly imageUrl = computed(() => `/assets/images/icons/${this.image()}.webp`);
}
