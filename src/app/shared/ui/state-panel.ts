import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ApiError } from '../../core/http/api-error';

/**
 * The non-content states of an async view.
 *
 * Every async view must handle loading, empty, and error explicitly — an unhandled
 * empty state is a bug, not a detail. Empty states matter unusually much in SunBloom
 * because a new user's entire application is empty, so they *are* the onboarding.
 */
@Component({
  selector: 'sb-state-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="sb-panel" role="status" aria-live="polite">
        <div class="sb-skeleton" aria-hidden="true"></div>
        <div class="sb-skeleton sb-skeleton--short" aria-hidden="true"></div>
        <span class="sb-sr-only">Loading…</span>
      </div>
    } @else if (error(); as failure) {
      <div class="sb-panel sb-panel--error" role="alert">
        <p class="sb-panel__title">{{ failure.title }}</p>
        @if (failure.detail) {
          <p class="sb-panel__detail">{{ failure.detail }}</p>
        }
        <button type="button" class="sb-button sb-button--ghost" (click)="retry.emit()">
          Try again
        </button>
        @if (failure.traceId) {
          <p class="sb-panel__trace">Reference: {{ failure.traceId }}</p>
        }
      </div>
    } @else if (empty()) {
      <div class="sb-panel">
        <p class="sb-panel__title">{{ emptyTitle() }}</p>
        <p class="sb-panel__detail">{{ emptyDetail() }}</p>
      </div>
    }
  `,
})
export class StatePanel {
  readonly loading = input(false);
  readonly error = input<ApiError | null>(null);
  readonly empty = input(false);
  readonly emptyTitle = input('Nothing here yet');
  readonly emptyDetail = input('');

  readonly retry = output<void>();
}
