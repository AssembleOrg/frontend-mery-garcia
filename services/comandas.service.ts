import { apiFetch } from '@/lib/apiClient';
import { logger } from '@/lib/utils';
import { ComandaCreateNew, ComandaNew, EstadoDeComandaNew, FiltrarComandasNew, TipoDeComandaNew } from './unidadNegocio.service';

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

  // POST /comandas/egreso - Create new egreso
  async crearComandaEgreso(comanda: ComandaCreateNew): Promise<ComandaNew> {
    const response = await apiFetch<{ data: ComandaNew }>(`${this.baseUrl}/egreso`, {
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
          } else if (typeof value === 'boolean') {
            params.append(key, value.toString());
          }
        }
      });

      console.table(params);

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

  // GET /comandas/egreso/paginados
  async obtenerComandasEgresosPaginadas(
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
        tipoDeComanda: TipoDeComandaNew.EGRESO,
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
  // GET /comandas/ultima-egreso
  async obtenerUltimaComandaEgreso(): Promise<ComandaNew> {
    const response = await apiFetch<{ data: ComandaNew }>(`${this.baseUrl}/egreso/ultimo`);
    return response.data;
  }
  
  //GET /comandas/resumen-caja-chica
  async obtenerResumen(fechaDesde: string, fechaHasta: string): Promise<{
    totalCompletados: number;
    totalPendientes: number;
    montoNetoUSD: number;
    montoNetoARS: number;
    montoDisponibleTrasladoUSD: number;
    montoDisponibleTrasladoARS: number;
    totalIngresosUSD: number;
    totalIngresosARS: number;
    totalEgresosUSD: number;
    totalEgresosARS: number;
    comandasValidadasIds: string[];
  }> {
    if(!fechaDesde || !fechaHasta) {
      const response = await apiFetch<{ data: {
        totalCompletados: number;
        totalPendientes: number;
        montoNetoUSD: number;
        montoNetoARS: number;
        montoDisponibleTrasladoUSD: number;
        montoDisponibleTrasladoARS: number;
        totalIngresosUSD: number;
        totalIngresosARS: number;
        totalEgresosUSD: number;
        totalEgresosARS: number;
        comandasValidadasIds: string[];
      } }>(`${this.baseUrl}/resumen-caja-chica`);
      return response.data;
    }
    let newFechaDesde = new Date(fechaDesde);
    let newFechaHasta = new Date(fechaHasta);
    newFechaDesde.setHours(0, 0, 0, 0);
    newFechaHasta.setHours(23, 59, 59, 999);
    fechaDesde = newFechaDesde.toISOString();
    fechaHasta = newFechaHasta.toISOString();
    const params = new URLSearchParams();
    params.append('fechaDesde', fechaDesde);
    params.append('fechaHasta', fechaHasta);
    const queryString = params.toString();
    const url = queryString
      ? `${this.baseUrl + '/resumen-caja-chica'}?${queryString}`
      : this.baseUrl + '/resumen-caja-chica';

    const response = await apiFetch<{ data: {
      totalCompletados: number;
      totalPendientes: number;
      montoNetoUSD: number;
      montoNetoARS: number;
      montoDisponibleTrasladoUSD: number;
      montoDisponibleTrasladoARS: number;
      totalIngresosUSD: number;
      totalIngresosARS: number;
      totalEgresosUSD: number;
      totalEgresosARS: number;
      comandasValidadasIds: string[];
    } }>(url);
    return response.data;
  }

  //PUT /comandas/:id/estado
  async cambiarEstadoComanda(comandaId: string, nuevoEstado: EstadoDeComandaNew): Promise<ComandaNew> {
    const response = await apiFetch<{ data: ComandaNew }>(`${this.baseUrl}/${comandaId}/estado`, {
      method: 'PUT',
      json: { estadoDeComanda: nuevoEstado }
    });
    return response.data;
  }

}

export const comandasService = new ComandasService();
