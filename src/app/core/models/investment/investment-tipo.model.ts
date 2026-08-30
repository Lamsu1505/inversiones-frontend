export type InvestmentTipo =
  | 'cdt'
  | 'fondo-inversion'
  | 'acciones'
  | 'bonos'
  | 'cripto'
  | 'otro';

export const INVESTMENT_TIPO_LABELS: Record<InvestmentTipo, string> = {
  'cdt': 'CDT',
  'fondo-inversion': 'Fondo de Inversión',
  'acciones': 'Acciones',
  'bonos': 'Bonos',
  'cripto': 'Criptomonedas',
  'otro': 'Otro',
};