// core/repositories/investments.repository.ts
import { Observable } from 'rxjs';
import { Investment } from '../models/investment/investment.model';
import { DailyRecord, DailyRecordDetail, DailyStats } from '../models/investment/daily-record.model';
import { DashboardFilter } from '../models/dashboard/dashboard-filter.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';
import { PortfolioReference } from '../models/portfolio-reference.model';
import { DailyRecordInput } from '../models/investment/daily-record-form.model';

export abstract class InvestmentsRepository {
  abstract list(): Observable<Investment[]>;
  abstract records(id: number, from: string, to: string): Observable<DailyStats[]>;
  abstract dashboardSummary(filter: DashboardFilter): Observable<DashboardSummary>;
  abstract investmentSummary(investmentId: number): Observable<InvestmentSummary>;
  
  abstract saveRecords(
    investmentId: number,
    records: DailyRecordInput[]
  ): Observable<DailyRecordDetail[]>;

  /** Resúmenes de todas las inversiones en una sola llamada — usado por la página
   *  de listado para poder ordenar por Saldo/Rentabilidad sin N peticiones. */
  abstract investmentSummaries(): Observable<InvestmentSummary[]>;
  
  /** Referencias de comparación. Nunca incluye el mes en curso. */
  abstract portfolioReference(): Observable<PortfolioReference>;

  /** Último registro de la inversión. null si todavía no hay ninguno. */
  abstract lastRecord(investmentId: number): Observable<DailyRecordDetail | null>;
}

