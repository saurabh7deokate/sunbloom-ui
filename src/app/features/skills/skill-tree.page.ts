import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';

import { StatePanel } from '../../shared/ui/state-panel';
import { SkillStore } from './skill.store';
import { SkillTreeNodeComponent } from './skill-tree-node';

@Component({
  selector: 'sb-skill-tree-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatePanel, SkillTreeNodeComponent],
  template: `
    <header class="sb-page__header">
      <h1 class="sb-page__title">Skills</h1>
      <p class="sb-page__subtitle">
        The skill graph for .NET backend development. Prerequisites cross branches, so a
        skill's dependencies often live elsewhere in the tree.
      </p>
    </header>

    <sb-state-panel
      [loading]="store.treeState() === 'loading'"
      [error]="store.treeError()"
      [empty]="store.treeState() === 'loaded' && store.tree().length === 0"
      emptyTitle="No skills yet"
      emptyDetail="The catalog has not been seeded. Start the API in Development to seed it."
      (retry)="load()"
    />

    @if (store.treeState() === 'loaded' && store.tree().length > 0) {
      <p class="sb-page__meta">{{ totalCount() }} skills</p>
      <ul class="sb-tree">
        @for (node of store.tree(); track node.id) {
          <sb-skill-tree-node [node]="node" />
        }
      </ul>
    }
  `,
})
export class SkillTreePage implements OnInit {
  protected readonly store = inject(SkillStore);

  protected readonly totalCount = computed(() => count(this.store.tree()));

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.store.loadTree();
  }
}

function count(nodes: readonly { children?: unknown[] }[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + count((node.children ?? []) as { children?: unknown[] }[]),
    0,
  );
}
