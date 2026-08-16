import { HttpErrorResponse } from '@angular/common/http';

/**
 * A failed request, reduced to what the UI actually needs.
 *
 * The API returns RFC 9457 Problem Details for every error. Parsing it once here keeps
 * status-code handling out of components.
 */
export interface ApiError {
  readonly status: number;
  /** Short, human-readable summary. Safe to show. */
  readonly title: string;
  /** Longer explanation when the API provided one. */
  readonly detail?: string;
  /** Field-level messages from a 400, keyed by field name. */
  readonly fieldErrors?: Readonly<Record<string, string[]>>;
  /** Correlates a user report with server logs. */
  readonly traceId?: string;
}

interface ProblemDetailsBody {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

export function toApiError(response: HttpErrorResponse): ApiError {
  // status 0 means the request never reached the server at all.
  if (response.status === 0) {
    return {
      status: 0,
      title: 'Cannot reach the server',
      detail: 'Check that the SunBloom API is running.',
    };
  }

  const body = (response.error ?? {}) as ProblemDetailsBody;

  return {
    status: response.status,
    title: body.title ?? defaultTitle(response.status),
    detail: body.detail,
    fieldErrors: body.errors,
    traceId: body.traceId,
  };
}

/** Flattens field errors for display near a form field. */
export function fieldError(error: ApiError | null, field: string): string | null {
  if (!error?.fieldErrors) {
    return null;
  }

  // ASP.NET returns PascalCase keys; template bindings use camelCase.
  const key = Object.keys(error.fieldErrors).find(
    (candidate) => candidate.toLowerCase() === field.toLowerCase(),
  );

  return key ? (error.fieldErrors[key]?.join(' ') ?? null) : null;
}

function defaultTitle(status: number): string {
  if (status === 401) return 'Not signed in';
  if (status === 403) return 'Not allowed';
  if (status === 404) return 'Not found';
  if (status === 429) return 'Too many attempts';
  if (status >= 500) return 'Something went wrong';
  return 'Request failed';
}
