import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { StatePanel } from '../../shared/ui/state-panel';
import { ReviewStore } from './review.store';

@Component({
  selector: 'sb-review-queue-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatePanel, FormsModule],
  template: `
    <header class="sb-page__header">
      <h1 class="sb-page__title">Review queue</h1>
      <p class="sb-page__subtitle">
        Generated content stays invisible to learners until you approve it. Work
        top-down — approve a level, then generate the next one beneath it.
      </p>
    </header>

    <sb-state-panel
      [loading]="store.state() === 'loading'"
      [error]="store.error()"
      [empty]="store.state() === 'loaded' && store.items().length === 0"
      emptyTitle="Nothing to review"
      emptyDetail="Run the content generator to propose new skills."
      (retry)="store.load()"
    />

    @if (store.state() === 'loaded' && store.items().length > 0) {
      <div class="sb-review__bar">
        <label class="sb-review__all">
          <input
            type="checkbox"
            [checked]="store.allSelected()"
            (change)="store.toggleAll()"
            [attr.aria-label]="store.allSelected() ? 'Deselect all' : 'Select all'"
          />
          <span>{{ store.selectedCount() }} of {{ store.items().length }} selected</span>
        </label>

        <span class="sb-review__meta">
          depth {{ store.depth() }}
          @if (store.remainingBeyondPage() > 0) {
            · {{ store.remainingBeyondPage() }} more pending below
          }
        </span>

        <div class="sb-review__actions">
          <button
            type="button"
            class="sb-button"
            [disabled]="store.selectedCount() === 0 || store.submitting()"
            (click)="approve()"
          >
            {{ store.submitting() ? 'Working…' : 'Approve selected' }}
          </button>
          <button
            type="button"
            class="sb-button sb-button--ghost"
            [disabled]="store.selectedCount() === 0 || store.submitting()"
            (click)="startReject()"
          >
            Reject selected
          </button>
        </div>
      </div>

      @if (rejecting()) {
        <div class="sb-review__reject">
          <label class="sb-field">
            <span class="sb-field__label">
              Why are these being rejected? The note is stored with the skill and is what
              tells the next prompt version what to do differently.
            </span>
            <input class="sb-input" type="text" [(ngModel)]="rejectNotes" />
          </label>
          <div class="sb-review__actions">
            <button type="button" class="sb-button" (click)="confirmReject()">
              Reject {{ store.selectedCount() }}
            </button>
            <button type="button" class="sb-button sb-button--ghost" (click)="cancelReject()">
              Cancel
            </button>
          </div>
        </div>
      }

      <ul class="sb-review__list">
        @for (item of store.items(); track item.slug) {
          <li class="sb-review__item" [class.is-selected]="store.selected().has(item.slug)">
            <label class="sb-review__pick">
              <input
                type="checkbox"
                [checked]="store.selected().has(item.slug)"
                (change)="store.toggle(item.slug)"
                [attr.aria-label]="'Select ' + item.name"
              />
            </label>

            <div class="sb-review__body">
              <div class="sb-review__head">
                <strong>{{ item.name }}</strong>
                <span class="sb-chip sb-chip--{{ item.kind.toLowerCase() }}">{{ item.kind }}</span>
                <code class="sb-review__slug">{{ item.slug }}</code>
              </div>

              @if (item.description) {
                <p class="sb-review__desc">{{ item.description }}</p>
              }

              <!-- Provenance is shown, not hidden: knowing which model and prompt
                   produced a node is what makes a bad batch diagnosable. -->
              <p class="sb-review__prov">
                @if (item.parentSlug) { under {{ item.parentSlug }} · }
                {{ item.generationSource === 'Ai' ? item.generatorModel : 'hand-authored' }}
                @if (item.generatorPromptVersion) { · {{ item.generatorPromptVersion }} }
              </p>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class ReviewQueuePage implements OnInit {
  protected readonly store = inject(ReviewStore);

  protected readonly rejecting = signal(false);
  protected rejectNotes = '';

  ngOnInit(): void {
    this.store.load();
  }

  protected approve(): void {
    this.store.decide(true, null);
  }

  protected startReject(): void {
    this.rejecting.set(true);
  }

  protected cancelReject(): void {
    this.rejecting.set(false);
    this.rejectNotes = '';
  }

  protected confirmReject(): void {
    this.store.decide(false, this.rejectNotes.trim() || null);
    this.cancelReject();
  }
}
