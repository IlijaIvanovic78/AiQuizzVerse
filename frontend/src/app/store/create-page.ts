import { Router } from '@angular/router';

const CREATE_PAGE_URL = '/create';

// The create page shows its own result screen, so the "ready" and "failed" toasts are only for
// players who left it while the quiz master was still writing.
export function isOnCreatePage(router: Router): boolean {
  return router.url.startsWith(CREATE_PAGE_URL);
}
