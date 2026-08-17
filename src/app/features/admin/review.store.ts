import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';

import type { PendingReviewPage, SkillAdminView } from '../../api/types';
import { ApiError, toApiError } from '../../core/http/api-error';
import type { LoadState } from '../skills/skill.store';

@Injectable()
export class ReviewStore {
  private readonly http = inject(HttpClient);

  readonly state = signal<LoadState>('idle');
  readonly error = signal<ApiError | null>(null);

  readonly items = signal<readonly SkillAdminView[]>([]);
  readonly totalPending = signal(0);
  readonly depth = signal(0);

  /** Slugs the reviewer has ticked. Cleared whenever the queue reloads. */
  readonly selected = signal<ReadonlySet<string>>(new Set());

  /** True while an approve/reject request is in flight, to prevent double submission. */
  readonly submitting = signal(false);

  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(
    () => this.items().length > 0 && this.selected().size === this.items().length,
  );

  /** How many remain beyond this page, so the reviewer knows the shape of the work. */
  readonly remainingBeyondPage = computed(() =>
    Math.max(0, this.totalPending() - this.items().length),
  );

  load(): void {
    this.state.set('loading');
    this.error.set(null);

    const params = new HttpParams().set('limit', 200);

    this.http.get<PendingReviewPage>('/api/v1/admin/skills/pending', { params }).subscribe({
      next: (page) => {
        this.items.set(page.items);
        this.totalPending.set(page.totalPending);
        this.depth.set(page.depth);
        this.selected.set(new Set());
        this.state.set('loaded');
      },
      error: (failure: HttpErrorResponse) => {
        this.error.set(toApiError(failure));
        this.state.set('error');
      },
    });
  }

  toggle(slug: string): void {
    const next = new Set(this.selected());
    next.has(slug) ? next.delete(slug) : next.add(slug);
    this.selected.set(next);
  }

  toggleAll(): void {
    this.selected.set(
      this.allSelected() ? new Set() : new Set(this.items().map((item) => item.slug)),
    );
  }

  /**
   * Applies a decision to every selected skill.
   *
   * Bulk approval is the point of this screen. A real career path is several hundred
   * nodes; approving them one dialog at a time is how review becomes rubber-stamping,
   * which is the failure mode the human gate exists to prevent. Reject stays deliberate
   * — it carries a note explaining why, so a bad batch teaches the next prompt version.
   */
  decide(approve: boolean, notes: string | null): void {
    const slugs = [...this.selected()];

    if (slugs.length === 0 || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const calls = slugs.map((slug) =>
      this.http.post(
        `/api/v1/admin/skills/${encodeURIComponent(slug)}/${approve ? 'approve' : 'reject'}`,
        { notes },
      ),
    );

    forkJoin(calls.length > 0 ? calls : [of(null)]).subscribe({
      next: () => {
        this.submitting.set(false);
        // Reload rather than mutating locally: approving a level can reveal the next
        // one, and the server decides which depth comes next.
        this.load();
      },
      error: (failure: HttpErrorResponse) => {
        this.error.set(toApiError(failure));
        this.submitting.set(false);
        this.load();
      },
    });
  }
}
