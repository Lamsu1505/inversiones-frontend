import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Investment } from '../../../../core/models/investment/investment.model';
import { InvestmentsRepository } from '../../../../core/repositories/investments.repository';
import { toUserMessage } from '../../../../core/errors/error-message.util';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyCoPipe } from '../../../../shared/pipes/currency-co.pipe';

@Component({
  selector: 'app-deactivate-modal',
  imports: [IconComponent, CurrencyCoPipe],
  templateUrl: './deactivate-modal.component.html',
  styleUrls: ['../../../../shared/styles/modal.css', './deactivate-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeactivateModalComponent {
  private readonly repository = inject(InvestmentsRepository);
  private readonly destroyRef = inject(DestroyRef);

  readonly investment = input.required<Investment>();
  /** Saldo del último registro, para advertir si todavía tiene plata. */
  readonly saldoActual = input<number | null>(null);

  readonly cerrar = output<void>();
  readonly confirmado = output<Investment>();

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected confirmar(): void {
    this.guardando.set(true);
    this.error.set(null);

    this.repository
      .changeInvestmentStatus(this.investment().id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (inv) => {
          this.guardando.set(false);
          this.confirmado.emit(inv);
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(toUserMessage(err));
        },
      });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrar.emit();
  }

  protected onEscape(): void {
    this.cerrar.emit();
  }
}