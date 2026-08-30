import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { InvestmentsRepository } from '../../../core/repositories/investments.repository';
import { Investment } from '../../../core/models/investment/investment.model';
import { InvestmentSummary } from '../../../core/models/investment/investment-summary.model';
import { InvestmentCardComponent } from '../card/investment-card.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

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

  // --- Datos crudos: una sola petición de cada uno, sin importar cuántas tarjetas haya ---
  private readonly investments = toSignal(this.repository.list(), {
    initialValue: [] as Investment[],
  });

  private readonly summaries = toSignal(this.repository.investmentSummaries(), {
    initialValue: [] as InvestmentSummary[],
  });

  // Mapa por id para lookup O(1) al renderizar y al ordenar, en vez de
  // recorrer el arreglo de summaries por cada inversión (que sería O(n²)).
  private readonly summariesById = computed(() => {
    const map = new Map<number, InvestmentSummary>();
    for (const s of this.summaries()) map.set(s.investmentId, s);
    return map;
  });

  // --- Estado de la UI: filtro, búsqueda, orden ---
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
    // TODO(modal): reemplazar por apertura del modal de creación (Especs.md sección 16).
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
        return fechaB.localeCompare(fechaA); // más reciente primero
      }
    }
  }
}