import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

// Reactive form controls are not signals. A control emits an event whenever its value, status or
// touched state changes, so reading that event inside computed() keeps the template up to date.
// Call it in a field initializer, because toSignal needs an injection context.
export function touchedAndInvalid(control: AbstractControl): Signal<boolean> {
  const lastEvent = toSignal(control.events);
  return computed(() => {
    lastEvent();
    return control.touched && control.invalid;
  });
}
