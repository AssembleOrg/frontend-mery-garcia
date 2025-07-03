import { apiFetch } from '@/lib/apiClient';

export interface ExchangeRate {
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

// Cotización pública (GET)
export async function getCotizacion(): Promise<ExchangeRate | undefined> {
  const res = await apiFetch<
    { status: string; data: ExchangeRate } | undefined
  >('api/dolar/cotizacion', { cache: 'no-store' });
  return res?.data;
}

// Historial de cotizaciones
export function getHistorial(limit = 10): Promise<ExchangeRate[] | undefined> {
  return apiFetch<ExchangeRate[] | undefined>(
    `api/dolar/historial?limit=${limit}`,
    { cache: 'no-store' }
  );
}

// Guardar valor manual definido por el admin
export function setManualRate(compra: number, venta: number) {
  return apiFetch('api/dolar/manual', {
    method: 'POST',
    json: { compra, venta },
  });
}
