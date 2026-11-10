/** Resumen de un mes de una inversión, tal como lo manda /monthly-summaries. */
export interface MonthlySummary {
  mes: string;                          // primer día del mes: 'YYYY-MM-01'
  gananciaMes: number | null;
  promedioDiario: number | null;
  aportesRetirosNetos: number | null;   // null = sin movimientos ese mes
  tasaMensual: number | null;           // fracción
  tasaEA: number | null;                // fracción
  saldoCierre: number;
  fechaUltimoRegistro: string;
  saldoPromedio: number | null;
}