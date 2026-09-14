import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment/investment.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';
import { DailyRecordDetail, DailyStats } from '../models/investment/daily-record.model';
import { PortfolioReference } from '../models/portfolio-reference.model';
import { DailyRecordInput } from '../models/investment/daily-record-form.model';

@Injectable()
export class HttpInvestmentsRepository extends InvestmentsRepository {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  list(): Observable<Investment[]> {
    return this.http.get<Investment[]>(`${this.baseUrl}/investments`);
  }

  records(id: number, from: string, to: string): Observable<DailyStats[]> {
    return throwError(() => new Error('records() aún no implementado en el backend real'));
  }

  saveRecords(
    investmentId: number,
    records: DailyRecordInput[]
  ): Observable<DailyRecordDetail[]> {
    return this.http.post<DailyRecordDetail[]>(
      `${this.baseUrl}/investments/${investmentId}/records`,
      records
    );
  }

  dashboardSummary(): Observable<DashboardSummary> {
    return throwError(() => new Error('dashboardSummary() aún no implementado en el backend real'));
  }

  investmentSummaries(): Observable<InvestmentSummary[]> {
    return this.http.get<InvestmentSummary[]>(`${this.baseUrl}/investments/summaries`);
  }

  investmentSummary(investmentId: number): Observable<InvestmentSummary> {
    return this.http.get<InvestmentSummary>(
      `${this.baseUrl}/investments/${investmentId}/summary`
    );
  }

  portfolioReference(): Observable<PortfolioReference> {
    return this.http.get<PortfolioReference>(`${this.baseUrl}/dashboard/reference`);
  }

  lastRecord(investmentId: number): Observable<DailyRecordDetail | null> {
    return this.http.get<DailyRecordDetail | null>(
      `${this.baseUrl}/investments/${investmentId}/records/last`
    );
  }
}