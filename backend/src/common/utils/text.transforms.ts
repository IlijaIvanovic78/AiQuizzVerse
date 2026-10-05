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
