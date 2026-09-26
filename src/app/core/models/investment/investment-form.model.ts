/** Opción del selector de tipo, tal como la manda GET /api/investment-types. */
export interface InvestmentTypeOption {
  codigo: string;
  nombre: string;
}

/** Lo que manda el formulario al crear o editar. */
export interface InvestmentInput {
  nombre: string;
  entidad?: string;                 // se omite si está vacía
  tipo: string;
  moneda: string;
  fechaApertura: string;            // 'YYYY-MM-DD'
  rastreaValorUnidad: boolean;
  rastreaSaldoDisponible: boolean;
}

/** Qué no se puede cambiar al editar, según los datos que ya existen. */
export interface EditConstraints {
  puedeDesactivarValorUnidad: boolean;
  puedeDesactivarSaldoDisponible: boolean;
  fechaAperturaMaxima: string | null;   // null = sin registros ni movimientos
}