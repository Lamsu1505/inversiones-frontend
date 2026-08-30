// Esta clase funciona como "Contrato" para el registro diario, definiendo los 
// atributos que debe tener un objeto de tipo DailyRecord.

export interface DailyRecord {
  id?: number;
  investmentId: number;
  fecha: string;
  valorUnidad?: number;
  cantidadUnidades?: number;
  saldoDisponible: number;
  saldoTotal: number;
  movimiento: number;
  nota?: string;
}

export interface DailyStats extends DailyRecord {
  valorUnidadPrev: number | null;
  deltaUnidad: number | null;
  variacionPct: number | null;
  gananciaDia: number | null;
}