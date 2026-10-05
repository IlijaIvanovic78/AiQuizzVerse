import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../../shared/forms/form-signals';
import { NEW_PATH_QUERY_PARAMS } from '../../create/create.constants';
import { INVITE_CODE_LENGTH, INVITE_CODE_PATTERN } from '../../play/play.constants';

@Component({
  selector: 'app-quick-actions',
  imports: [ReactiveFormsModule, RouterLink, PixelIconComponent],
  templateUrl: './quick-actions.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickActionsComponent {
  readonly joining = input(false);
  readonly join = output<string>();

  protected readonly newPathQuery = NEW_PATH_QUERY_PARAMS;
  protected readonly codeLength = INVITE_CODE_LENGTH;
  protected readonly joinForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(INVITE_CODE_PATTERN)],
    }),
  });
  protected readonly codeInvalid = touchedAndInvalid(this.joinForm.controls.code);

  protected submitCode(): void {
    const code = this.joinForm.controls.code;
    if (code.invalid) {
      code.markAsTouched();
      return;
    }
    this.join.emit(code.value.trim().toUpperCase());
  }
}
