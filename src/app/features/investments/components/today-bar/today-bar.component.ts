import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Investment } from '../../../../core/models/investment/investment.model';
import { InvestmentSummary } from '../../../../core/models/investment/investment-summary.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyCoPipe } from '../../../../shared/pipes/currency-co.pipe';

@Component({
  selector: 'app-today-bar',
  imports: [IconComponent, CurrencyCoPipe],
  templateUrl: './today-bar.component.html',
  styleUrl: './today-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodayBarComponent {
  readonly investments = input<Investment[]>([]);
  readonly summaries = input<InvestmentSummary[] | undefined>();

  /** El padre hace el scroll: la barra solo avisa a cuál. */
  readonly irA = output<number>();

  /** Solo las activas: una inversión dada de baja no se registra. */
  private readonly activas = computed(() =>
    this.investments().filter((i) => i.activa),
  );

  private readonly summaryById = computed(() => {
    const map = new Map<number, InvestmentSummary>();
    for (const s of this.summaries() ?? []) map.set(s.investmentId, s);
    return map;
  });

  protected readonly fechaHoy = computed(() =>
    new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }),
  );

  protected readonly total = computed(() => this.activas().length);

  protected readonly registradas = computed(() =>
    this.activas().filter(
      (i) => this.summaryById().get(i.id)?.tieneRegistroHoy,
    ).length,
  );

  protected readonly completo = computed(
    () => this.total() > 0 && this.registradas() === this.total(),
  );

  protected readonly progresoPct = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.registradas() / this.total()) * 100),
  );

  /** Suma de las ganancias de hoy. null si ninguna tiene dato. */
  protected readonly gananciaHoy = computed(() => {
    const valores = this.activas()
      .map((i) => this.summaryById().get(i.id)?.gananciaHoy)
      .filter((g): g is number => g != null);

    return valores.length ? valores.reduce((a, g) => a + g, 0) : null;
  });

  /** Primera activa sin registro de hoy, para el scroll. */
  private readonly pendiente = computed(() =>
    this.activas().find(
      (i) => !this.summaryById().get(i.id)?.tieneRegistroHoy,
    ) ?? null,
  );

  protected onIr(): void {
    const inv = this.pendiente();
    if (inv) this.irA.emit(inv.id);
  }

  protected signoClase(valor: number | null): string {
    if (valor == null) return 'is-empty';
    if (valor > 0) return 'is-profit';
    if (valor < 0) return 'is-loss';
    return '';
  }
}