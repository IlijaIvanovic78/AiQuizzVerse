import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CoinPackage } from '../../../core/models/payment.model';
import { ModalComponent } from '../../../shared/components/modal.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { createGateQuestion, isGateAnswerCorrect } from '../gate-question';

// Coins cost real money in a real shop, so a sum a young child can't solve guards the checkout.
@Component({
  selector: 'app-grown-up-gate',
  imports: [PricePipe, ReactiveFormsModule, ModalComponent, PixelIconComponent, SpinnerComponent],
  templateUrl: './grown-up-gate.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrownUpGateComponent {
  readonly pack = input.required<CoinPackage>();
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly passed = output<void>();
  readonly closed = output<void>();

  protected readonly question = signal(createGateQuestion());
  protected readonly wrongAnswer = signal(false);
  protected readonly answered = signal(false);
  protected readonly form = new FormGroup({
    answer: new FormControl('', { nonNullable: true }),
  });

  protected readonly totalCoins = computed(() => this.pack().coins + this.pack().bonusCoins);

  protected submit(): void {
    if (isGateAnswerCorrect(this.question(), this.form.controls.answer.value)) {
      this.answered.set(true);
      this.passed.emit();
      return;
    }
    // A new sum after every wrong try, so guessing the same one again doesn't help.
    this.wrongAnswer.set(true);
    this.question.set(createGateQuestion());
    this.form.reset();
  }
}
