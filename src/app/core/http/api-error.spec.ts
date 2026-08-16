import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { fieldError, toApiError } from './api-error';

describe('toApiError', () => {
  it('reads RFC 9457 problem details from the body', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 409,
        error: {
          title: 'Email already registered',
          detail: 'An account already exists for this email address.',
          traceId: '00-abc-def-01',
        },
      }),
    );

    expect(error.status).toBe(409);
    expect(error.title).toBe('Email already registered');
    expect(error.detail).toBe('An account already exists for this email address.');
    expect(error.traceId).toBe('00-abc-def-01');
  });

  it('distinguishes an unreachable server from a server error', () => {
    // status 0 means the request never arrived, which is a different problem for the
    // user than a 500 — and the only actionable one during local development.
    const error = toApiError(new HttpErrorResponse({ status: 0 }));

    expect(error.status).toBe(0);
    expect(error.title).toBe('Cannot reach the server');
  });

  it('falls back to a readable title when the body has none', () => {
    expect(toApiError(new HttpErrorResponse({ status: 429 })).title).toBe('Too many attempts');
    expect(toApiError(new HttpErrorResponse({ status: 503 })).title).toBe('Something went wrong');
  });
});

describe('fieldError', () => {
  const validationFailure = toApiError(
    new HttpErrorResponse({
      status: 400,
      error: {
        title: 'One or more validation errors occurred.',
        errors: { Password: ['Password must be at least 12 characters.'] },
      },
    }),
  );

  it('matches PascalCase keys from the API against camelCase field names', () => {
    // ASP.NET returns "Password"; the Angular form control is "password". Without the
    // case-insensitive lookup the message silently never displays.
    expect(fieldError(validationFailure, 'password')).toBe(
      'Password must be at least 12 characters.',
    );
  });

  it('returns null for fields with no error', () => {
    expect(fieldError(validationFailure, 'email')).toBeNull();
  });

  it('returns null when there is no error at all', () => {
    expect(fieldError(null, 'password')).toBeNull();
  });
});
