import { inject, Pipe, PipeTransform } from '@angular/core';
import { PrivacyService } from '../../core/services/privacy.service';

@Pipe({ name: 'currencyCo', pure: false })
export class CurrencyCoPipe implements PipeTransform {
  private readonly privacy = inject(PrivacyService);

  transform(value: number | null | undefined, forceSign = false): string {
    // Sin dato (o un número inválido) → guion. Nunca un $ 0 inventado.
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    if (this.privacy.ocultarMontos()) return '* * * * *';

    const rounded = Math.round(value);
    const abs = Math.abs(rounded).toLocaleString('es-CO');
    if (rounded < 0) return `- $ ${abs}`;
    if (forceSign && rounded > 0) return `+ $ ${abs}`;
    return `$ ${abs}`;
  }
}