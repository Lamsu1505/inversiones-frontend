import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';

import { Investment } from '../../../../core/models/investment/investment.model';
import {
  Movement, MovementInput, MovementTipo,
} from '../../../../core/models/investment/movement.model';
import { InvestmentsRepository } from '../../../../core/repositories/investments.repository';
import { toISODate } from '../../../../core/utils/date.util';
import { toUserMessage } from '../../../../core/errors/error-message.util';
import { CurrencyCoPipe } from '../../../../shared/pipes/currency-co.pipe';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyInputDirective } from '../../../../shared/directives/currency-input.directive';
import { INVESTMENT_TIPO_LABELS } from '../../../../core/models/investment/investment-tipo.model';
import { DateCoPipe } from '../../../../shared/pipes/date-co.pipe';

@Component({
  selector: 'app-movement-modal',
  imports: [ReactiveFormsModule, CurrencyCoPipe, IconComponent, CurrencyInputDirective, DateCoPipe],
  templateUrl: './movement-modal.component.html',
  styleUrls: ['../../../../shared/styles/modal.css', './movement-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementModalComponent {
  private readonly repository = inject(InvestmentsRepository);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly investment = input.required<Investment>();

  /** Cierra el modal. */
  readonly cerrar = output<void>();
  /** Se guardó o borró un movimiento: el contenedor recarga los resúmenes. */
  readonly cambio = output<void>();

  protected readonly hoy = toISODate(new Date());

  protected readonly form = this.fb.group({
    tipo: this.fb.control<MovementTipo>('aporte'),
    fecha: this.fb.control(this.hoy, Validators.required),
    monto: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    reflejado: this.fb.control(false),
    nota: this.fb.control('', Validators.maxLength(120)),
  });

  /** Últimos 5 movimientos de esta inversión, para ver y borrar. */
  protected readonly recientesRes = rxResource({
    params: () => this.investment().id,
    stream: ({ params: id }) => this.repository.recentMovements(id),
  });

  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);
  /** Id del último guardado, para resaltarlo en la lista. */
  protected readonly ultimoGuardadoId = signal<number | null>(null);

  /** Id del movimiento que está pidiendo confirmación de borrado. */
  protected readonly confirmandoId = signal<number | null>(null);
  protected readonly eliminandoId = signal<number | null>(null);
  protected readonly errorEliminar = signal<string | null>(null);

  protected readonly esRetiro = computed(() => this.valores().tipo === 'retiro');

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const nota = v.nota.trim();
    const input: MovementInput = {
      tipo: v.tipo,
      fecha: v.fecha,
      monto: v.monto!,                         // el validador required garantiza que no es null
      reflejadoEnSaldo: v.reflejado,
      ...(nota ? { nota } : {}),               // nota vacía no viaja
    };

    this.guardando.set(true);
    this.errorGuardar.set(null);

    this.repository
      .createMovement(this.investment().id, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mov: Movement) => {
          this.guardando.set(false);
          this.ultimoGuardadoId.set(mov.id);
          // Se conservan tipo y fecha por si registras otro del mismo tipo.
          this.form.patchValue({ monto: null, reflejado: false, nota: '' });
          this.form.markAsUntouched();
            this.onAnyInput();
            this.mensajeOk.set(mov.tipo === 'aporte' ? 'Aporte guardado.' : 'Retiro guardado.');
          this.recientesRes.reload();
          this.cambio.emit();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorGuardar.set(toUserMessage(err));
        },
      });
  }

    protected readonly notaMax = 120;

    /** Copia de los valores del form: los computed no reaccionan a FormControl. */
    protected readonly valores = signal(this.form.getRawValue());
    protected readonly mensajeOk = signal<string | null>(null);

    protected readonly tipoLabel = computed(() => {
    const tipo = this.investment().tipo;
    return tipo ? INVESTMENT_TIPO_LABELS[tipo] : null;
    });
    protected readonly esHoy = computed(() => this.valores().fecha === this.hoy);
    protected readonly notaLength = computed(() => this.valores().nota.length);
    protected readonly etiquetaGuardar = computed(() =>
    this.valores().tipo === 'aporte' ? 'Guardar aporte' : 'Guardar retiro',
    );

    protected onAnyInput(): void {
    this.valores.set(this.form.getRawValue());
    this.mensajeOk.set(null);               // al empezar otro, se borra el "guardado"
    }

    protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrar.emit();
    }

    protected onEscape(): void {
    this.cerrar.emit();
    }

    /** Los retiros se muestran en negativo; el monto guardado siempre es positivo. */
    protected montoConSigno(m: Movement): number {
    return m.tipo === 'retiro' ? -m.monto : m.monto;
    }

  protected pedirConfirmacion(id: number): void {
    this.errorEliminar.set(null);
    this.confirmandoId.set(id);
  }

  protected cancelarConfirmacion(): void {
    this.confirmandoId.set(null);
  }

  protected eliminar(id: number): void {
    this.eliminandoId.set(id);
    this.errorEliminar.set(null);

    this.repository
      .deleteMovement(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.eliminandoId.set(null);
          this.confirmandoId.set(null);
          if (this.ultimoGuardadoId() === id) this.ultimoGuardadoId.set(null);
          this.recientesRes.reload();
          this.cambio.emit();
        },
        error: (err) => {
          this.eliminandoId.set(null);
          this.errorEliminar.set(toUserMessage(err));
        },
      });
  }
}