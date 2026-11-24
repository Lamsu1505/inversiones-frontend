import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, output, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CurrencyCoPipe } from '../../../shared/pipes/currency-co.pipe';
import { PercentCoPipe } from '../../../shared/pipes/percent-co.pipe';
import { RelativeDateCoPipe } from '../../../shared/pipes/relative-date-co.pipe';
import { INVESTMENT_TIPO_LABELS } from '../../../core/models/investment/investment-tipo.model';
import { InvestmentsRepository } from '../../../core/repositories/investments.repository';
import { Investment } from '../../../core/models/investment/investment.model';
import { daysAgo, daysSinceIso, monthsAgo, toISODate } from '../../../core/utils/date.util';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SparklineComponent } from '../../../shared/components/sparkline/sparkline.component';
import { InvestmentSummary } from '../../../core/models/investment/investment-summary.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-investment-card',
  imports: [IconComponent, CurrencyCoPipe, PercentCoPipe, RelativeDateCoPipe , RouterLink],
  templateUrl: './investment-card.component.html',
  styleUrl: './investment-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentCardComponent {

  readonly investment = input.required<Investment>();
  readonly summary = input<InvestmentSummary | undefined>();

  readonly reactivar = output<Investment>();

  private readonly repository = inject(InvestmentsRepository);

  protected readonly tipoLabel = computed(() => {
    const tipo = this.investment().tipo;
    return tipo ? INVESTMENT_TIPO_LABELS[tipo] : null;
  });

  protected signoClase(valor: number | null | undefined): string {
    if (valor == null) return 'is-empty';
    if (valor > 0) return 'is-profit';
    if (valor < 0) return 'is-loss';
    return '';
  }

  protected readonly isStale = computed(() => {
    // Una inversión dada de baja ya no se registra: nunca está "atrasada".
    if (!this.investment().activa) return false;
    const fecha = this.summary()?.fechaUltimoRegistro;
    if (!fecha) return false;
    return daysSinceIso(fecha) > 2;
  });

  readonly agregarDia = output<Investment>();


  /** Contenedor del botón ⋮ y su menú, para detectar clics fuera. */
  private readonly menuWrap = viewChild<ElementRef<HTMLElement>>('menuWrap');

  protected readonly menuAbierto = signal(false);

  readonly movimiento = output<Investment>();
  readonly editar = output<Investment>();
  readonly darDeBaja = output<Investment>();

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected elegir(accion: 'movimiento' | 'editar' | 'darDeBaja' | 'reactivar'): void {
    this.menuAbierto.set(false);
    const inv = this.investment();
    switch (accion) {
      case 'movimiento': this.movimiento.emit(inv); break;
      case 'editar':     this.editar.emit(inv); break;
      case 'darDeBaja':  this.darDeBaja.emit(inv); break;
      case 'reactivar':  this.reactivar.emit(inv); break;
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto()) return;
    const wrap = this.menuWrap()?.nativeElement;
    if (wrap && !wrap.contains(event.target as Node)) {
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
    protected onEscape(): void {
      this.menuAbierto.set(false);
    }

    
}