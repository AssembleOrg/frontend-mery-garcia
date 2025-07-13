import { apiFetch } from '@/lib/apiClient';

export interface ExchangeRate {
  compra: number;
  /**
   * Monto de venta. Puede no estar disponible cuando el valor es ingresado manualmente
   * y solo se define la cotización de compra.
   */
  venta?: number;
  fechaActualizacion: string;
  /** Fuente o casa de cambio – opcional y depende de la implementación del backend */
  casa?: string;
  /** Nombre descriptivo de la cotización */
  nombre?: string;
  /** Moneda de referencia, por ejemplo "USD" */
  moneda?: string;
}

export async function getCotizacion(): Promise<ExchangeRate | undefined> {
  try {
    const manualRate = await getManualRate();
    if (manualRate && manualRate.casa === 'Manual') {
      return manualRate;
    }

    const res = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/cotizacion',
      { cache: 'no-store' }
    );
    return res?.data;
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    return undefined;
  }
}

// Historial de cotizaciones
export async function getHistorial(
  limit = 10
): Promise<ExchangeRate[] | undefined> {
  try {
    const res = await apiFetch<ExchangeRate[] | undefined>(
      `api/dolar/historial?limit=${limit}`,
      { cache: 'no-store' }
    );
    return res;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return undefined;
  }
}

/**
 * Envía una cotización manual al backend.
 *
 * Según el OpenAPI spec, el endpoint acepta:
 * - compra: number (opcional)
 * - venta: number (opcional)
 * - casa: string (opcional)
 * - nombre: string (opcional)
 * - moneda: string (opcional)
 */
export async function setManualRate(params: {
  /** Cuando no se indica, el backend dejará sin modificar el valor de compra. */
  compra?: number;
  /** Valor de venta (obligatorio) que usará la app internamente */
  venta: number;
  casa?: string;
  nombre?: string;
  moneda?: string;
}): Promise<{ status: string; data: ExchangeRate }> {
  const {
    compra,
    venta,
    casa = 'Manual',
    nombre = 'Blue Manual',
    moneda = 'USD',
  } = params;

  // Construir payload según OpenAPI spec
  const payload: Record<string, unknown> = {
    venta,
    casa,
    nombre,
    moneda,
  };

  // Sólo incluir compra si se pasa explícitamente
  if (compra !== undefined) {
    payload.compra = compra;
  }

  try {
    const response = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/cotizacion',
      {
        method: 'POST',
        json: payload,
      }
    );

    if (!response || !response.data) {
      throw new Error('Respuesta inválida del servidor');
    }

    return response;
  } catch (error: unknown) {
    // Manejo específico de errores
    const errorObj = error as { status?: number; message?: string };

    if (errorObj?.status === 404) {
      throw new Error('API 404: Endpoint /api/dolar/cotizacion no disponible');
    }

    if (errorObj?.status === 400) {
      throw new Error('Datos inválidos enviados al servidor');
    }

    if (errorObj?.status === 500) {
      throw new Error('Error interno del servidor');
    }

    // Error genérico
    throw new Error(
      `Error al guardar tipo de cambio: ${errorObj?.message || 'Error desconocido'}`
    );
  }
}

// Cotización pública (la real de la casa cambiaria)
export const getPublicRate = async (): Promise<ExchangeRate | undefined> => {
  try {
    const response = await apiFetch<{ status: string; data: ExchangeRate }>(
      'api/dolar/cotizacion'
    );
    return response?.data;
  } catch (error) {
    console.error('Error obteniendo cotización pública:', error);
    return undefined;
  }
};

// Último valor manual registrado por el admin
export const getManualRate = async (): Promise<ExchangeRate | undefined> => {
  try {
    const historial = await apiFetch<{ status: string; data: ExchangeRate[] }>(
      'api/dolar/historial?limit=50'
    );

    if (!historial?.data || historial.data.length === 0) {
      console.log('No hay historial de tipos de cambio');
      return undefined;
    }

    // Buscar primero registros manuales
    const manualRate = historial.data.find((r) => r.casa === 'Manual');
    if (manualRate) {
      console.log('Encontrado tipo de cambio manual:', manualRate);
      return manualRate;
    }

    // Si no hay manual, usar el más reciente
    const latestRate = historial.data[0];
    console.log('Usando tipo de cambio más reciente:', latestRate);
    return latestRate;
  } catch (error) {
    console.error('Error obteniendo valor manual:', error);
    return undefined;
  }
};

// Guardar nuevo valor manual (función simplificada)
export const saveManualRate = async (
  ventaARS: number
): Promise<{ status: string; data: ExchangeRate }> => {
  return setManualRate({
    compra: ventaARS - 20,
    venta: ventaARS,
    casa: 'Manual',
    nombre: 'Blue Manual',
    moneda: 'USD',
  });
};
