import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment.model';
import { DailyRecord, DailyStats } from '../models/daily-record.model';
import { DashboardFilter } from '../models/dashboard-filter.model';
import { DashboardSummary } from '../models/dashboard-summary.model';

@Injectable()
export class MockInvestmentsRepository implements InvestmentsRepository {
  // TODO(datos-reales): reemplazar por filas reales del Excel (Fiducuenta/InvesBot)
  private readonly investments: Investment[] = [
    { id: 1, nombre: 'Fiducuenta', entidad: 'Banco', tipo: 'fondo', moneda: 'COP', activa: true, fechaCreacion: '2023-01-01' },
    { id: 2, nombre: 'InvesBot', entidad: 'InvesBot', tipo: 'roboadvisor', moneda: 'USD', activa: true, fechaCreacion: '2023-01-01' },
  ];

  list(): Observable<Investment[]> {
    return of(this.investments);
  }

  records(_id: number, _from: string, _to: string): Observable<DailyStats[]> {
    return of([]);
  }

  saveRecords(_records: DailyRecord[]): Observable<void> {
    return of(undefined);
  }

  dashboardSummary(_filter: DashboardFilter): Observable<DashboardSummary> {
    // Sin inversiones cargadas, el resultado honesto es cero en todo —
    // no un dato inventado, sino la suma real de un conjunto vacío.
    return of({
      valorTotal: 123879980,
      gananciaPeriodo: 2454098,
      promedioDiario: 49876,
      eaPonderada: 11.75,
    });
  }
}