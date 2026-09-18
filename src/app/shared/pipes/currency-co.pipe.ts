import { inject, Pipe, PipeTransform } from '@angular/core';
import { PrivacyService } from '../../core/services/privacy.service';

@Pipe({ name: 'currencyCo', standalone: true })
export class CurrencyCoPipe implements PipeTransform {
  
  private readonly privacy = inject(PrivacyService);

  transform(value: number | null | undefined, forceSign = false): string {
    if (this.privacy.hidden()) return '• • • •';
    if (value === null || value === undefined) return '—';

    if (value === null || value === undefined || Number.isNaN(value)) return '$ 0';
    const rounded = Math.round(value);
    const abs = Math.abs(rounded).toLocaleString('es-CO');
    if (rounded < 0) return `- $ ${abs}`;
    if (forceSign && rounded > 0) return `+ $ ${abs}`;
    return `$ ${abs}`;
  }
}