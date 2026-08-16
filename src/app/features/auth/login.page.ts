import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/auth/auth.store';
import { ApiError, fieldError, toApiError } from '../../core/http/api-error';

@Component({
  selector: 'sb-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="sb-auth">
      <h1 class="sb-auth__title">Sign in to SunBloom</h1>
      <p class="sb-auth__subtitle">Pick up where you left off.</p>

      <form class="sb-form" [formGroup]="form" (ngSubmit)="submit()">
        @if (error(); as failure) {
          <div class="sb-alert" role="alert">
            <strong>{{ failure.title }}</strong>
            @if (failure.detail) {
              <span>{{ failure.detail }}</span>
            }
          </div>
        }

        <label class="sb-field">
          <span class="sb-field__label">Email</span>
          <input
            class="sb-input"
            type="email"
            formControlName="email"
            autocomplete="email"
            required
          />
          @if (fieldMessage('email'); as message) {
            <span class="sb-field__error">{{ message }}</span>
          }
        </label>

        <label class="sb-field">
          <span class="sb-field__label">Password</span>
          <input
            class="sb-input"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            required
          />
          @if (fieldMessage('password'); as message) {
            <span class="sb-field__error">{{ message }}</span>
          }
        </label>

        <button class="sb-button" type="submit" [disabled]="submitting() || form.invalid">
          {{ submitting() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="sb-auth__alt">
        No account yet? <a routerLink="/register">Create one</a>
      </p>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        // Return to wherever the guard interrupted, or the skills tree.
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/skills';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (failure: HttpErrorResponse) => {
        this.error.set(toApiError(failure));
        this.submitting.set(false);
      },
    });
  }

  protected fieldMessage(field: string): string | null {
    return fieldError(this.error(), field);
  }
}
