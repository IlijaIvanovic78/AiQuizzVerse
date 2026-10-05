import { PricePipe } from './price.pipe';

describe('PricePipe', () => {
  const pipe = new PricePipe();

  it('turns cents into a price with the currency sign', () => {
    expect(pipe.transform(199, 'eur')).toBe('€1.99');
    expect(pipe.transform(1000, 'eur')).toBe('€10.00');
  });
});
