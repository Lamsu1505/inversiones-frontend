import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PeriodFilterComponent } from '../../shared/components/period-filter/period-filter.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { DashboardFilterService } from '../../core/services/dashboard-filter.service';
import { InvestmentsRepository } from '../../core/repositories/investments.repository';
import { DashboardSummary } from '../../core/models/dashboard/dashboard-summary.model';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { InvestmentCardComponent } from '../investments/card/investment-card.component';

@Component({
  selector: 'app-dashboard',
  imports: [PeriodFilterComponent, KpiCardComponent, InvestmentCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly filterService = inject(DashboardFilterService);
  private readonly investmentsRepository = inject(InvestmentsRepository);

  // Cada vez que el filtro cambia (preset o inversión), se vuelve a pedir el resumen.
  protected readonly summary = toSignal(
  toObservable(this.filterService.filter).pipe(
    switchMap((filter) => this.investmentsRepository.dashboardSummary(filter))
  )
  );

  protected readonly formattedValorTotal = computed(() =>
    this.formatCurrency(this.summary()?.valorTotal ?? 0)
  );

  protected readonly formattedGanancia = computed(() =>
    this.formatCurrency(this.summary()?.gananciaPeriodo ?? 0)
  );

  protected readonly formattedPromedioDiario = computed(() =>
    this.formatCurrency(this.summary()?.promedioDiario ?? 0)
  );

  protected readonly formattedEa = computed(() => {
    const ea = this.summary()?.eaPonderada ?? 0;
    return `${ea.toFixed(2).replace('.', ',')}% EA`;
  });

  private formatCurrency(value: number): string {
    // es-CO: "$ 1.234.567" — punto de miles, sin decimales, espacio tras el símbolo.
    return `$ ${Math.round(value).toLocaleString('es-CO')}`;
  }
}