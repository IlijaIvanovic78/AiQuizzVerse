import { Router } from '@angular/router';
import { RETURN_URL_PARAM } from './auth.constants';

// The page a logged-out player tried to open, like a /join/CODE share link, or null.
export function readReturnUrl(router: Router): string | null {
  const returnUrl: unknown = router.parseUrl(router.url).queryParams[RETURN_URL_PARAM];
  return typeof returnUrl === 'string' && returnUrl.startsWith('/') ? returnUrl : null;
}
