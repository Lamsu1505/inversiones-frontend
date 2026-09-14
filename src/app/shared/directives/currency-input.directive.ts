import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Formatea un input de texto como moneda es-CO mientras se escribe
 * (1.234.567) y expone al formulario un number limpio.
 *
 * Uso: <input type="text" inputmode="decimal" appCurrencyInput
 *              formControlName="saldoTotal" />
 */
@Directive({
  selector: 'input[appCurrencyInput]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
    '(blur)': 'onTouched()',
  },
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CurrencyInputDirective),
    multi: true,
  }],
})
export class CurrencyInputDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private onChange: (value: number | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.el.nativeElement.value = value == null ? '' : this.format(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.nativeElement.disabled = disabled;
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Dígitos a la izquierda del cursor: es lo que sobrevive al reformateo.
    const digitosAntes = this.contarDigitos(
      input.value.slice(0, input.selectionStart ?? 0)
    );

    const numero = this.parse(input.value);
    const formateado = numero == null ? '' : this.format(numero);

    input.value = formateado;
    this.reposicionarCursor(input, digitosAntes);

    this.onChange(numero);
  }

  /** Separador de miles es-CO, decimales solo si el usuario los escribió. */
  private format(value: number): string {
    const [entera, decimal] = String(value).split('.');
    const conPuntos = new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0,
    }).format(Number(entera));

    return decimal ? `${conPuntos},${decimal}` : conPuntos;
  }

  private parse(texto: string): number | null {
    // Quita puntos de miles, deja la coma decimal como punto.
    const limpio = texto.replace(/\./g, '').replace(',', '.');
    const soloValidos = limpio.replace(/[^\d.]/g, '');

    if (!soloValidos) return null;

    const n = Number(soloValidos);
    return Number.isFinite(n) ? n : null;
  }

  private contarDigitos(texto: string): number {
    return (texto.match(/[\d,]/g) ?? []).length;
  }

  private reposicionarCursor(input: HTMLInputElement, digitos: number): void {
    let pos = 0;
    let contados = 0;

    while (pos < input.value.length && contados < digitos) {
      if (/[\d,]/.test(input.value[pos]!)) contados++;
      pos++;
    }

    input.setSelectionRange(pos, pos);
  }
}