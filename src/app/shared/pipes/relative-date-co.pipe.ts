import { Pipe, PipeTransform } from '@angular/core';
import { daysSinceIso } from '../../core/utils/date.util';

@Pipe({ name: 'relativeDateCo', standalone: true })
export class RelativeDateCoPipe implements PipeTransform {
  transform(isoDate: string | null | undefined): string {
    if (!isoDate) return 'Sin registros';
    const days = daysSinceIso(isoDate);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
  }
}