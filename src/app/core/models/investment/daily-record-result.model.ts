/** Lo que el backend devuelve tras guardar: la ganancia ya calculada. */
export interface DailyRecordResult {
  gananciaDia: number | null;
  variacionPct: number | null;
}