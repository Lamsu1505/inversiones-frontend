import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { InvestmentsRepository } from '../../../core/repositories/investments.repository';
import { Investment } from '../../../core/models/investment/investment.model';
import { InvestmentSummary } from '../../../core/models/investment/investment-summary.model';
import { InvestmentCardComponent } from '../card/investment-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { toUserMessage } from '../../../core/errors/error-message.util';
import { CurrencyCoPipe } from '../../../shared/pipes/currency-co.pipe';
import { PortfolioSummaryComponent } from '../components/portfolio-summary/portfolio-summary.component';
import { DailyRecordInput } from '../../../core/models/investment/daily-record-form.model';
import { DailyRecordModalComponent } from '../components/daily-record-modal/daily-record-modal.component';
import { DailyRecordResult } from '../../../core/models/investment/daily-record-result.model';


type StatusFilter = 'activas' | 'inactivas' | 'todas';
type SortOption = 'nombre' | 'saldo' | 'rentabilidad' | 'actualizacion';

@Component({
  selector: 'app-investments',
  imports: [InvestmentCardComponent, IconComponent, PortfolioSummaryComponent, DailyRecordModalComponent],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentsComponent {
  private readonly repository = inject(InvestmentsRepository);

  // ── Datos remotos ─────────────────────────────────────────────────────

  protected readonly referenceRes = rxResource({
    stream: () => this.repository.portfolioReference(),
  });

  protected readonly investmentsRes = rxResource({
    stream: () => this.repository.list(),
    defaultValue: [] as Investment[],
  });

  protected readonly summariesRes = rxResource({
    stream: () => this.repository.investmentSummaries(),
    defaultValue: [] as InvestmentSummary[],
  });

  private readonly investments = computed(() =>
    this.investmentsRes.hasValue() ? this.investmentsRes.value() : [],
  );

  private readonly summaries = computed(() =>
    this.summariesRes.hasValue() ? this.summariesRes.value() : [],
  );

  protected readonly gananciaTotalMes = computed(() => {
    if (!this.summariesRes.hasValue()) return null;

    const valores = this.summariesRes.value()
      .map((s) => s.gananciaMes)
      .filter((g): g is number => g !== null);

    // Sin ninguna ganancia calculable, no hay total — no un cero.
    return valores.length > 0
      ? valores.reduce((acc, g) => acc + g, 0)
      : null;
});

  /** isLoading() y no status()==='loading': un reintento reporta 'reloading'. */
  protected readonly isLoading = computed(() => this.investmentsRes.isLoading());

  protected readonly loadError = computed(() => {
    const error = this.investmentsRes.error();
    return error ? toUserMessage(error) : null;
  });

  /** Aviso discreto: las tarjetas se ven, pero sin métricas. */
  protected readonly summariesError = computed(() => {
    const error = this.summariesRes.error();
    return error ? toUserMessage(error) : null;
  });

  protected retryInvestments(): void {
    this.investmentsRes.reload();
  }

  protected retrySummaries(): void {
    this.summariesRes.reload();
  }

  // Mapa por id para lookup O(1) al renderizar y al ordenar.
  private readonly summariesById = computed(() => {
    const map = new Map<number, InvestmentSummary>();
    for (const s of this.summaries()) map.set(s.investmentId, s);
    return map;
  });

  /** Lookup O(1) — vacío mientras carga o si falló. */
  protected readonly summaryById = computed(() => {
    const map = new Map<number, InvestmentSummary>();
    if (this.summariesRes.hasValue()) {
      for (const s of this.summariesRes.value()) {
        map.set(s.investmentId, s);
      }
    }
    return map;
  });

  // ── Estado de la UI: filtro, búsqueda, orden ──────────────────────────

  protected readonly statusFilter = signal<StatusFilter>('activas');
  protected readonly searchQuery = signal('');
  protected readonly sortBy = signal<SortOption>('saldo');

  protected readonly activeCount = computed(() => this.investments().filter((i) => i.activa).length);
  protected readonly inactiveCount = computed(() => this.investments().filter((i) => !i.activa).length);
  protected readonly totalCount = computed(() => this.investments().length);


  protected readonly errorGuardar = signal<string | null>(null);
  protected readonly modalInvestment = signal<Investment | null>(null);
  protected readonly guardandoDia = signal(false);
  protected readonly resultadoDia = signal<DailyRecordResult | null>(null);

  protected abrirModal(inv: Investment): void {
    this.resultadoDia.set(null);   // limpia el resultado del día anterior
    this.modalInvestment.set(inv);
  }

  protected cerrarModal(): void {
    this.modalInvestment.set(null);
    this.resultadoDia.set(null);
    this.errorGuardar.set(null);
  }

  protected onGuardarDia(input: DailyRecordInput): void {
    this.guardandoDia.set(true);
    this.errorGuardar.set(null);

    this.repository.saveRecords(input.investmentId, [input]).subscribe({
      next: (guardados) => {
        this.guardandoDia.set(false);

        const r = guardados[0];
        if (r) {
          this.resultadoDia.set({
            gananciaDia: r.gananciaDia ?? null,
            variacionPct: r.variacionPct ?? null,
          });
        }

        // Los datos cambiaron: el resumen y la referencia ya no son válidos.
        this.summariesRes.reload();
        this.referenceRes.reload();
      },
      error: (err) => {
        this.guardandoDia.set(false);
        this.errorGuardar.set(toUserMessage(err));
      },
    });
  }

  
  protected readonly visibleInvestments = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    const status = this.statusFilter();

    const summariesById = this.summariesById();

    const filtered = this.investments().filter((inv) => {
      if (status === 'activas' && !inv.activa) return false;
      if (status === 'inactivas' && inv.activa) return false;
      if (query) {
        const haystack = `${inv.nombre} ${inv.entidad ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => this.compare(a, b, summariesById));
  });

  /**
   * "Sin resultados por el filtro/búsqueda" — DISTINTO de "no hay ninguna
   * inversión creada". Solo tiene sentido evaluarlo una vez que la carga
   * terminó sin error; antes de eso, "vacío" no significa nada todavía.
   */
  protected readonly hasNoResults = computed(
    () => !this.isLoading() && !this.loadError() && this.visibleInvestments().length === 0,
  );

  // ── Acciones de la UI ─────────────────────────────────────────────────

  protected setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onSortChange(event: Event): void {
    this.sortBy.set((event.target as HTMLSelectElement).value as SortOption);
  }

  protected summaryFor(investmentId: number): InvestmentSummary | undefined {
    return this.summariesById().get(investmentId);
  }

  protected createInvestment(): void {
    console.log('Abrir modal de nueva inversión — pendiente');
  }

  private compare(a: Investment, b: Investment, summariesById: Map<number, InvestmentSummary>): number {
    switch (this.sortBy()) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre, 'es');
      case 'saldo':
        return (summariesById.get(b.id)?.saldoTotal ?? 0) - (summariesById.get(a.id)?.saldoTotal ?? 0);
      case 'rentabilidad':
        return (summariesById.get(b.id)?.gananciaMes ?? 0) - (summariesById.get(a.id)?.gananciaMes ?? 0);
      case 'actualizacion': {
        const fechaA = summariesById.get(a.id)?.fechaUltimoRegistro ?? '';
        const fechaB = summariesById.get(b.id)?.fechaUltimoRegistro ?? '';
        return fechaB.localeCompare(fechaA);
      }
    }
  }
}