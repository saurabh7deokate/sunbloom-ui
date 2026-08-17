import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from './auth.store';

/**
 * Blocks admin routes for anyone without the ContentAdmin role.
 *
 * This is navigation ergonomics, not security. The API re-checks the role on every
 * admin request and answers 403 regardless of what the client believes — a guard runs
 * on data the user could edit, so it can only ever be a convenience.
 */
export const contentAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return auth.isContentAdmin() ? true : router.createUrlTree(['/skills']);
};
