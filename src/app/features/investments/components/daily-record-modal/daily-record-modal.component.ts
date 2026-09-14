import {
  ChangeDetectionStrategy, Component, computed, effect, inject,
  input, output, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

import { InvestmentsRepository } from '../../../../core/repositories/investments.repository';
import { Investment } from '../../../../core/models/investment/investment.model';
import { DailyRecordInput } from '../../../../core/models/investment/daily-record-form.model';
import { DailyRecordResult } from '../../../../core/models/investment/daily-record-result.model';
import { INVESTMENT_TIPO_LABELS } from '../../../../core/models/investment/investment-tipo.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyInputDirective } from '../../../../shared/directives/currency-input.directive';
import { CurrencyCoPipe } from '../../../../shared/pipes/currency-co.pipe';
import { PercentCoPipe } from '../../../../shared/pipes/percent-co.pipe';
import { toISODate } from '../../../../core/utils/date.util';

const NOTA_MAX = 120;

@Component({
  selector: 'app-daily-record-modal',
  imports: [
    ReactiveFormsModule, IconComponent, CurrencyInputDirective,
    CurrencyCoPipe, PercentCoPipe,
  ],
  templateUrl: './daily-record-modal.component.html',
  styleUrl: './daily-record-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyRecordModalComponent {
  readonly investment = input.required<Investment>();
  /** Resultado del guardado. Mientras sea null, el bloque no se muestra. */
  readonly resultado = input<DailyRecordResult | null>(null);
  readonly guardando = input(false);

  readonly cerrar = output<void>();
  readonly guardar = output<DailyRecordInput>();
  readonly errorGuardar = input<string | null>(null); 

  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(InvestmentsRepository);

  protected readonly hoy = toISODate(new Date());
  protected readonly notaMax = NOTA_MAX;

  /** Último registro, para los deltas. null si la inversión no tiene ninguno. */
  protected readonly lastRes = rxResource({
    params: () => this.investment().id,
    stream: ({ params: id }) => this.repository.lastRecord(id),
  });

  private readonly last = computed(() =>
    this.lastRes.hasValue() ? this.lastRes.value() : null,
  );

  protected readonly form = this.fb.group({
    fecha: [this.hoy, [Validators.required]],
    saldoTotal: [null as number | null, [Validators.required, Validators.min(0)]],
    saldoDisponible: [null as number | null],
    valorUnidad: [null as number | null],
    cantidadUnidades: [null as number | null],
    nota: ['', [Validators.maxLength(NOTA_MAX)]],
  });

  // ── Etiquetas del header ────────────────────────────────────────────

  protected readonly tipoLabel = computed(() => {
    const tipo = this.investment().tipo;
    return tipo ? INVESTMENT_TIPO_LABELS[tipo] : null;
  });

  protected readonly esHoy = computed(() => this.form.controls.fecha.value === this.hoy);

  // ── Duplicado ───────────────────────────────────────────────────────

  private readonly fechaSignal = signal(this.hoy);
  protected readonly fechaDuplicada = computed(() => {
    const ultima = this.last()?.fecha;
    return !!ultima && this.fechaSignal() === ultima;
  });

  constructor() {
    this.form.controls.fecha.valueChanges.subscribe((f) =>
      this.fechaSignal.set(f ?? ''),
    );

    // Los campos que la inversión no rastrea se desactivan: así no viajan
    // valores que el backend rechazaría con un 400.
    effect(() => {
      const inv = this.investment();
      const c = this.form.controls;

      inv.rastreaValorUnidad
        ? (c.valorUnidad.enable({ emitEvent: false }),
           c.cantidadUnidades.enable({ emitEvent: false }))
        : (c.valorUnidad.disable({ emitEvent: false }),
           c.cantidadUnidades.disable({ emitEvent: false }));

      inv.rastreaSaldoDisponible
        ? c.saldoDisponible.enable({ emitEvent: false })
        : c.saldoDisponible.disable({ emitEvent: false });
    });
  }

  // ── Deltas contra el último registro ────────────────────────────────

  private delta(actual: number | null, anterior: number | null | undefined): number | null {
    return actual == null || anterior == null ? null : actual - anterior;
  }

  private readonly valores = signal(this.form.getRawValue());

  protected readonly deltaSaldoTotal = computed(() =>
    this.delta(this.valores().saldoTotal, this.last()?.saldoTotal),
  );

  protected readonly deltaSaldoDisponible = computed(() =>
    this.delta(this.valores().saldoDisponible, this.last()?.saldoDisponible),
  );

  protected readonly deltaValorUnidad = computed(() =>
    this.delta(this.valores().valorUnidad, this.last()?.valorUnidad),
  );

  protected readonly deltaUnidades = computed(() =>
    this.delta(this.valores().cantidadUnidades, this.last()?.cantidadUnidades),
  );

  /** Sin cambio es distinto de sin dato: el texto debe diferenciarlo. */
  protected readonly sinCambioUnidades = computed(() => this.deltaUnidades() === 0);

  protected readonly notaLength = computed(() => this.valores().nota?.length ?? 0);

  protected signoClase(valor: number | null): string {
    if (valor == null || valor === 0) return 'delta--neutral';
    return valor > 0 ? 'delta--profit' : 'delta--loss';
  }

  // ── Acciones ────────────────────────────────────────────────────────

  protected onSubmit(): void {
    if (this.form.invalid || this.fechaDuplicada() || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const inv = this.investment();

    this.guardar.emit({
      investmentId: inv.id,
      fecha: v.fecha!,
      saldoTotal: v.saldoTotal!,
      // Omitidos, nunca en 0: un cero fabricado se lee como dato real.
      ...(v.saldoDisponible != null ? { saldoDisponible: v.saldoDisponible } : {}),
      ...(v.valorUnidad != null ? { valorUnidad: v.valorUnidad } : {}),
      ...(v.cantidadUnidades != null ? { cantidadUnidades: v.cantidadUnidades } : {}),
      ...(v.nota?.trim() ? { nota: v.nota.trim() } : {}),
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cerrar.emit();
  }

  protected onEscape(): void {
    this.cerrar.emit();
  }

  /** Refresca los signals de valores en cada tecla, para los deltas. */
  protected onAnyInput(): void {
    this.valores.set(this.form.getRawValue());
  }
}