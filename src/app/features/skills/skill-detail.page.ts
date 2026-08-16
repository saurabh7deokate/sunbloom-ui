import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { SkillSummary } from '../../api/types';
import { StatePanel } from '../../shared/ui/state-panel';
import { SkillStore } from './skill.store';

@Component({
  selector: 'sb-skill-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatePanel, RouterLink],
  template: `
    <a class="sb-back" routerLink="/skills">← All skills</a>

    <sb-state-panel
      [loading]="store.detailState() === 'loading'"
      [error]="store.detailError()"
      (retry)="store.loadDetail(slug())"
    />

    @if (store.detail(); as skill) {
      <header class="sb-page__header">
        <h1 class="sb-page__title">{{ skill.name }}</h1>
        <span class="sb-chip sb-chip--{{ skill.kind.toLowerCase() }}">{{ skill.kind }}</span>
        @if (skill.description) {
          <p class="sb-page__subtitle">{{ skill.description }}</p>
        }
      </header>

      <div class="sb-grid">
        <!-- Prerequisites first: they are what determines whether this skill is
             reachable at all, and 1.8 will use exactly this to block recommendations. -->
        <section class="sb-card">
          <h2 class="sb-card__title">Learn first</h2>
          @if (skill.prerequisites.length === 0) {
            <p class="sb-card__empty">Nothing. You can start this any time.</p>
          } @else {
            <ul class="sb-list">
              @for (item of skill.prerequisites; track item.id) {
                <li><a [routerLink]="['/skills', item.slug]">{{ item.name }}</a></li>
              }
            </ul>
          }
        </section>

        <!-- Unlocks is the non-obvious half: it becomes the unlockCount term that makes
             gap ranking more than "you are weak at X". -->
        <section class="sb-card">
          <h2 class="sb-card__title">Unlocks</h2>
          @if (skill.unlocks.length === 0) {
            <p class="sb-card__empty">Nothing depends on this yet.</p>
          } @else {
            <ul class="sb-list">
              @for (item of skill.unlocks; track item.id) {
                <li><a [routerLink]="['/skills', item.slug]">{{ item.name }}</a></li>
              }
            </ul>
          }
        </section>

        <section class="sb-card">
          <h2 class="sb-card__title">Related</h2>
          @if (skill.related.length === 0) {
            <p class="sb-card__empty">No related skills recorded.</p>
          } @else {
            <ul class="sb-list">
              @for (item of skill.related; track item.id) {
                <li><a [routerLink]="['/skills', item.slug]">{{ item.name }}</a></li>
              }
            </ul>
          }
        </section>
      </div>
    }
  `,
})
export class SkillDetailPage {
  /** Bound from the route via `withComponentInputBinding()`. */
  readonly slug = input.required<string>();

  protected readonly store = inject(SkillStore);

  constructor() {
    // Reloads when the slug changes, so navigating between related skills works
    // without recreating the component.
    effect(() => this.store.loadDetail(this.slug()));
  }

  protected trackSummary(_: number, item: SkillSummary): string {
    return item.id;
  }
}
