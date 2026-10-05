import { TransformFnParams } from 'class-transformer';

export function trimText({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimEachText({ value }: TransformFnParams): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item: unknown) => (typeof item === 'string' ? item.trim() : item));
}

export function toNormalizedEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? normalizeEmail(value) : value;
}

/** Emails are stored and looked up in this form, so the same address always matches. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
