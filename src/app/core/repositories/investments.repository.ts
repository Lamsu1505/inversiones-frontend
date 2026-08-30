// core/repositories/investments.repository.ts
import { Observable } from 'rxjs';
import { Investment } from '../models/investment/investment.model';
import { DailyRecord, DailyStats } from '../models/investment/daily-record.model';
import { DashboardFilter } from '../models/dashboard/dashboard-filter.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';

export abstract class InvestmentsRepository {
  abstract list(): Observable<Investment[]>;
  abstract records(id: number, from: string, to: string): Observable<DailyStats[]>;
  abstract saveRecords(records: DailyRecord[]): Observable<void>;
  abstract dashboardSummary(filter: DashboardFilter): Observable<DashboardSummary>;
  abstract investmentSummary(investmentId: number): Observable<InvestmentSummary>;

  /** Resúmenes de todas las inversiones en una sola llamada — usado por la página
   *  de listado para poder ordenar por Saldo/Rentabilidad sin N peticiones. */
  abstract investmentSummaries(): Observable<InvestmentSummary[]>;
}