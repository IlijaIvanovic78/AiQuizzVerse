import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatCoins', standalone: true })
export class FormatCoinsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return value.toString();
  }
}
