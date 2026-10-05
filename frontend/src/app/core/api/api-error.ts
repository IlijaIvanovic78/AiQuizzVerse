import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const OFFLINE_MESSAGE = "Can't reach the server. Check your connection.";

export function readErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return FALLBACK_MESSAGE;
  }
  if (error.status === 0) {
    return OFFLINE_MESSAGE;
  }
  return serverMessage(error.error) ?? FALLBACK_MESSAGE;
}

// 0 when the server could not be reached or the error is not an HTTP error at all.
export function readErrorStatus(error: unknown): number {
  return error instanceof HttpErrorResponse ? error.status : 0;
}

function serverMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return null;
  }
  const { message } = body;
  if (typeof message === 'string') {
    return message;
  }
  // ValidationPipe sends a list of messages; the first one is enough for a toast.
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  return null;
}
