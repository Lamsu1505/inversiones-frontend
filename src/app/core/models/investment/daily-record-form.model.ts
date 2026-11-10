export interface DailyRecordInput {
  investmentId: number;
  fecha: string;
  valorUnidad?: number;
  cantidadUnidades?: number;
  saldoDisponible?: number;
  saldoTotal: number;          
  nota?: string;
}

/** Los campos de un día sin el id de la inversión: lo que acepta el backend en el body. */
export type DailyRecordFields = Omit<DailyRecordInput, 'investmentId'>;