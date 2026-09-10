import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentCo', standalone: true })
export class PercentCoPipe implements PipeTransform {
  transform(value: number | null | undefined, forceSign = false, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';

  // El backend entrega fracción decimal (0.024 = 2,4%). La conversión
  // a porcentaje ocurre únicamente acá.
  const pct = value * 100;

  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(pct));
  const sign = pct < 0 ? '-' : forceSign ? '+' : '';
  return `${sign}${formatted}%`;
}
}