'use client';

import { createContext, useContext } from 'react';
import type { Acreedor, Deuda, Moneda, Pago } from '@/services/contable.service';

/**
 * Lo que comparten las pestañas de /contable: la moneda elegida, un contador
 * que sube con cada cambio (para recargar) y los diálogos, que viven en la
 * página para que cualquier pestaña o el panel del acreedor los abra.
 */
export interface ContableCtx {
  moneda: Moneda;
  setMoneda: (m: Moneda) => void;
  version: number;
  refrescar: () => void;
  verAcreedor: (id: string) => void;
  nuevoAcreedor: (alCrear?: (a: Acreedor) => void) => void;
  editarAcreedor: (a: Acreedor) => void;
  nuevaDeuda: (acreedorId?: string) => void;
  editarDeuda: (d: Deuda) => void;
  pagar: (d: Deuda) => void;
  editarPago: (p: Pago, d: Deuda) => void;
}

export const Contable = createContext<ContableCtx | null>(null);

export function useContable(): ContableCtx {
  const c = useContext(Contable);
  if (!c) throw new Error('useContable fuera de <Contable.Provider>');
  return c;
}
