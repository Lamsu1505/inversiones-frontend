import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { CurrencyMaskDirective } from '../../shared/directives/currency-mask.directive';
import { NoScrollChangeDirective } from '../../shared/directives/no-scroll-change.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CurrencyCoPipe } from '../../shared/pipes/currency-co.pipe';
import { PercentCoPipe } from '../../shared/pipes/percent-co.pipe';

/** Momento en que se hace el aporte dentro de cada mes. */
export type TipoAporte = 'vencido' | 'anticipado';

/** Una fila de la proyección año por año. */
export interface FilaProyeccion {
  anio: number;
  capital: number;
  intereses: number;
  saldo: number;
}

/** Tope defensivo: evita que un tecleo accidental genere miles de filas. */
const MAX_ANIOS = 100;

/**
 * Calculadora de interés compuesto.
 *
 * NOTA SOBRE EL PRINCIPIO #6 (los cálculos financieros viven en el backend):
 * este componente es una excepción deliberada y acotada. Todos sus insumos los
 * escribe el usuario en el formulario; no lee ni deriva nada de datos
 * persistidos, y su resultado no se reconcilia contra ninguna vista de
 * PostgreSQL. Es una calculadora de bolsillo con las fórmulas del dominio.
 *
 * La frontera es el ORIGEN del dato, no la fórmula: el día que la calculadora
 * reciba como entrada una inversión real, ese cálculo se va al backend.
 */
@Component({
  selector: 'app-calculator',
  imports: [ReactiveFormsModule, IconComponent, CurrencyCoPipe, PercentCoPipe, CurrencyMaskDirective , NoScrollChangeDirective],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    montoInicial: [0, [Validators.required, Validators.min(0)]],
    aporteMensual: [0, [Validators.required, Validators.min(0)]],
    tipoAporte: ['vencido' as TipoAporte, Validators.required],
    tasaEA: [10, [Validators.required, Validators.min(0)]],
    anios: [10, [Validators.required, Validators.min(0), Validators.max(MAX_ANIOS)]],
  });

  /**
   * `valueChanges` de un FormGroup emite el valor parcial; `getRawValue()`
   * devuelve el objeto completo y tipado. Se combinan para que la señal
   * siempre tenga la forma entera del formulario.
   */
  private readonly valores = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  /**
   * Entradas ya normalizadas. Un `<input type="number">` vacío emite `null` en
   * tiempo de ejecución aunque el tipo diga `number`, así que se sanean aquí y
   * el resto de los cálculos puede asumir números finitos y no negativos.
   */
  private readonly entrada = computed(() => {
    const v = this.valores();
    return {
      p: this.saneado(v.montoInicial),
      a: this.saneado(v.aporteMensual),
      anticipado: v.tipoAporte === 'anticipado',
      ea: this.saneado(v.tasaEA) / 100,
      anios: Math.min(this.saneado(v.anios), MAX_ANIOS),
    };
  });

  // ── Resultados principales ────────────────────────────────────────────────

  /** Tasa efectiva MENSUAL equivalente: i = (1 + EA)^(1/12) − 1 */
  protected readonly tasaMensual = computed(() => Math.pow(1 + this.entrada().ea, 1 / 12) - 1);

  /** La misma tasa en puntos porcentuales, para el PercentCoPipe. */
  protected readonly tasaMensualPct = computed(() => this.tasaMensual() * 100);

  /** n = años × 12 */
  protected readonly meses = computed(() => Math.round(this.entrada().anios * 12));

  protected readonly valorFuturo = computed(() => this.valorFuturoEn(this.meses()));

  protected readonly capitalAportado = computed(
    () => this.entrada().p + this.entrada().a * this.meses(),
  );

  protected readonly interesesGanados = computed(
    () => this.valorFuturo() - this.capitalAportado(),
  );

  protected readonly multiplicador = computed(() => {
    const capital = this.capitalAportado();
    return capital > 0 ? this.valorFuturo() / capital : 0;
  });

  /**
   * El multiplicador no es moneda ni porcentaje, así que no le aplica el
   * principio #20 (formato vía pipes). Se formatea aquí con locale es-CO.
   */
  protected readonly multiplicadorTexto = computed(
    () =>
      new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(this.multiplicador()) + '×',
  );

  // ── Barra de proporción ───────────────────────────────────────────────────

  protected readonly porcentajeCapital = computed(() => {
    const vf = this.valorFuturo();
    if (vf <= 0) return 0;
    return this.clamp((this.capitalAportado() / vf) * 100, 0, 100);
  });

  protected readonly porcentajeIntereses = computed(() => 100 - this.porcentajeCapital());

  /** Hay algo que graficar: evita pintar una barra vacía sin datos. */
  protected readonly hayResultado = computed(() => this.valorFuturo() > 0);

  // ── Proyección año por año ────────────────────────────────────────────────

  protected readonly proyeccion = computed<FilaProyeccion[]>(() => {
    const n = this.meses();
    if (n <= 0) return [];

    const { p, a } = this.entrada();
    const totalAnios = Math.ceil(n / 12);
    const filas: FilaProyeccion[] = [];

    for (let anio = 1; anio <= totalAnios; anio++) {
      // El último año puede ser parcial (ej. 2,5 años → 30 meses).
      const m = Math.min(n, anio * 12);
      const saldo = this.valorFuturoEn(m);
      const capital = p + a * m;
      filas.push({ anio, capital, intereses: saldo - capital, saldo });
    }

    return filas;
  });

  // ── Acciones ──────────────────────────────────────────────────────────────

  protected restablecer(): void {
    this.form.reset();
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  /**
   * Valor futuro evaluado en `m` meses. Es la misma función que usan tanto la
   * cifra principal como cada fila de la tabla, para que nunca puedan
   * divergir.
   *
   *   VF1 = P × (1 + i)^m
   *   VF2 = A × [ ((1 + i)^m − 1) / i ]        (anualidad vencida)
   *   VF2 × (1 + i)                            (si el aporte es anticipado)
   */
  private valorFuturoEn(m: number): number {
    if (m <= 0) return this.entrada().p;

    const { p, a, anticipado } = this.entrada();
    const i = this.tasaMensual();
    const factor = Math.pow(1 + i, m);

    const vf1 = p * factor;

    // Con i ≈ 0 la fórmula de la anualidad divide por cero; el límite es A × m.
    let vf2 = Math.abs(i) < 1e-12 ? a * m : a * ((factor - 1) / i);
    if (anticipado) vf2 *= 1 + i;

    return vf1 + vf2;
  }

  private saneado(valor: unknown): number {
    const n = Number(valor);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private clamp(valor: number, min: number, max: number): number {
    return Math.min(Math.max(valor, min), max);
  }
}