import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthStore } from './auth.store';

/** Endpoints that must never trigger a refresh — they are how refreshing works. */
const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'];

/** Attaches the access token to outgoing requests. */
export const accessTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).accessToken();

  if (!token || isAuthEndpoint(request)) {
    return next(request);
  }

  return next(withBearer(request, token));
};

/**
 * Refreshes once on 401 and retries the original request.
 *
 * Concurrency is the whole difficulty. `AuthStore.refresh()` shares one in-flight
 * request, so ten simultaneous 401s produce exactly one refresh call. Firing ten would
 * present the same rotated token repeatedly, which the API treats as theft and
 * responds to by revoking the entire token family — signing the user out.
 */
export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);

  return next(request).pipe(
    catchError((error: unknown) => {
      const shouldRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthEndpoint(request) &&
        auth.hasRefreshToken();

      if (!shouldRefresh) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((token) => next(withBearer(request, token))),
        catchError((refreshError: unknown) => {
          // Refresh failed, so the session is genuinely over. AuthStore has already
          // cleared it; surface the original 401 rather than the refresh failure,
          // which would be confusing.
          void refreshError;
          return throwError(() => error);
        }),
      );
    }),
  );
};

function withBearer<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isAuthEndpoint<T>(request: HttpRequest<T>): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => request.url.includes(endpoint));
}
