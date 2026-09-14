export interface DailyRecordInput {
  investmentId: number;
  fecha: string;
  valorUnidad?: number;
  cantidadUnidades?: number;
  saldoDisponible?: number;
  saldoTotal: number;          
  nota?: string;
}