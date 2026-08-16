import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/auth/auth.store';
import { ApiError, fieldError, toApiError } from '../../core/http/api-error';

/** Mirrors the API's rule. Length beats composition rules for real-world strength. */
const MIN_PASSWORD_LENGTH = 12;

@Component({
  selector: 'sb-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="sb-auth">
      <h1 class="sb-auth__title">Create your SunBloom account</h1>
      <p class="sb-auth__subtitle">Start by seeing where you actually stand.</p>

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
          <span class="sb-field__label">Name</span>
          <input class="sb-input" type="text" formControlName="displayName" autocomplete="name" required />
          @if (fieldMessage('displayName'); as message) {
            <span class="sb-field__error">{{ message }}</span>
          }
        </label>

        <label class="sb-field">
          <span class="sb-field__label">Email</span>
          <input class="sb-input" type="email" formControlName="email" autocomplete="email" required />
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
            autocomplete="new-password"
            required
          />
          <span class="sb-field__hint">
            At least {{ minPasswordLength }} characters. A memorable phrase works well.
          </span>
          @if (fieldMessage('password'); as message) {
            <span class="sb-field__error">{{ message }}</span>
          }
        </label>

        <button class="sb-button" type="submit" [disabled]="submitting() || form.invalid">
          {{ submitting() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="sb-auth__alt">Already have an account? <a routerLink="/login">Sign in</a></p>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly minPasswordLength = MIN_PASSWORD_LENGTH;
  protected readonly submitting = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const { displayName, email, password } = this.form.getRawValue();

    this.auth
      .register({
        displayName,
        email,
        password,
        // Sent so the daily plan can eventually schedule in the user's own day.
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .subscribe({
        next: () => void this.router.navigate(['/skills']),
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
