import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { InvestmentsRepository } from '../../../core/repositories/investments.repository';
import { Investment } from '../../../core/models/investment/investment.model';
import { InvestmentSummary } from '../../../core/models/investment/investment-summary.model';
import { InvestmentCardComponent } from '../card/investment-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { toUserMessage } from '../../../core/errors/error-message.util';

type StatusFilter = 'activas' | 'inactivas' | 'todas';
type SortOption = 'nombre' | 'saldo' | 'rentabilidad' | 'actualizacion';

@Component({
  selector: 'app-investments',
  imports: [InvestmentCardComponent, IconComponent],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentsComponent {
  private readonly repository = inject(InvestmentsRepository);

  // ── Datos remotos ─────────────────────────────────────────────────────

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
  protected readonly sortBy = signal<SortOption>('nombre');

  protected readonly activeCount = computed(() => this.investments().filter((i) => i.activa).length);
  protected readonly inactiveCount = computed(() => this.investments().filter((i) => !i.activa).length);
  protected readonly totalCount = computed(() => this.investments().length);

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