import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStore } from '../auth/auth.store';

/**
 * Application chrome for signed-in routes.
 *
 * The sunflower metaphor stays in colour and naming only — no mascots, badges, or
 * streaks. This is a tool for adults preparing for job interviews.
 */
@Component({
  selector: 'sb-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="sb-skip" href="#main">Skip to content</a>

    <header class="sb-header">
      <a class="sb-brand" routerLink="/skills">
        <span class="sb-brand__mark" aria-hidden="true"></span>
        <span class="sb-brand__name">SunBloom</span>
      </a>

      <nav class="sb-nav" aria-label="Main">
        <a routerLink="/skills" routerLinkActive="is-active">Skills</a>
        @if (auth.isContentAdmin()) {
          <a routerLink="/review" routerLinkActive="is-active">Review</a>
        }
      </nav>

      <div class="sb-header__end">
        @if (auth.user(); as user) {
          <span class="sb-header__user">{{ user.displayName }}</span>
        }
        <button type="button" class="sb-button sb-button--ghost" (click)="auth.logout()">
          Sign out
        </button>
      </div>
    </header>

    <main class="sb-main" id="main">
      <router-outlet />
    </main>
  `,
})
export class Shell {
  protected readonly auth = inject(AuthStore);
}
