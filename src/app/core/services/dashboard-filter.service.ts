// core/services/dashboard-filter.service.ts
import { Injectable, signal } from '@angular/core';
import { DashboardFilter } from '../models/dashboard-filter.model';

export type PeriodPreset =
  | 'hoy'
  | 'esta-semana'
  | 'este-mes'
  | 'ultimos-3-meses'
  | 'ano-actual'
  | 'historico'
  | 'personalizado';

@Injectable({ providedIn: 'root' })
export class DashboardFilterService {

  private readonly _filter = signal<DashboardFilter>(this.buildPresetRange('este-mes'));
  private readonly _activePreset = signal<PeriodPreset>('este-mes');

  // Expuesto hacia afuera como solo-lectura: nadie fuera del servicio
  // puede llamar .set() directamente sobre estos — deben usar los métodos de abajo.
  readonly filter = this._filter.asReadonly();
  readonly activePreset = this._activePreset.asReadonly();

  /** Cambia el rango a un preset predefinido (Hoy, Este mes, etc.) */
  setPreset(preset: PeriodPreset): void {
    if (preset === 'personalizado') {
      // "Personalizado" no calcula fechas por sí solo — espera setCustomRange().
      this._activePreset.set(preset);
      return;
    }

    const { from, to } = this.buildPresetRange(preset);
    this._activePreset.set(preset);
    this._filter.update((current) => ({ ...current, from, to }));
  }

  /** Establece un rango manual, cuando el usuario usa "Personalizado". */
  setCustomRange(from: string, to: string): void {
    this._activePreset.set('personalizado');
    this._filter.update((current) => ({ ...current, from, to }));
  }

  /** Cambia la inversión seleccionada; null = todas las inversiones. */
  setInvestment(investmentId: number | null): void {
    this._filter.update((current) => ({ ...current, investmentId }));
  }

  private buildPresetRange(preset: PeriodPreset): DashboardFilter {
    const today = new Date();
    const currentFilter = this._filter?.() ?? { from: '', to: '', investmentId: null };

    let from: Date;
    let to: Date = today;

    switch (preset) {
      case 'esta-semana':
        from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        break;
      case 'este-mes':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'ultimos-3-meses':
        from = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case 'ano-actual':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case 'historico':
        from = new Date(2000, 0, 1); // límite arbitrario "desde siempre"
        break;
      default:
        from = today;
    }

    return {
      from: this.toISODate(from),
      to: this.toISODate(to),
      investmentId: currentFilter.investmentId,
    };
  }

  private toISODate(date: Date): string {
    // Evita usar toISOString() directo: eso convierte a UTC y puede
    // correr la fecha un día según la zona horaria del navegador.
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}