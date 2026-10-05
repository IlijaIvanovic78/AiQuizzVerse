import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReviewCardView } from '../../../core/models/review.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { StarRatingComponent } from '../../../shared/components/star-rating.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { REVIEWS_TO_MASTER } from '../review.constants';

@Component({
  selector: 'app-review-card',
  imports: [PixelIconComponent, RelativeTimePipe, StarRatingComponent],
  templateUrl: './review-card.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCardComponent {
  readonly card = input.required<ReviewCardView>();

  protected readonly reviewsToMaster = REVIEWS_TO_MASTER;
  protected readonly due = computed(() => isDueToday(this.card().dueOn));
}

// Due dates are calendar days (UTC), so comparing the date part is enough.
function isDueToday(dueOn: string): boolean {
  return dueOn.slice(0, 10) <= new Date().toISOString().slice(0, 10);
}
