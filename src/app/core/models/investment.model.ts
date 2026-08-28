// Esta clase funciona como "Contrato" para la inversión, definiendo los atributos que debe 
// tener un objeto de tipo Investment y evitar confusiones luego.

export interface Investment {
  id: number;
  nombre: string;
  entidad?: string;
  tipo?: string;
  moneda: string;
  activa: boolean;
}