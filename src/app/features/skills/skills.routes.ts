import { Routes } from '@angular/router';

import { SkillStore } from './skill.store';

/**
 * The store is provided here rather than in root, so it is created on entry and
 * disposed on exit (ADR-0009).
 */
export const skillsRoutes: Routes = [
  {
    path: '',
    providers: [SkillStore],
    children: [
      {
        path: '',
        title: 'Skills · SunBloom',
        loadComponent: () => import('./skill-tree.page').then((m) => m.SkillTreePage),
      },
      {
        path: ':slug',
        title: 'Skill · SunBloom',
        loadComponent: () => import('./skill-detail.page').then((m) => m.SkillDetailPage),
      },
    ],
  },
];
