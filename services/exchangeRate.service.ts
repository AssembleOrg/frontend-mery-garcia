import { apiFetch } from '@/lib/apiClient';
import { components } from '@/types/backend';

// Types based on your backend
export interface DolarResponse {
  compra: number;
  venta: number;
  casa: string;
  nombre: string;
  moneda: string;
  fechaActualizacion?: string;
  fechaCreacion?: string;
}

// DTO for updating exchange rate
type ActualizarDolarDto = components['schemas']['ActualizarDolarDto'];

// Legacy interface for compatibility
export interface ExchangeRate extends DolarResponse {}

/**
 * Get current exchange rate from backend
 */
export async function getCotizacion(): Promise<DolarResponse | undefined> {
  try {
    const response = await apiFetch<{ status: string; data: DolarResponse }>(
      'api/dolar/cotizacion'
    );
    
    if (response?.data) {
      console.log('Cotización obtenida del backend:', response.data);
      return response.data;
    }
    
    return undefined;
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    return undefined;
  }
}

/**
 * Get the last manual update from backend
 */
export const getUltimoTipoCambio = async (): Promise<DolarResponse | undefined> => {
  try {
    const response = await apiFetch<{ status: string; data: DolarResponse }>(
      'api/dolar/ultimo'
    );
    
    if (response?.data) {
      console.log('Último tipo de cambio operativo:', response.data);
      return response.data;
    }
    
    return undefined;
  } catch (error) {
    console.error('Error obteniendo último tipo de cambio:', error);
    return undefined;
  }
};

/**
 * Get public rate for informational purposes (always fresh from API)
 */
export const getPublicRate = async (): Promise<DolarResponse | undefined> => {
  try {
    console.log('Obteniendo cotización pública informativa...');
    const response = await apiFetch<{ status: string; data: DolarResponse }>(
      'api/dolar/cotizacion',
      { cache: 'no-store' }
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

/**
 * Get exchange rate history from backend
 */
export async function getHistorial(limit: number = 10): Promise<DolarResponse[]> {
  try {
    const response = await apiFetch<{ status: string; data: DolarResponse[] }>(
      `api/dolar/historial?limit=${limit}`
    );
    console.log('Historial de tipo de cambio obtenido:', response);
    return response.data || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

/**
 * Save manual exchange rate to backend
 */
export async function setManualRate(rate: {
  venta: number;
  compra?: number;
  casa?: string;
}): Promise<{ status: string; data: DolarResponse }> {
  try {
    const dto: ActualizarDolarDto = {
      venta: rate.venta,
      compra: rate.compra || rate.venta,
      casa: rate.casa || 'Manual',
    };
    
    const response = await apiFetch<{ status: string; data: DolarResponse }>(
      'api/dolar/cotizacion',
      {
        method: 'POST',
        json: dto,
      }
    );
    
    console.log('Tipo de cambio manual guardado:', response.data);
    return response;
  } catch (error) {
    console.error('Error guardando tipo de cambio manual:', error);
    throw error;
  }
}

/**
 * Legacy alias for compatibility
 */
export const saveManualRate = setManualRate;
