import { apiFetch } from '@/lib/apiClient';
import { logger } from '@/lib/utils';
import { ComandaCreateNew, ComandaNew, FiltrarComandasNew } from './unidadNegocio.service';

class ComandasService {
  private readonly baseUrl = '/api/comandas';

  // POST /comandas - Create new order
  async crearComanda(comanda: ComandaCreateNew): Promise<ComandaNew> {
    const response = await apiFetch<{ data: ComandaNew }>(this.baseUrl, {
      method: 'POST',
      json: comanda
    });
    return response.data;
  }

  // GET /comandas - List orders with filters and pagination
  async obtenerComandas(): Promise<ComandaNew[]> {
    try {
      const response = await apiFetch<{ 
        data: {
          status: string;
          data: ComandaNew[];
        };
      }>(this.baseUrl);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener comandas:', error);
      throw error;
    }
  }

  //GET /existe/:numero
  async existeComanda(numero: string): Promise<boolean> {
    try {
      const response = await apiFetch<{ data: boolean }>(`${this.baseUrl}/existe/${numero}`);
      return response.data;
    } catch (error) {
      console.error('Error al verificar si existe la comanda:', error);
      throw error;
    }
  }

  //GET /comandass/ultima
  async obtenerUltimaComanda(): Promise<ComandaNew> {
    try {
      const response = await apiFetch<{ data: ComandaNew }>(`${this.baseUrl}/ultima`);
      console.warn('✅ Última comanda cargada:', response);
      return response.data;
    } catch (error) {
      console.error('Error al obtener la última comanda:', error);
      throw error;
    }
  }

  // GET /comandas with pagination and filters
  async obtenerComandasPaginadas(
    filtros: FiltrarComandasNew = {}
  ): Promise<{ data: ComandaNew[]; pagination: any }> {
    try {
      const params = new URLSearchParams();

      // Valores por defecto según el backend
      const defaultFiltros: FiltrarComandasNew = {
        page: 1,
        limit: 20,
        orderBy: 'numero',
        order: 'DESC',
        ...filtros,
      };

      // Agregar parámetros de filtro
      Object.entries(defaultFiltros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'number') {
            params.append(key, value.toString());
          } else if (typeof value === 'string') {
            params.append(key, value);
          } else if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          }
        }
      });

      const queryString = params.toString();
      const url = queryString
        ? `${this.baseUrl + '/paginados'}?${queryString}`
        : this.baseUrl + '/paginados';

      const response = await apiFetch<{
        data: {
          status: string;
          data: ComandaNew[];
          meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(url);
      console.warn('✅ Comandas paginadas cargadas:', response);
      return {
        data: response.data.data,
        pagination: {
          total: response.data.meta.total,
          page: response.data.meta.page,
          limit: response.data.meta.limit,
          totalPages: response.data.meta.totalPages,
        },
      };
    } catch (error) {
      console.error('Error al obtener comandas paginadas:', error);
      throw error;
    }
  }

  // // POST /comandas - Create new order
  // async crearComanda(comandaData: CrearComandaDto): Promise<{ data: Comanda }> {
  //   try {
  //     const response = await apiFetch<ComandaSingleResponse>(this.baseUrl, {
  //       method: 'POST',
  //       json: comandaData
  //     });
  //     return { data: response.data };
  //   } catch (error) {
  //     console.error('Error al crear comanda:', error);
  //     throw error;
  //   }
  // }

  // // GET /comandas/:id - Get specific order
  // async obtenerComanda(id: string): Promise<{ data: Comanda }> {
  //   try {
  //     const response = await apiFetch<ComandaSingleResponse>(`${this.baseUrl}/${id}`);
  //     return { data: response.data };
  //   } catch (error) {
  //     console.error('Error al obtener comanda:', error);
  //     throw error;
  //   }
  // }

  // // PUT /comandas/:id - Update order
  // async actualizarComanda(id: string, comandaData: ActualizarComandaDto): Promise<{ data: Comanda }> {
  //   try {
  //     const response = await apiFetch<ComandaSingleResponse>(`${this.baseUrl}/${id}`, {
  //       method: 'PUT',
  //       json: comandaData
  //     });
  //     return { data: response.data };
  //   } catch (error) {
  //     console.error('Error al actualizar comanda:', error);
  //     throw error;
  //   }
  // }

  // // DELETE /comandas/:id - Soft delete order
  // async eliminarComanda(id: string): Promise<{ data: Comanda }> {
  //   try {
  //     const response = await apiFetch<ComandaSingleResponse>(`${this.baseUrl}/${id}`, {
  //       method: 'DELETE'
  //     });
  //     return { data: response.data };
  //   } catch (error) {
  //     console.error('Error al eliminar comanda:', error);
  //     throw error;
  //   }
  // }

  // // GET /comandas/exportar - Export orders
  // async exportarComandas(formato: 'csv' | 'pdf' | 'excel' = 'csv'): Promise<Blob> {
  //   try {
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}${this.baseUrl}/exportar?formato=${formato}`, {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //     return response.blob();
  //   } catch (error) {
  //     console.error('Error al exportar comandas:', error);
  //     throw error;
  //   }
  // }

  // // GET /comandas/estadisticas/resumen - Order statistics
  // async obtenerEstadisticas(): Promise<{ data: EstadisticasComandasResponse }> {
  //   try {
  //     const response = await apiFetch<{ data: EstadisticasComandasResponse }>(`${this.baseUrl}/estadisticas/resumen`);
  //     return { data: response.data };
  //   } catch (error) {
  //     console.error('Error al obtener estadísticas de comandas:', error);
  //     throw error;
  //   }
  // }
}

export const comandasService = new ComandasService();
