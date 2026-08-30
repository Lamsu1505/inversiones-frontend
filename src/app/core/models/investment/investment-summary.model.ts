export interface InvestmentSummary {
  investmentId: number;
  saldoTotal: number;
  saldoDisponible: number;
  gananciaMes: number;                 // rentabilidad absoluta del mes, puede ser negativa
  promedioRentabilidadDiaria: number;  // promedio diario del mes, en pesos
  aportesRetirosNetos: number;          // suma de movimientos del mes; + aporte, - retiro
  tasaMensual: number;                  // %, ej. 0.72 = 0,72%
  tasaEA: number;                       // %
  fechaUltimoRegistro: string | null;   // 'YYYY-MM-DD' — null si aún no hay ningún registro
}