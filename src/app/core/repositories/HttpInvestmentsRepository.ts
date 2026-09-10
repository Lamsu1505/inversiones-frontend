import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';

import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment/investment.model';
// import { DailyStats } from '../models/daily-record.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';
import { DailyStats } from '../models/investment/daily-record.model';

@Injectable()
export class HttpInvestmentsRepository extends InvestmentsRepository {
  
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/investments';

 list(): Observable<Investment[]> {
  return this.http.get<Investment[]>(this.baseUrl).pipe(
    tap(investments => console.log('list() recibió:', investments))
  );
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

  investmentSummaries(): Observable<InvestmentSummary[]> {
  return this.http.get<InvestmentSummary[]>(`${this.baseUrl}/summaries`);
  }

  investmentSummary(investmentId: number): Observable<InvestmentSummary> {
    return this.http.get<InvestmentSummary>(
      `${this.baseUrl}/api/investments/${investmentId}/summary` 
    );
  }
}