import { Pipe, PipeTransform } from '@angular/core';

const CENTS_PER_UNIT = 100;

// The server sends money in cents with a lowercase currency code, like 199 and 'eur' for €1.99.
@Pipe({ name: 'price' })
export class PricePipe implements PipeTransform {
  transform(cents: number, currency: string): string {
    const format = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return format.format(cents / CENTS_PER_UNIT);
  }
}
