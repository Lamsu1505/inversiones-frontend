import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InvestmentSummary } from '../../../../core/models/investment/investment-summary.model';
import { CurrencyCoPipe } from '../../../../shared/pipes/currency-co.pipe';
import { PercentCoPipe } from '../../../../shared/pipes/percent-co.pipe';

@Component({
  selector: 'app-portfolio-summary',
  imports: [CurrencyCoPipe, PercentCoPipe],
  templateUrl: './portfolio-summary.component.html',
  styleUrl: './portfolio-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSummaryComponent {
  /** Resúmenes ya resueltos por el contenedor. undefined mientras cargan. */
  readonly summaries = input<InvestmentSummary[] | undefined>();

  private readonly conDatos = computed(() =>
    (this.summaries() ?? []).filter((s) => s.gananciaMes !== null)
  );

  protected readonly gananciaMes = computed(() => {
    const items = this.conDatos();
    return items.length
      ? items.reduce((acc, s) => acc + (s.gananciaMes ?? 0), 0)
      : null;
  });

  protected readonly promedioDiario = computed(() => {
    const items = this.summaries()?.filter(
      (s) => s.promedioRentabilidadDiaria !== null
    ) ?? [];
    return items.length
      ? items.reduce((acc, s) => acc + (s.promedioRentabilidadDiaria ?? 0), 0)
      : null;
  });

  /** Tasa mensual del portafolio: ganancia total / saldo total. Fracción. */
  protected readonly tasaMensual = computed(() => {
    const ganancia = this.gananciaMes();
    if (ganancia === null) return null;

    const saldo = this.conDatos()
      .reduce((acc, s) => acc + (s.saldoTotal ?? 0), 0);

    return saldo > 0 ? ganancia / saldo : null;
  });

  protected readonly tasaEA = computed(() => {
    const mensual = this.tasaMensual();
    return mensual === null ? null : Math.pow(1 + mensual, 12) - 1;
  });

  protected readonly hayDatos = computed(() => this.conDatos().length > 0);
}