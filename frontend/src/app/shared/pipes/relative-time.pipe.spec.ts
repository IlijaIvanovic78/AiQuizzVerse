import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  const pipe = new RelativeTimePipe();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says "just now" for the last minute', () => {
    expect(pipe.transform('2026-10-05T11:59:30Z')).toBe('just now');
  });

  it('uses the biggest whole unit for past times', () => {
    expect(pipe.transform('2026-10-05T09:30:00Z')).toBe('2 hours ago');
    expect(pipe.transform('2026-10-02T12:00:00Z')).toBe('3 days ago');
  });

  it('compares calendar days in day mode', () => {
    expect(pipe.transform('2026-10-05T00:00:00Z', 'day')).toBe('today');
    expect(pipe.transform('2026-10-06T00:00:00Z', 'day')).toBe('tomorrow');
    expect(pipe.transform('2026-10-12T00:00:00Z', 'day')).toBe('in 7 days');
  });
});
