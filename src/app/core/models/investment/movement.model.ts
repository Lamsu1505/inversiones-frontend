export type MovementTipo = 'aporte' | 'retiro';

/** Movimiento tal como lo devuelve el backend. */
export interface Movement {
  id: number;
  investmentId: number;
  tipo: MovementTipo;
  fecha: string;              // 'YYYY-MM-DD', fecha REAL del movimiento
  monto: number;              // siempre positivo; el signo lo da `tipo`
  reflejadoEnSaldo: boolean;
  nota: string | null;
}

/** Lo que manda el modal al guardar. */
export interface MovementInput {
  tipo: MovementTipo;
  fecha: string;
  monto: number;
  reflejadoEnSaldo: boolean;
  nota?: string;              // se omite si está vacía
}