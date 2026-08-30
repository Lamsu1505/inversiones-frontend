import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment.model';
import { DailyRecord, DailyStats } from '../models/daily-record.model';

@Injectable()
export class MockInvestmentsRepository implements InvestmentsRepository {
  // TODO(datos-reales): reemplazar por filas reales del Excel (Fiducuenta/InvesBot)
  private readonly investments: Investment[] = [
    { id: 1, nombre: 'Fiducuenta', entidad: 'Banco', tipo: 'fondo', moneda: 'COP', activa: true, },
    { id: 2, nombre: 'InvesBot', entidad: 'InvesBot', tipo: 'roboadvisor', moneda: 'USD', activa: true, },
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
}