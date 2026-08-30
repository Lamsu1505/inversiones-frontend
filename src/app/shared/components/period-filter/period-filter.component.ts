import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardFilterService, PeriodPreset } from '../../../core/services/dashboard-filter.service';
import { InvestmentsRepository } from '../../../core/repositories/investments.repository';
import { Investment } from '../../../core/models/investment/investment.model';

interface PresetOption {
  value: PeriodPreset;
  label: string;
}

@Component({
  selector: 'app-period-filter',
  templateUrl: './period-filter.component.html',
  styleUrl: './period-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodFilterComponent {
  // Se expone el propio servicio al template para leer .filter() y .activePreset()
  // directamente en el HTML, sin duplicar esos signals aquí como @Input.
  protected readonly filterService = inject(DashboardFilterService);
  private readonly investmentsRepository = inject(InvestmentsRepository);

  protected readonly presets: PresetOption[] = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'este-mes', label: 'Este mes' },
    { value: 'ultimos-3-meses', label: 'Últimos 3 meses' },
    { value: 'ano-actual', label: 'Año actual' },
    { value: 'historico', label: 'Historico' },
  ];

  // Convierte el Observable del repository en un Signal.
  // Mientras no haya respuesta, el template ve una lista vacía (sin errores).
  protected readonly investments = toSignal(this.investmentsRepository.list(), {
    initialValue: [] as Investment[],
  });

  // Texto para el placeholder "Todas las inversiones (4)" — se recalcula
  // solo cuando cambia la lista de inversiones, no en cada render.
  protected readonly allInvestmentsLabel = computed(
    () => `Todas las inversiones (${this.investments().length})`
  );

  protected selectPreset(preset: PeriodPreset): void {
    this.filterService.setPreset(preset);
  }

  protected onInvestmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterService.setInvestment(value === 'all' ? null : Number(value));
  }
}