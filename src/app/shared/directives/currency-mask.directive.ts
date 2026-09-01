import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

/**
 * Enmascara un <input type="text"> para que muestre separadores de miles
 * es-CO ("2.550.000") mientras el FormControl subyacente sigue guardando un
 * número puro (2550000).
 *
 * Por qué no un pipe: un pipe transforma en una sola dirección para MOSTRAR
 * un valor ya cerrado (ver CurrencyCoPipe). Acá el usuario está escribiendo
 * en vivo — hace falta interceptar el evento 'input', separar dígitos de
 * formato, y devolver al FormControl solo el número. Eso es trabajo de un
 * ControlValueAccessor, no de un pipe.
 *
 * Por qué type="text" y no type="number": un input nativo type="number" no
 * puede mostrar puntos de miles — el navegador interpreta '.' como separador
 * decimal y rechaza o corrompe el valor. inputmode="numeric" en el template
 * conserva el teclado numérico en móvil sin necesidad de type="number".
 *
 * Uso:
 *   <input type="text" inputmode="numeric" formControlName="montoInicial" appCurrencyMask />
 */
@Directive({
  selector: '[appCurrencyMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true,
    },
  ],
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  private readonly formatter = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  });

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('input', ['$event'])
  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart ?? input.value.length;

    // Cuántos DÍGITOS (no caracteres) había antes del cursor, en el valor
    // tal como estaba justo antes de reformatear. Esto es lo que hay que
    // preservar — no la posición de caracter, porque los puntos de miles
    // se mueven de lugar en cada tecla.
    const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/\D/g, '').length;

    const digitsOnly = input.value.replace(/\D/g, '');
    const numericValue = digitsOnly ? Number(digitsOnly) : 0;
    const formatted = digitsOnly ? this.formatter.format(numericValue) : '';

    input.value = formatted;
    input.setSelectionRange(
      ...this.cursorAfterNDigits(formatted, digitsBeforeCursor),
    );

    this.onChange(numericValue);
  }

  @HostListener('blur')
  protected onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    const numeric = value ?? 0;
    this.el.nativeElement.value = numeric ? this.formatter.format(numeric) : '';
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  /** Recorre el string ya formateado y ubica el índice justo después del
   *  n-ésimo dígito, para que el cursor quede anclado al mismo dígito que
   *  el usuario estaba editando, sin importar cuántos puntos se insertaron
   *  o quitaron alrededor. */
  private cursorAfterNDigits(formatted: string, n: number): [number, number] {
    if (n === 0) return [0, 0];

    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        seen++;
        if (seen === n) return [i + 1, i + 1];
      }
    }
    return [formatted.length, formatted.length];
  }
}