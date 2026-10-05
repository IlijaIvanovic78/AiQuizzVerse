import { Pipe, PipeTransform } from '@angular/core';
import { Audience } from '../../core/models/quiz.model';

const AUDIENCE_LABELS: Record<Audience, string> = {
  KIDS: 'Kids',
  TEENS: 'Teens',
  ADULTS: 'Adults',
};

@Pipe({ name: 'audienceLabel' })
export class AudienceLabelPipe implements PipeTransform {
  transform(audience: Audience): string {
    return AUDIENCE_LABELS[audience];
  }
}
