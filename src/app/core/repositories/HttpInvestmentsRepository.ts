import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment/investment.model';
// import { DailyStats } from '../models/daily-record.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';
import { DailyStats } from '../models/investment/daily-record.model';

/**
 * Walking skeleton: solo list() habla con el backend real (Spring Boot →
 * Postgres). El resto de los métodos lanza a propósito — mejor un error
 * ruidoso e inmediato que datos silenciosamente incorrectos mientras el
 * resto del backend todavía no existe.
 */
@Injectable()
export class HttpInvestmentsRepository extends InvestmentsRepository {
  
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/investments';

  list(): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.baseUrl);
  }

  records(id: number, from: string, to: string): Observable<DailyStats[]> {
      throw new Error('Method not implemented.');
  }

  saveRecords(): Observable<void> {
    return throwError(() => new Error('saveRecords() aún no implementado en el backend real'));
  }

  dashboardSummary(): Observable<DashboardSummary> {
    return throwError(() => new Error('dashboardSummary() aún no implementado en el backend real'));
  }

  investmentSummary(): Observable<InvestmentSummary> {
    return throwError(() => new Error('investmentSummary() aún no implementado en el backend real'));
  }

  investmentSummaries(): Observable<InvestmentSummary[]> {
    return throwError(() => new Error('investmentSummaries() aún no implementado en el backend real'));
  }
}