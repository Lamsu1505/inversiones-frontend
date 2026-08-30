import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';

import { routes } from './app.routes';
import { MockInvestmentsRepository } from './core/repositories/mock-investments.repository';
import { InvestmentsRepository } from './core/repositories/investments.repository';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: InvestmentsRepository, useClass: MockInvestmentsRepository },
  ]
};