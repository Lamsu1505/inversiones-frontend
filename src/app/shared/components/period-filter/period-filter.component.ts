import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
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
  protected readonly filterService = inject(DashboardFilterService);
  private readonly investmentsRepository = inject(InvestmentsRepository);

  protected readonly presets: PresetOption[] = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'este-mes', label: 'Este mes' },
    { value: 'ultimos-3-meses', label: 'Últimos 3 meses' },
    { value: 'ano-actual', label: 'Año actual' },
    { value: 'historico', label: 'Historico' },
  ];

  // CORRECCIÓN: antes era toSignal(this.investmentsRepository.list(), {...}),
  // una suscripción DIRECTA y SÍNCRONA a un observable del repository en el
  // inicializador de campo — el mismo molde exacto del bug que tumbó el
  // Sidebar. Hoy no fallaba porque list() funciona contra el backend real,
  // pero el día que ese endpoint falle, esto habría lanzado dentro del
  // constructor y roto este componente entero. Se corrige ahora, antes de
  // que vuelva a doler.
  protected readonly investmentsRes = rxResource({
    stream: () => this.investmentsRepository.list(),
    defaultValue: [] as Investment[],
  });

  protected readonly investments = computed(() =>
    this.investmentsRes.hasValue() ? this.investmentsRes.value() : [],
  );

  protected readonly allInvestmentsLabel = computed(
    () => `Todas las inversiones (${this.investments().length})`,
  );

  protected selectPreset(preset: PeriodPreset): void {
    this.filterService.setPreset(preset);
  }

  protected onInvestmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterService.setInvestment(value === 'all' ? null : Number(value));
  }
}