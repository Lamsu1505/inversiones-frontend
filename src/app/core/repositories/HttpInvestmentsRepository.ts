import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment/investment.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';
import { DailyRecordDetail, DailyStats } from '../models/investment/daily-record.model';
import { PortfolioReference } from '../models/portfolio-reference.model';
import { DailyRecordFields, DailyRecordInput } from '../models/investment/daily-record-form.model';
import { Movement, MovementInput } from '../models/investment/movement.model';
import { EditConstraints, InvestmentInput, InvestmentTypeOption } from '../models/investment/investment-form.model';
import { MonthlySummary } from '../models/investment/monthly-summary.model';

@Injectable()
export class HttpInvestmentsRepository extends InvestmentsRepository {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  list(): Observable<Investment[]> {
    return this.http.get<Investment[]>(`${this.baseUrl}/investments`);
  }

  records(id: number, from: string, to: string): Observable<DailyStats[]> {
    return this.http.get<DailyStats[]>(
      `${this.baseUrl}/investments/${id}/records`,
      { params: { from, to } },
    );
  }

  saveRecords(investmentId: number, records: DailyRecordInput[]): Observable<DailyRecordDetail[]> {
  const body = records.map(({ investmentId: _id, ...resto }) => resto);
  return this.http.post<DailyRecordDetail[]>(
    `${this.baseUrl}/investments/${investmentId}/records`,
    body,
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

  createMovement(investmentId: number, input: MovementInput): Observable<Movement> {
    return this.http.post<Movement>(
      `${this.baseUrl}/investments/${investmentId}/movements`, input);
  }
  
  recentMovements(investmentId: number): Observable<Movement[]> {
    return this.http.get<Movement[]>(
      `${this.baseUrl}/investments/${investmentId}/movements/recent`);
  }

  deleteMovement(movementId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/movements/${movementId}`);
  }

  investmentTypes(): Observable<InvestmentTypeOption[]> {
    return this.http.get<InvestmentTypeOption[]>(`${this.baseUrl}/investment-types`);
  }

  createInvestment(input: InvestmentInput): Observable<Investment> {
    return this.http.post<Investment>(`${this.baseUrl}/investments`, input);
  }

  updateInvestment(id: number, input: InvestmentInput): Observable<Investment> {
    return this.http.put<Investment>(`${this.baseUrl}/investments/${id}`, input);
  }

  changeInvestmentStatus(id: number, activa: boolean): Observable<Investment> {
    return this.http.patch<Investment>(`${this.baseUrl}/investments/${id}/status`, { activa });
  }

  editConstraints(id: number): Observable<EditConstraints> {
    return this.http.get<EditConstraints>(`${this.baseUrl}/investments/${id}/edit-constraints`);
  }

  monthlySummaries(investmentId: number): Observable<MonthlySummary[]> {
    return this.http.get<MonthlySummary[]>(
      `${this.baseUrl}/investments/${investmentId}/monthly-summaries`);
  }

  movements(investmentId: number, from: string, to: string): Observable<Movement[]> {
    return this.http.get<Movement[]>(
      `${this.baseUrl}/investments/${investmentId}/movements`,
      { params: { from, to } });
  }

  updateRecord(recordId: number, fields: DailyRecordFields): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/records/${recordId}`, fields);
  }

  deleteRecord(recordId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/records/${recordId}`);
  }
}