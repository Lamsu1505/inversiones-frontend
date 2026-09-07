import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './core/errors/global-error-handler';
import { routes } from './app.routes';
import { MockInvestmentsRepository } from './core/repositories/mock-investments.repository';
import { InvestmentsRepository } from './core/repositories/investments.repository';
import { provideHttpClient } from '@angular/common/http';
import { HttpInvestmentsRepository } from './core/repositories/HttpInvestmentsRepository';


registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: InvestmentsRepository, useClass: HttpInvestmentsRepository },
    provideHttpClient(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};