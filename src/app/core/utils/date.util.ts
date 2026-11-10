export function toISODate(date: Date): string {
  // un día en zonas horarias negativas como Bogotá (UTC-5).
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgo(days: number, from: Date = new Date()): Date {
  const result = new Date(from);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * La misma fecha, n meses atrás. Si ese día no existe en el mes destino
 * (31 de mayo → 31 de febrero), usa el último día de ese mes.
 */
export function monthsAgo(n: number, desde: Date = new Date()): Date {
  const destino = new Date(desde.getFullYear(), desde.getMonth() - n, 1);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(desde.getDate(), ultimoDia));
  return destino;
}

/** Días calendario completos desde una fecha ISO ('YYYY-MM-DD') hasta hoy. */
export function daysSinceIso(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number);
  const recordDate = new Date(year, month - 1, day);
  recordDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((today.getTime() - recordDate.getTime()) / msPerDay);
}