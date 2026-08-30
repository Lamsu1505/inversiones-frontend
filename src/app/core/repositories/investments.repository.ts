import { Observable } from 'rxjs';
import { Investment } from '../models/investment.model';
import { DailyRecord, DailyStats } from '../models/daily-record.model';

export abstract class InvestmentsRepository {
  /** Lista todas las inversiones (activas e inactivas). */
  abstract list(): Observable<Investment[]>;

  /** Registros diarios de una inversión, ya con métricas calculadas (ver v_daily_stats). */
  abstract records(id: number, from: string, to: string): Observable<DailyStats[]>;

  /** Guarda uno o varios registros diarios. UPSERT por (investmentId, fecha). */
  abstract saveRecords(records: DailyRecord[]): Observable<void>;
}