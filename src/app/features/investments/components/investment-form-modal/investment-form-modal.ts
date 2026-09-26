import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit,
  computed, effect, inject, input, output, signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Investment } from '../../../../core/models/investment/investment.model';
import { InvestmentInput } from '../../../../core/models/investment/investment-form.model';
import { InvestmentsRepository } from '../../../../core/repositories/investments.repository';
import { toISODate } from '../../../../core/utils/date.util';
import { toUserMessage } from '../../../../core/errors/error-message.util';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { DateCoPipe } from '../../../../shared/pipes/date-co.pipe';

const MONEDAS = ['COP', 'USD', 'EUR'] as const;

@Component({
  selector: 'app-investment-form-modal',
  imports: [ReactiveFormsModule, IconComponent, DateCoPipe],
  templateUrl: './investment-form-modal.component.html',
  styleUrls: ['../../../../shared/styles/modal.css', './investment-form-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentFormModalComponent implements OnInit {
  private readonly repository = inject(InvestmentsRepository);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  /** null = crear una inversión nueva; una inversión = editarla. */
  readonly investment = input<Investment | null>(null);

  readonly cerrar = output<void>();
  readonly guardado = output<Investment>();

  protected readonly monedas = MONEDAS;
  protected readonly textoMax = 30;
  protected readonly hoy = toISODate(new Date());

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)]],
    entidad: ['', Validators.maxLength(30)],
    tipo: ['', Validators.required],
    moneda: ['COP' as string, Validators.required],
    fechaApertura: [this.hoy, Validators.required],
    rastreaValorUnidad: [false],
    rastreaSaldoDisponible: [false],
  });

  /** Copia de los valores del form: los computed no reaccionan a FormControl. */
  protected readonly valores = signal(this.form.getRawValue());

  protected readonly esEdicion = computed(() => this.investment() !== null);
  protected readonly titulo = computed(() => this.investment()?.nombre ?? 'Registrar inversión');

  protected readonly tiposRes = rxResource({
    stream: () => this.repository.investmentTypes(),
  });

  /** Solo al editar. Si no hay inversión, el resource no hace ninguna petición. */
  protected readonly limitesRes = rxResource({
    params: () => this.investment()?.id,
    stream: ({ params: id }) => this.repository.editConstraints(id),
  });

  /** Rastrea valor de unidad, ya hay datos de unidades: no se puede desmarcar. */
  protected readonly bloqueoUnidad = computed(() =>
    !!this.investment()?.rastreaValorUnidad &&
    this.limitesRes.value()?.puedeDesactivarValorUnidad === false,
  );

  protected readonly bloqueoDisponible = computed(() =>
    !!this.investment()?.rastreaSaldoDisponible &&
    this.limitesRes.value()?.puedeDesactivarSaldoDisponible === false,
  );

  protected readonly limiteApertura = computed(
    () => this.limitesRes.value()?.fechaAperturaMaxima ?? null,
  );

  /** La fecha de apertura no puede pasar de hoy ni del primer registro o movimiento. */
  protected readonly fechaMax = computed(() => {
    const limite = this.limiteApertura();
    return limite !== null && limite < this.hoy ? limite : this.hoy;
  });

  protected readonly nombreLength = computed(() => this.valores().nombre.length);
  protected readonly entidadLength = computed(() => this.valores().entidad.length);

  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  constructor() {
    // Los bloqueos llegan del backend después de abrir el modal. Cuando
    // llegan, se deshabilitan las casillas que no se pueden desmarcar.
    effect(() => {
      const c = this.form.controls;
      if (this.bloqueoUnidad()) c.rastreaValorUnidad.disable({ emitEvent: false });
      if (this.bloqueoDisponible()) c.rastreaSaldoDisponible.disable({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    const inv = this.investment();
    if (!inv) return;

    this.form.patchValue({
      nombre: inv.nombre,
      entidad: inv.entidad ?? '',
      tipo: inv.tipo ?? '',
      moneda: inv.moneda,
      fechaApertura: inv.fechaApertura,
      rastreaValorUnidad: inv.rastreaValorUnidad,
      rastreaSaldoDisponible: inv.rastreaSaldoDisponible,
    });
    this.form.controls.moneda.disable();   // la moneda nunca cambia al editar
    this.onAnyInput();
  }

  protected onAnyInput(): void {
    this.valores.set(this.form.getRawValue());
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // getRawValue, no value: los controles deshabilitados (la moneda al
    // editar, las casillas bloqueadas) NO aparecen en .value.
    const v = this.form.getRawValue();
    const entidad = v.entidad.trim();
    const input: InvestmentInput = {
      nombre: v.nombre.trim(),
      ...(entidad ? { entidad } : {}),
      tipo: v.tipo,
      moneda: v.moneda,
      fechaApertura: v.fechaApertura,
      rastreaValorUnidad: v.rastreaValorUnidad,
      rastreaSaldoDisponible: v.rastreaSaldoDisponible,
    };

    const inv = this.investment();
    const peticion = inv
      ? this.repository.updateInvestment(inv.id, input)
      : this.repository.createInvestment(input);

    this.guardando.set(true);
    this.errorGuardar.set(null);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        this.guardado.emit(resultado);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorGuardar.set(toUserMessage(err));
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