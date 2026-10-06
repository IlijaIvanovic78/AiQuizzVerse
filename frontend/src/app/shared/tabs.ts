const TAB_KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

// Arrow keys move between tabs, as screen reader users expect from a tab list, and wrap around
// at the ends. Any other key gives null and keeps its normal job.
export function tabIndexAfterKey(key: string, index: number, tabCount: number): number | null {
  const step = TAB_KEY_STEPS[key];
  if (!step) {
    return null;
  }
  return (index + step + tabCount) % tabCount;
}
