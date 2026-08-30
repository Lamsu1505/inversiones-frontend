import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentCo', standalone: true })
export class PercentCoPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2, forceSign = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '0,00%';
    const rounded = Number(value.toFixed(decimals));
    const formatted = Math.abs(rounded).toFixed(decimals).replace('.', ','); // es-CO: coma
    if (rounded < 0) return `-${formatted}%`;
    if (forceSign && rounded > 0) return `+${formatted}%`;
    return `${formatted}%`;
  }
}