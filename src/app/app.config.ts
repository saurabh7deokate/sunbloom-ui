import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth.store';
import { accessTokenInterceptor, refreshInterceptor } from './core/auth/auth.interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),

    // Order matters: the refresh interceptor must wrap the token interceptor so that
    // the retried request picks up the newly issued token.
    provideHttpClient(withInterceptors([refreshInterceptor, accessTokenInterceptor])),

    // Restores the signed-in user from a stored token before the first route resolves,
    // so the shell does not flash an empty user on reload.
    provideAppInitializer(() => firstValueFrom(inject(AuthStore).loadCurrentUser())),
  ],
};
