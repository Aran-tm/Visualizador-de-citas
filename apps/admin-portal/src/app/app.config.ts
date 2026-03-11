import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { APPOINTMENT_REPOSITORY } from '@app/domain';
import { MockAppointmentRepository } from '@app/data-access';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    { provide: APPOINTMENT_REPOSITORY, useClass: MockAppointmentRepository },
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ]
};
