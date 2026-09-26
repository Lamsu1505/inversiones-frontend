import { Pipe, PipeTransform } from '@angular/core';

const MISMO_ANIO = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });
const OTRO_ANIO = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric', month: 'long', year: 'numeric',
});

/** 'YYYY-MM-DD' → '20 de septiembre' (con el año si no es el actual). */
@Pipe({ name: 'dateCo' })
export class DateCoPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return '—';

    // Fecha LOCAL, no new Date(iso): esa interpreta el texto como UTC y en
    // Bogotá (UTC-5) mostraría el día anterior. Mismo bug que evita toISODate.
    const fecha = new Date(y, m - 1, d);
    const formato = y === new Date().getFullYear() ? MISMO_ANIO : OTRO_ANIO;
    return formato.format(fecha);
  }
}