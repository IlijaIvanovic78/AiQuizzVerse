import { Pipe, PipeTransform } from '@angular/core';

type RelativeTimeMode = 'time' | 'day';

const SECOND_MS = 1000;
const DAY_MS = 86_400_000;

const TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: 'year', seconds: 31_536_000 },
  { unit: 'month', seconds: 2_592_000 },
  { unit: 'week', seconds: 604_800 },
  { unit: 'day', seconds: 86_400 },
  { unit: 'hour', seconds: 3_600 },
  { unit: 'minute', seconds: 60 },
];

@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  private readonly formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  // 'day' compares UTC calendar days, which suits date-only values such as review due dates.
  transform(value: string, mode: RelativeTimeMode = 'time'): string {
    const date = new Date(value);
    return mode === 'day' ? this.formatDays(date) : this.formatTime(date);
  }

  private formatTime(date: Date): string {
    const seconds = (date.getTime() - Date.now()) / SECOND_MS;
    for (const { unit, seconds: unitSeconds } of TIME_UNITS) {
      if (Math.abs(seconds) >= unitSeconds) {
        return this.formatter.format(Math.trunc(seconds / unitSeconds), unit);
      }
    }
    return 'just now';
  }

  private formatDays(date: Date): string {
    const days = Math.round((startOfUtcDay(date) - startOfUtcDay(new Date())) / DAY_MS);
    return this.formatter.format(days, 'day');
  }
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
