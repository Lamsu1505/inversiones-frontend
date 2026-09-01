import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InvestmentsRepository } from './investments.repository';
import { Investment } from '../models/investment/investment.model';
import { DailyRecord, DailyStats } from '../models/investment/daily-record.model';
import { DashboardFilter } from '../models/dashboard/dashboard-filter.model';
import { DashboardSummary } from '../models/dashboard/dashboard-summary.model';
import { InvestmentSummary } from '../models/investment/investment-summary.model';
import { InvestmentTipo } from '../models/investment/investment-tipo.model';


@Injectable()
export class MockInvestmentsRepository implements InvestmentsRepository {
  private readonly investments: Investment[] = [
    {
      id: 1,
      nombre: 'Fiducuenta para personas como yo ',
      entidad: 'Bancolombia banco de colomnbiadadf',
      tipo: 'fondo-inversion',
      moneda: 'COP',
      activa: true,
      fechaCreacion: '2023-01-01',
    },
    {
      id: 2,
      nombre: 'CDT Bancolombia',
      entidad: 'Bancolombia',
      tipo: 'cdt',
      moneda: 'COP',
      activa: true,
      fechaCreacion: '2023-01-01',
    },
    {
      id: 3,
      nombre: 'Acciones de Ecopetrol',
      entidad: 'BVC',
      tipo: 'acciones',
      moneda: 'COP',
      activa: true,
      fechaCreacion: '2023-01-01',
    },
    {
      id: 4,
      nombre: 'Acciones de Ecopetrol',
      entidad: 'BVC',
      tipo: 'acciones',
      moneda: 'COP',
      activa: true,
      fechaCreacion: '2023-01-01',
    },
    {
      id: 5,
      nombre: 'Acciones de Ecopetrol',
      entidad: 'BVC',
      tipo: 'acciones',
      moneda: 'COP',
      activa: true,
      fechaCreacion: '2023-01-01',
    },
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
    return of({
      valorTotal: 0,
      gananciaPeriodo: 0,
      promedioDiario: 0,
      eaPonderada: 0,
    });
  }

  investmentSummaries(): Observable<InvestmentSummary[]> {
  return of(
    this.investments.map((inv) => ({
      investmentId: inv.id,
      saldoTotal: 114989765,
      saldoDisponible: 110678654,
      gananciaMes: 450987,
      promedioRentabilidadDiaria: 20675,
      aportesRetirosNetos: 12309776,
      tasaMensual: 1.23,
      tasaEA: 17.56,
      fechaUltimoRegistro: null,
    }))
    );
  }

  investmentSummary(investmentId: number): Observable<InvestmentSummary> {
  return of(
    this.investments
      .map((inv) => ({ 
        investmentId: inv.id,
        saldoTotal: 0,
        saldoDisponible: 0,
        gananciaMes: 0,
        promedioRentabilidadDiaria: 0,
        aportesRetirosNetos: 0,
        tasaMensual: 0,
        tasaEA: 0,
        fechaUltimoRegistro: null 
      }))
      .find((s) => s.investmentId === investmentId) ?? {
      investmentId,
      saldoTotal: 0,
      saldoDisponible: 0,
      gananciaMes: 0,
      promedioRentabilidadDiaria: 0,
      aportesRetirosNetos: 0,
      tasaMensual: 0,
      tasaEA: 0,
      fechaUltimoRegistro: null,
    }
  );
}
}