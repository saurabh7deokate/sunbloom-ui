import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { SkillTreeNode } from '../../api/types';

/**
 * One node of the skill tree, rendering its children recursively.
 *
 * Areas start expanded and deeper levels collapsed: the full .NET graph is 35 nodes
 * today and will reach several hundred, so expanding everything would bury the
 * structure the tree exists to show.
 */
@Component({
  selector: 'sb-skill-tree-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <li class="sb-tree__item">
      <div class="sb-tree__row">
        @if (hasChildren()) {
          <button
            type="button"
            class="sb-tree__toggle"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="(expanded() ? 'Collapse ' : 'Expand ') + node().name"
            (click)="toggle()"
          >
            <span aria-hidden="true">{{ expanded() ? '−' : '+' }}</span>
          </button>
        } @else {
          <span class="sb-tree__toggle sb-tree__toggle--leaf" aria-hidden="true"></span>
        }

        <a class="sb-tree__link" [routerLink]="['/skills', node().slug]">{{ node().name }}</a>

        <!-- Kind carries a text label, not colour alone: colour-only meaning is
             invisible to a meaningful share of users. -->
        <span class="sb-chip sb-chip--{{ node().kind.toLowerCase() }}">{{ node().kind }}</span>
      </div>

      @if (hasChildren() && expanded()) {
        <ul class="sb-tree__children">
          @for (child of node().children; track child.id) {
            <sb-skill-tree-node [node]="child" [depth]="depth() + 1" />
          }
        </ul>
      }
    </li>
  `,
})
export class SkillTreeNodeComponent {
  readonly node = input.required<SkillTreeNode>();
  readonly depth = input(0);

  private readonly manualState = signal<boolean | null>(null);

  readonly hasChildren = computed(() => (this.node().children?.length ?? 0) > 0);

  readonly expanded = computed(() => this.manualState() ?? this.depth() < 1);

  toggle(): void {
    this.manualState.set(!this.expanded());
  }
}
