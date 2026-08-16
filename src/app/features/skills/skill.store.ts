import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import type { SkillDetail, SkillTreeNode } from '../../api/types';
import { ApiError, toApiError } from '../../core/http/api-error';

export type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Skill graph state for the Skills feature.
 *
 * Not `providedIn: 'root'` — it is provided at the feature's route, so navigating away
 * disposes it. A root-provided store accumulates stale data across a session and
 * quietly becomes a cache nobody invalidates (ADR-0009).
 */
@Injectable()
export class SkillStore {
  private readonly http = inject(HttpClient);

  readonly treeState = signal<LoadState>('idle');
  readonly tree = signal<readonly SkillTreeNode[]>([]);
  readonly treeError = signal<ApiError | null>(null);

  readonly detailState = signal<LoadState>('idle');
  readonly detail = signal<SkillDetail | null>(null);
  readonly detailError = signal<ApiError | null>(null);

  loadTree(root?: string): void {
    this.treeState.set('loading');
    this.treeError.set(null);

    const params = root ? new HttpParams().set('root', root) : undefined;

    this.http.get<SkillTreeNode[]>('/api/v1/skills/tree', { params }).subscribe({
      next: (tree) => {
        this.tree.set(tree);
        this.treeState.set('loaded');
      },
      error: (error: HttpErrorResponse) => {
        this.treeError.set(toApiError(error));
        this.treeState.set('error');
      },
    });
  }

  loadDetail(slug: string): void {
    this.detailState.set('loading');
    this.detailError.set(null);
    this.detail.set(null);

    this.http.get<SkillDetail>(`/api/v1/skills/${encodeURIComponent(slug)}`).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.detailState.set('loaded');
      },
      error: (error: HttpErrorResponse) => {
        this.detailError.set(toApiError(error));
        this.detailState.set('error');
      },
    });
  }
}
