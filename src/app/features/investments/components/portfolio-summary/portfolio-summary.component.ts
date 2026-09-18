import {
  ChangeDetectionStrategy, Component, computed, input, signal, OnDestroy,
} from '@angular/core';
import { InvestmentSummary } from '../../../../core/models/investment/investment-summary.model';
import { PortfolioReference } from '../../../../core/models/portfolio-reference.model';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';
import { CurrencyCoPipe } from '../../../../shared/pipes/currency-co.pipe';
import { PercentCoPipe } from '../../../../shared/pipes/percent-co.pipe';

/** Milisegundos que la cara trasera permanece visible sin interacción. */
const FLIP_TIMEOUT_MS = 3000;

type KpiId = 'ganancia' | 'ea' | 'portafolio';;

@Component({
  selector: 'app-portfolio-summary',
  imports: [IconComponent, CurrencyCoPipe, PercentCoPipe],
  templateUrl: './portfolio-summary.component.html',
  styleUrl: './portfolio-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioSummaryComponent implements OnDestroy {
  readonly summaries = input<InvestmentSummary[] | undefined>();
  readonly reference = input<PortfolioReference | undefined>();

  

  /** Qué tarjeta está volteada. Solo una a la vez. */
  private readonly flipped = signal<KpiId | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  protected isFlipped(id: KpiId): boolean {
    return this.flipped() === id;
  }

  protected toggleFlip(id: KpiId): void {
    clearTimeout(this.timer);

    if (this.flipped() === id) {
      this.flipped.set(null);
      return;
    }

    this.flipped.set(id);
    this.timer = setTimeout(() => this.flipped.set(null), FLIP_TIMEOUT_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  // ---- Cara frontal -------------------------------------------------

  private readonly conDatos = computed(() =>
    (this.summaries() ?? []).filter((s) => s.gananciaMes !== null)
  );

  protected readonly saldoTotal = computed(() => {
    const items = (this.summaries() ?? []).filter((s) => s.saldoTotal !== null);
    return items.length
      ? items.reduce((acc, s) => acc + (s.saldoTotal ?? 0), 0)
      : null;
  });

  protected readonly gananciaMes = computed(() => {
    const items = this.conDatos();
    return items.length
      ? items.reduce((acc, s) => acc + (s.gananciaMes ?? 0), 0)
      : null;
  });

  protected readonly promedioDiario = computed(() => {
    const items = (this.summaries() ?? [])
      .filter((s) => s.promedioRentabilidadDiaria !== null);
    return items.length
      ? items.reduce((acc, s) => acc + (s.promedioRentabilidadDiaria ?? 0), 0)
      : null;
  });

  /** Tasa mensual del portafolio: ganancia total / saldo total. Fracción. */
  protected readonly tasaMensual = computed(() => {
    const ganancia = this.gananciaMes();
    if (ganancia === null) return null;
    const saldo = this.conDatos().reduce((acc, s) => acc + (s.saldoTotal ?? 0), 0);
    return saldo > 0 ? ganancia / saldo : null;
  });

  protected readonly tasaEA = computed(() => {
    const mensual = this.tasaMensual();
    return mensual === null ? null : Math.pow(1 + mensual, 12) - 1;
  });

  // ---- Cara trasera -------------------------------------------------

  /** Días transcurridos del mes en curso, incluyendo hoy. */
  protected readonly diasDelMes = computed(() => new Date().getDate());

  /** Ganancia esperada a esta altura del mes, según los últimos 3 meses. */
  private readonly gananciaEsperada = computed(() => {
    const diaria = this.reference()?.gananciaDiaria3m;
    return diaria == null ? null : diaria * this.diasDelMes();
  });

  protected readonly deltaGanancia = computed(() => {
    const actual = this.gananciaMes();
    const esperada = this.gananciaEsperada();
    return actual === null || esperada === null ? null : actual - esperada;
  });

  /** EA histórica escalada a los mismos días que lleva el mes actual. */
  private readonly eaHistorica = computed(() => {
    const diaria = this.reference()?.tasaDiariaHist;
    if (diaria == null) return null;
    return Math.pow(1 + diaria * this.diasDelMes(), 12) - 1;
  });

  /** Diferencia en puntos porcentuales (como fracción, para el pipe). */
  protected readonly deltaEA = computed(() => {
      const actual = this.tasaEA();
      const hist = this.eaHistorica();
      return actual === null || hist === null ? null : actual - hist;
  });
  
  
  /** Crecimiento acumulado: histórico + lo del mes en curso. */
  protected readonly gananciaTotal = computed(() => {
    const hist = this.reference()?.gananciaHistorica;
    const mes = this.gananciaMes();
    console.log('hist', hist, 'mes', mes);

    if (hist == null && mes === null) return null;
    return (hist ?? 0);
  });

  // ---- Helpers de presentación --------------------------------------

  protected signoClase(valor: number | null): string {
    if (valor === null) return 'portfolio-summary__value--empty';
    if (valor > 0) return 'portfolio-summary__value--profit';
    if (valor < 0) return 'portfolio-summary__value--loss';
    return '';
  }

  protected readonly icons: Record<string, IconName> = {
    saldo: 'chart',
    ganancia: 'trending',
    promedio: 'calculator',
    mensual: 'history',
    ea: 'arrow-up',
  };
}