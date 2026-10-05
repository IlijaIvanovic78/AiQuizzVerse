import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  template: `
    <div
      class="flex min-h-dvh flex-col items-center justify-center gap-4 bg-night-950/60 px-4 py-8"
    >
      <img
        src="/assets/images/logo.webp"
        alt="AI QuizVerse"
        width="720"
        height="211"
        class="h-auto w-full max-w-xs md:max-w-sm"
      />
      <div class="panel-parchment w-full p-5 sm:p-8" [class]="wide() ? 'max-w-4xl' : 'max-w-md'">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      background: var(--night-950) url('/assets/images/arena-small.webp') center bottom / cover;
    }

    @media (min-width: 768px) {
      :host {
        background-image: url('/assets/images/arena.webp');
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {
  readonly wide = input(false);
}
