// Esta clase funciona como "Contrato" para la inversión, definiendo los atributos que debe 
// tener un objeto de tipo Investment y evitar confusiones luego.

import { InvestmentTipo } from "../investment/investment-tipo.model";

export interface Investment {
  id: number;
  nombre: string;
  entidad?: string;
  tipo?: InvestmentTipo;
  moneda: string;
  activa: boolean;
  fechaCreacion: string;
}