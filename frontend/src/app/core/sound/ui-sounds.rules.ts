export type ClickSound = 'select' | 'danger' | 'menu' | 'toggle' | 'blip';

export type KeySound = 'key' | 'delete';

const CLICKABLE =
  'button, a[href], [role="tab"], [role="switch"], input[type="checkbox"], input[type="radio"]';
// Marks controls whose action already has a sound of its own, like the answers of a match.
const SILENT = '[data-sound="none"]';
// Controls with an on/off state; the chips show theirs with aria-pressed.
const TOGGLES = '[role="switch"], [aria-pressed], input[type="checkbox"], input[type="radio"]';
const TEXT_FIELD_TYPES = ['text', 'email', 'search', 'number', 'password'];

// The sound of a click anywhere in the app, from the control that was clicked. A click on the
// text or icon inside a button counts as a click on the button.
export function clickSound(target: EventTarget | null): ClickSound | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const control = target.closest(CLICKABLE);
  if (!control || control.matches(':disabled, [aria-disabled="true"]')) {
    return null;
  }
  return control.closest(SILENT) ? null : controlSound(control);
}

function controlSound(control: Element): ClickSound {
  if (control.matches(TOGGLES)) {
    return 'toggle';
  }
  if (control.matches('.btn-primary, .btn-success')) {
    return 'select';
  }
  if (control.matches('.btn-danger')) {
    return 'danger';
  }
  if (control.matches('a, [role="tab"]')) {
    return 'menu';
  }
  return 'blip';
}

export function isTextField(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) {
    return true;
  }
  return target instanceof HTMLInputElement && TEXT_FIELD_TYPES.includes(target.type);
}

// Only an InputEvent tells what the key did; any other input event counts as a key.
export function keySound(event: Event): KeySound {
  return event instanceof InputEvent && event.inputType.startsWith('delete') ? 'delete' : 'key';
}
