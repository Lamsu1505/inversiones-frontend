import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCo', standalone: true })
export class CurrencyCoPipe implements PipeTransform {
  transform(value: number | null | undefined, forceSign = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '$ 0';
    const rounded = Math.round(value);
    const abs = Math.abs(rounded).toLocaleString('es-CO');
    if (rounded < 0) return `- $ ${abs}`;
    if (forceSign && rounded > 0) return `+ $ ${abs}`;
    return `$ ${abs}`;
  }
}