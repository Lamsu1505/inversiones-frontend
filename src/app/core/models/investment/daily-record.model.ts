// Esta clase funciona como "Contrato" para el registro diario, definiendo los 
// atributos que debe tener un objeto de tipo DailyRecord.

export interface DailyRecord {
  id?: number;
  investmentId: number;
  fecha: string;
  valorUnidad: number;
  cantidadUnidades?: number;
  saldoDisponible: number;
  saldoTotal: number;
  movimiento: number;
  nota?: string;
}

export interface DailyRecordDetail {
  id: number;
  investmentId: number;
  fecha: string;
  valorUnidad: number | null;
  cantidadUnidades: number | null;
  saldoDisponible: number | null;
  saldoTotal: number;
  nota: string | null;
  gananciaDia?: number | null;
  variacionPct?: number | null;
  movimientosPendientes?: number | null; 
}

/** Un día registrado, con lo que calcula v_daily_stats. */
export interface DailyStats {
  id: number;
  fecha: string;                     // 'YYYY-MM-DD'
  saldoTotal: number;
  saldoDisponible: number | null;
  valorUnidad: number | null;        // null si la inversión no lo rastrea
  cantidadUnidades: number | null;
  nota: string | null;
  movimientoNeto: number;            // la vista usa COALESCE: nunca null
  gananciaDia: number | null;        // null en el primer registro histórico
  deltaValorUnidad: number | null;
  variacionPct: number | null;       // fracción
  anterior: RegistroAnterior | null;
}

/** El registro inmediatamente anterior a un día (para los deltas al editar). */
export interface RegistroAnterior {
  fecha: string;
  saldoTotal: number;
  saldoDisponible: number | null;
  valorUnidad: number | null;
  cantidadUnidades: number | null;
}