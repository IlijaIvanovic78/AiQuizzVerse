/** What to log for a caught value: JavaScript lets code throw things that are not Errors. */
export function errorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : String(error);
}
