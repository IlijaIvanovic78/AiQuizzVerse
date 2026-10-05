// Checks for the keyboard shortcuts of the match page: 1 to 4 answer, Enter or Space go on.

export function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.metaKey;
}

// Typing in a field or using a dialog must never answer the question by accident.
export function isTypingOrInDialog(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest('input, textarea, select, [role="dialog"]') !== null
  );
}

// A focused button or link already reacts to Enter and Space by itself.
export function isControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, a') !== null;
}
