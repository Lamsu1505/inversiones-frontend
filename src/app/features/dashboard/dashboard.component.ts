import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PeriodFilterComponent } from '../../shared/components/period-filter/period-filter.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { DashboardFilterService } from '../../core/services/dashboard-filter.service';
import { InvestmentsRepository } from '../../core/repositories/investments.repository';
import { InvestmentCardComponent } from '../investments/card/investment-card.component';
import { toUserMessage } from '../../core/errors/error-message.util';

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

  // ── Resumen del período ───────────────────────────────────────────────
  //
  // CORRECCIÓN: antes era toSignal(toObservable(filter).pipe(switchMap(...)))
  // SIN defaultValue y SIN guardia de error — el mismo patrón que tumbó el
  // Sidebar y, después, el sparkline. Aquí la víctima colateral era
  // PeriodFilterComponent, hermano en el mismo template: cuando el error
  // llegaba (de forma asíncrona, vía el effect() de toObservable) y algún
  // computed leía summary() sin protección, la detección de cambios de esa
  // pasada se corrompía para ambos componentes, no solo para este.
  //
  // `params` reacciona a cambios del filtro (preset o inversión elegida);
  // sin defaultValue a propósito — no hay un "cero por defecto" honesto
  // para un resumen financiero que no se ha podido cargar.
  protected readonly summaryRes = rxResource({
    params: () => this.filterService.filter(),
    stream: ({ params: filter }) => this.investmentsRepository.dashboardSummary(filter),
  });

  private readonly summaryData = computed(() =>
    this.summaryRes.hasValue() ? this.summaryRes.value() : null,
  );

  protected readonly isLoadingSummary = computed(() => this.summaryRes.isLoading());

  protected readonly summaryError = computed(() => {
    const error = this.summaryRes.error();
    return error ? toUserMessage(error) : null;
  });

  protected readonly gananciaTone = computed<'profit' | 'loss'>(() => {
    const s = this.summaryData();
    return (s?.gananciaPeriodo ?? 0) >= 0 ? 'profit' : 'loss';
  });

  protected retrySummary(): void {
    this.summaryRes.reload();
  }

  // Guion, no $0: un resumen que no cargó no es un resumen en cero. Mismo
  // principio ya aplicado en InvestmentCardComponent — nunca fabricar un
  // valor que se vea como dato real cuando en realidad no se tiene.
  protected readonly formattedValorTotal = computed(() => {
    const s = this.summaryData();
    return s ? this.formatCurrency(s.valorTotal) : '—';
  });

  protected readonly formattedGanancia = computed(() => {
    const s = this.summaryData();
    return s ? this.formatCurrency(s.gananciaPeriodo) : '—';
  });

  protected readonly formattedPromedioDiario = computed(() => {
    const s = this.summaryData();
    return s ? this.formatCurrency(s.promedioDiario) : '—';
  });

  protected readonly formattedEa = computed(() => {
    const s = this.summaryData();
    if (!s) return '— EA';
    return `${s.eaPonderada.toFixed(2).replace('.', ',')}% EA`;
  });

  private formatCurrency(value: number): string {
    return `$ ${Math.round(value).toLocaleString('es-CO')}`;
  }
}