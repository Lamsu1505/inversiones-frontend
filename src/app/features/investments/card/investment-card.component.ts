import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
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
  summary = input.required<InvestmentSummary>(); 

  private readonly repository = inject(InvestmentsRepository);

  protected readonly tipoLabel = computed(() => {
    const tipo = this.investment().tipo;
    return tipo ? INVESTMENT_TIPO_LABELS[tipo] : null;
  });

  protected readonly isStale = computed(() => {
    const fecha = this.summary().fechaUltimoRegistro;
    if (!fecha) return false;
    return daysSinceIso(fecha) > 2;
  });

  // El sparkline sigue siendo responsabilidad local de la tarjeta — ver nota arriba.
  private readonly sparklineRecords = toSignal(
    toObservable(this.investment).pipe(
      switchMap((inv) => {
        const to = toISODate(new Date());
        const from = toISODate(daysAgo(30));
        return this.repository.records(inv.id, from, to);
      })
    ),
    { initialValue: [] }
  );

  protected readonly sparklineValues = computed(() =>
    this.sparklineRecords()
      .map((r) => r.valorUnidad)
      .filter((v): v is number => v !== undefined)
  );

  protected readonly sparklineTone = computed<'profit' | 'loss' | 'neutral'>(() => {
    const values = this.sparklineValues();
    if (values.length < 2) return 'neutral';
    const first = values[0]!;
    const last = values[values.length - 1]!;
    if (last > first) return 'profit';
    if (last < first) return 'loss';
    return 'neutral';
  });
}