import { apiFetch } from '@/lib/apiClient';

export interface ExchangeRate {
  compra: number;
  venta?: number;
  fechaActualizacion: string;
  casa?: string;
  nombre?: string;
  moneda?: string;
}

export const getUltimoTipoCambio = async (): Promise<
  ExchangeRate | undefined
> => {
  try {
    const response = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/ultimo'
    );
    return response?.data;
  } catch (error) {
    console.error('Error obteniendo último tipo de cambio:', error);
    return undefined;
  }
};

export async function getCotizacion(): Promise<ExchangeRate | undefined> {
  try {
    const ultimoGuardado = await getUltimoTipoCambio();
    if (ultimoGuardado) {
      console.log(
        'Usando último tipo de cambio operativo guardado:',
        ultimoGuardado
      );
      return ultimoGuardado;
    }

    // Si no hay valor guardado, usar la cotización pública como fallback
    const res = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/cotizacion',
      { cache: 'no-store' }
    );

    if (res?.data) {
      console.log(
        'Usando cotización pública como fallback operativo:',
        res.data
      );
      return res.data;
    }

    throw new Error('No se pudo obtener cotización');
  } catch (error) {
    console.error('Error en getCotizacion:', error);
    return undefined;
  }
}

// ✅ SOLO para valores informativos - siempre obtiene de la API pública
export const getPublicRate = async (): Promise<ExchangeRate | undefined> => {
  try {
    console.log('Obteniendo cotización pública informativa...');
    const response = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/cotizacion',
      { cache: 'no-store' } // Siempre obtener datos frescos para informativos
    );

    if (response?.data) {
      console.log('Cotización pública informativa obtenida:', response.data);
      return response.data;
    }

    return undefined;
  } catch (error) {
    console.error('Error obteniendo cotización pública informativa:', error);
    return undefined;
  }
};

// Historial de cotizaciones
export async function getHistorial(
  limit: number = 10
): Promise<ExchangeRate[]> {
  try {
    const response = await apiFetch<{ status: string; data: ExchangeRate[] }>(
      `api/dolar/historial?limit=${limit}`
    );
    return response?.data || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}
export async function setManualRate(rate: {
  venta: number;
  compra?: number;
}): Promise<{ status: string; data: ExchangeRate }> {
  try {
    const response = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/cotizacion',
      {
        method: 'POST',
        json: {
          venta: rate.venta,
          compra: rate.compra || rate.venta,
        },
      }
    );
    return response;
  } catch (error) {
    console.error('Error guardando tipo de cambio manual:', error);
    throw error;
  }
}

export const saveManualRate = async (rate: {
  venta: number;
  compra?: number;
}): Promise<{ status: string; data: ExchangeRate }> => {
  return setManualRate(rate);
};
