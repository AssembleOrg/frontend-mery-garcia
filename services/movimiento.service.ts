import { apiFetch } from "@/lib/apiClient";
import { MovimientoCreateNew, MovimientoNew } from "./unidadNegocio.service";

export interface FiltrarMovimientosDto {
  /**
   * Filtrar por ID de personal
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  personalId?: string;

  /**
   * Número de página
   * @example 1
   * @default 1
   * @minimum 1
   */
  page?: number;

  fechaDesde?: string;

  fechaHasta?: string;

  /**
   * Elementos por página
   * @example 20
   * @default 20
   * @minimum 1
   * @maximum 100
   */
  limit?: number;

  /**
   * Campo para ordenar
   * @example 'monto'
   * @default 'createdAt'
   */
  orderBy?: 'monto' | 'residual' | 'createdAt';

  /**
   * Dirección del ordenamiento
   * @example 'DESC'
   * @default 'DESC'
   */
  orderDirection?: 'ASC' | 'DESC';
}

class MovimientoService {
  private readonly baseUrl = '/api/movimientos';

  async crearMovimiento(movimiento: MovimientoCreateNew): Promise<MovimientoNew> {
    const response = await apiFetch<{ data: MovimientoNew }>(`${this.baseUrl}`, {
      method: 'POST',
      json: movimiento,
    });
    return response.data;
  }

  async obtenerMovimientosPaginados(
    filtros: FiltrarMovimientosDto
  ): Promise<{ 
    data: MovimientoNew[]; 
    meta: { total: number; page: number; limit: number; totalPages: number; };
    netoEfectivo?: { ARS: number; USD: number; };
  }> {
    const params = new URLSearchParams();

    const defaultFiltros: FiltrarMovimientosDto = {
      page: 1,
      limit: 5000,
      orderBy: 'createdAt',
      orderDirection: 'DESC',
      ...filtros,
    };

    Object.entries(defaultFiltros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'number') {
          params.append(key, value.toString());
        } else if (typeof value === 'string') {
          params.append(key, value);
        } else if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiFetch<{
      data: {
        status: string;
        data: MovimientoNew[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
        netoEfectivo?: {
          ARS: number;
          USD: number;
        };
      }
    }>(`${this.baseUrl}?${params.toString()}`);
    return {
      data: response.data.data,
      meta: {
        total: response.data.meta.total,
        page: response.data.meta.page,
        limit: response.data.meta.limit,
        totalPages: response.data.meta.totalPages,
      },
      netoEfectivo: response.data.netoEfectivo,
    };
  }
}

export const movimientoService = new MovimientoService();