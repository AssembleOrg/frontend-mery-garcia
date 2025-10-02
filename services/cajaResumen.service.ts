import { apiFetch } from '@/lib/apiClient';
import { ResumenCajaDiarioResponse, ResumenCajaQueryParams } from '@/types/caja';

/**
 * Servicio para obtener el resumen de caja diario con desglose por método de pago
 */
export class CajaResumenService {
  /**
   * Obtiene el resumen de caja diario con desglose por método de pago
   * @param params - Parámetros de filtro opcionales (fecha)
   * @returns Promise con el resumen de caja del día especificado
   */
  static async getResumenCajaDiario(
    params?: ResumenCajaQueryParams
  ): Promise<ResumenCajaDiarioResponse> {
    const queryParams = new URLSearchParams();
    if (params?.fecha) {
      queryParams.append('fecha', params.fecha);
    }

    const queryString = queryParams.toString();
    const path = `/api/comandas/resumen-caja-por-metodo-pago${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch<{
      data: ResumenCajaDiarioResponse;
      status: 'success' | 'error';
    }>(path);
    
    return response.data;
  }

  /**
   * Obtiene el resumen de caja de hoy
   * @returns Promise con el resumen de caja del día actual
   */
  static async getResumenCajaHoy(): Promise<ResumenCajaDiarioResponse> {
    return this.getResumenCajaDiario();
  }

  /**
   * Obtiene el resumen de caja de una fecha específica
   * @param fecha - Fecha en formato YYYY-MM-DD
   * @returns Promise con el resumen de caja del día especificado
   */
  static async getResumenCajaFecha(fecha: string): Promise<ResumenCajaDiarioResponse> {
    return this.getResumenCajaDiario({ fecha });
  }
}

