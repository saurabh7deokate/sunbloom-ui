import { Routes } from '@angular/router';

import { ReviewStore } from './review.store';

export const adminRoutes: Routes = [
  {
    path: '',
    providers: [ReviewStore],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Review queue · SunBloom',
        loadComponent: () => import('./review-queue.page').then((m) => m.ReviewQueuePage),
      },
    ],
  },
];
