import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CurrencyCoPipe } from '../../../shared/pipes/currency-co.pipe';
import { PercentCoPipe } from '../../../shared/pipes/percent-co.pipe';
import { RelativeDateCoPipe } from '../../../shared/pipes/relative-date-co.pipe';
import { INVESTMENT_TIPO_LABELS } from '../../../core/models/investment/investment-tipo.model';
import { InvestmentsRepository } from '../../../core/repositories/investments.repository';
import { Investment } from '../../../core/models/investment/investment.model';
import { daysAgo, daysSinceIso, toISODate } from '../../../core/utils/date.util';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SparklineComponent } from '../../../shared/components/sparkline/sparkline.component';
import { InvestmentSummary } from '../../../core/models/investment/investment-summary.model';

@Component({
  selector: 'app-investment-card',
  imports: [IconComponent, SparklineComponent, CurrencyCoPipe, PercentCoPipe, RelativeDateCoPipe],
  templateUrl: './investment-card.component.html',
  styleUrl: './investment-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentCardComponent {
  investment = input.required<Investment>();
  summary = input<InvestmentSummary>();

  private readonly repository = inject(InvestmentsRepository);

  protected readonly tipoLabel = computed(() => {
    const tipo = this.investment().tipo;
    return tipo ? INVESTMENT_TIPO_LABELS[tipo] : null;
  });

  protected readonly isStale = computed(() => {
    const fecha = this.summary()?.fechaUltimoRegistro;
    if (!fecha) return false;
    return daysSinceIso(fecha) > 2;
  });

  // ── Sparkline ──────────────────────────────────────────────────────────
  //
  // CORRECCIÓN: antes era toSignal(toObservable(this.investment).pipe(...)),
  // el MISMO patrón que tumbó el Sidebar en InvestmentsComponent. La única
  // diferencia era el momento del fallo (toObservable emite de forma
  // asíncrona, no en el constructor), por eso el síntoma se veía distinto
  // y aparecía de forma inconsistente entre recargas — pero seguía siendo
  // el mismo error de diseño: un observable que puede fallar, sin que el
  // componente tenga un estado explícito para ese fallo.
  //
  // rxResource con `params` reacciona a que cambie investment().id (por si
  // Angular reutiliza esta instancia de tarjeta para otra inversión), y
  // captura el error en vez de dejarlo escapar. records() sigue lanzando
  // "Method not implemented" — correcto, ese endpoint no existe todavía —
  // pero ahora es un estado del recurso, no una excepción huérfana.
  // protected readonly recordsRes = rxResource({
  //   params: () => this.investment().id,
  //   stream: ({ params: investmentId }) => {
  //     const to = toISODate(new Date());
  //     const from = toISODate(daysAgo(30));
  //     return this.repository.records(investmentId, from, to);
  //   },
  //   defaultValue: [] as { valorUnidad: number }[],
  // });

  // Igual que en InvestmentsComponent: hasValue() SIEMPRE antes de leer
  // .value(). defaultValue no protege una vez que el recurso entra en
  // estado de error persistente — solo cubre el instante inicial.
  // private readonly sparklineRecords = computed(() =>
  //   this.recordsRes.hasValue() ? this.recordsRes.value() : [],
  // );

  // protected readonly sparklineValues = computed(() =>
  //   this.sparklineRecords()
  //     .map((r) => r.valorUnidad)
  //     .filter((v): v is number => v !== undefined),
  // );

  // protected readonly sparklineTone = computed<'profit' | 'loss' | 'neutral'>(() => {
  //   const values = this.sparklineValues();
  //   if (values.length < 2) return 'neutral';
  //   const first = values[0]!;
  //   const last = values[values.length - 1]!;
  //   if (last > first) return 'profit';
  //   if (last < first) return 'loss';
  //   return 'neutral';
  // });
}