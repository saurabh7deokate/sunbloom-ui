import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../../api/types';

const ACCESS_TOKEN_KEY = 'sunbloom.accessToken';
const REFRESH_TOKEN_KEY = 'sunbloom.refreshToken';

/**
 * Session state and the auth API.
 *
 * Provided in root because the session is genuinely application-wide — unlike feature
 * stores, which are provided at their route so they are disposed on navigation.
 *
 * Tokens live in `localStorage` so a page refresh keeps you signed in. That trades
 * some XSS exposure for persistence; the safer arrangement is an httpOnly cookie for
 * the refresh token, which needs an API change and is noted as a follow-up rather than
 * silently ignored.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly accessTokenSignal = signal<string | null>(read(ACCESS_TOKEN_KEY));
  private readonly refreshTokenSignal = signal<string | null>(read(REFRESH_TOKEN_KEY));
  private readonly userSignal = signal<UserResponse | null>(null);

  /**
   * The in-flight refresh, shared by every request that hit a 401 at once.
   *
   * Without this, five concurrent 401s each fire their own refresh. Because refresh
   * tokens rotate and reuse revokes the whole family (a deliberate theft defence in the
   * API), the second request through would look like token theft and sign the user out.
   * One shared refresh is not an optimization here — it is a correctness requirement.
   */
  private refreshInFlight: Observable<string> | null = null;

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

  /**
   * Whether to show admin navigation. A display hint only — the API decides.
   *
   * Reads from the loaded user rather than decoding the JWT: the token is an opaque
   * bearer credential to this client, and parsing it here would invite treating its
   * claims as trustworthy.
   */
  readonly isContentAdmin = computed(
    () => this.userSignal()?.roles?.includes('ContentAdmin') ?? false,
  );

  hasRefreshToken(): boolean {
    return this.refreshTokenSignal() !== null;
  }

  login(request: LoginRequest): Observable<UserResponse> {
    return this.http
      .post<AuthResponse>('/api/v1/auth/login', request)
      .pipe(map((response) => this.acceptSession(response)));
  }

  register(request: RegisterRequest): Observable<UserResponse> {
    return this.http
      .post<AuthResponse>('/api/v1/auth/register', request)
      .pipe(map((response) => this.acceptSession(response)));
  }

  /** Loads the current user. Used on startup to restore a session from a stored token. */
  loadCurrentUser(): Observable<UserResponse | null> {
    if (!this.accessTokenSignal()) {
      return of(null);
    }

    return this.http.get<UserResponse>('/api/v1/auth/me').pipe(
      tap((user) => this.userSignal.set(user)),
      catchError(() => of(null)),
    );
  }

  /**
   * Rotates the refresh token. Concurrent callers share one request.
   */
  refresh(): Observable<string> {
    const refreshToken = this.refreshTokenSignal();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    this.refreshInFlight ??= this.http
      .post<AuthResponse>('/api/v1/auth/refresh', { refreshToken })
      .pipe(
        map((response) => {
          this.acceptSession(response);
          return response.accessToken;
        }),
        catchError((error: unknown) => {
          // The refresh token is spent, expired, or revoked. Nothing to recover.
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshInFlight;
  }

  logout(): void {
    const refreshToken = this.refreshTokenSignal();

    if (refreshToken) {
      // Fire and forget: the server revokes the family, but the user is signed out
      // locally regardless of whether that call succeeds.
      this.http.post('/api/v1/auth/logout', { refreshToken }).subscribe({
        error: () => undefined,
      });
    }

    this.clearSession();
    void this.router.navigate(['/login']);
  }

  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userSignal.set(null);
    remove(ACCESS_TOKEN_KEY);
    remove(REFRESH_TOKEN_KEY);
  }

  private acceptSession(response: AuthResponse): UserResponse {
    this.accessTokenSignal.set(response.accessToken);
    this.refreshTokenSignal.set(response.refreshToken);
    this.userSignal.set(response.user);
    write(ACCESS_TOKEN_KEY, response.accessToken);
    write(REFRESH_TOKEN_KEY, response.refreshToken);

    return response.user;
  }
}

// localStorage throws in private-browsing modes and when storage is full. A failure to
// persist a token should degrade to "signed out on refresh", never crash the app.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* session simply will not survive a refresh */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing useful to do */
  }
}
