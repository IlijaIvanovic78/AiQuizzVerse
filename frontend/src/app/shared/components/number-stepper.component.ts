import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

// A pair of chunky - / + buttons around a number, for small ranges like questions or seconds.
@Component({
  selector: 'app-number-stepper',
  templateUrl: './number-stepper.component.html',
  styleUrl: './number-stepper.component.css',
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberStepperComponent {
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly unit = input('');
  // The id of the visible label, and a short name for the buttons ("questions", "seconds").
  readonly labelledBy = input.required<string>();
  readonly name = input.required<string>();
  readonly valueChange = output<number>();

  protected change(delta: number): void {
    const next = Math.min(this.max(), Math.max(this.min(), this.value() + delta));
    this.valueChange.emit(next);
  }
}
