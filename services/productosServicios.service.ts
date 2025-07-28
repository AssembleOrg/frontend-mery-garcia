import { apiFetch } from '@/lib/apiClient';
import {
  FiltrarProductosServiciosNew,
  ProductoServicioCreateNew,
  ProductoServicioNew,
} from '@/services/unidadNegocio.service';

class ProductosServiciosService {
  private readonly baseUrl = '/api/productos-servicios';

  async cambiarEstado(id: string, activo: boolean): Promise<ProductoServicioNew> {
    const response = await apiFetch<{
      data: ProductoServicioNew;
      status: string;
    }>(`${this.baseUrl}/${id}/estado?activo=${activo}`, {
      method: 'PATCH',
    });
    return response.data;
  }

  // GET /productos-servicios - Obtener todos los productos/servicios
  async obtenerProductosServiciosPaginados(
    filtros: FiltrarProductosServiciosNew = {}
  ) {
    try {
      // Construir query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const url = queryParams.toString()
        ? `${this.baseUrl}/paginado?${queryParams.toString()}`
        : this.baseUrl + '/paginado';

      const response = await apiFetch<{
        data: {
          data: ProductoServicioNew[];
          meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(url, {
        method: 'GET',
      });
      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Error al obtener productos/servicios:', error);
      throw error;
    }
  }

  // POST /productos-servicios - Crear nuevo producto/servicio
  async crearProductoServicio(
    productoData: ProductoServicioCreateNew
  ): Promise<{ data: ProductoServicioNew }> {
    const response = await apiFetch<{
      data: ProductoServicioNew;
      status: string;
    }>(this.baseUrl, {
      method: 'POST',
      json: productoData,
    });

    return {
      data: response.data,
    };
  }

  async getProductosServicios(): Promise<ProductoServicioNew[]> {
    const response = await apiFetch<{
      data: ProductoServicioNew[];
      status: string;
    }>(`${this.baseUrl}`);

    console.log(response.data, 'TEST');

    return response.data;
  }

  async actualizarProductoServicio(id: string, productoData: ProductoServicioCreateNew): Promise<ProductoServicioNew> {
    const response = await apiFetch<{
      data: ProductoServicioNew;
      status: string;
    }>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      json: productoData
    });
    return response.data;
  }

  // // GET /productos-servicios/:id - Obtener producto/servicio específico
  // async obtenerProductoServicio(id: string): Promise<{ data: ProductoServicioNew }> {
  //   const response = await apiFetch<{
  //     data: ProductoServicioNew;
  //     status: string;
  //   }>(`${this.baseUrl}/${id}`);

  //   return {
  //     data: response.data
  //   };
  // }

  // // PUT /productos-servicios/:id - Actualizar producto/servicio
  // async actualizarProductoServicio(id: string, productoData: ActualizarProductoServicioDto): Promise<{ data: ProductoServicio }> {
  //   const response = await apiFetch<ProductoServicioSingleResponse>(`${this.baseUrl}/${id}`, {
  //     method: 'PUT',
  //     json: productoData
  //   });

  //   return {
  //     data: response.data
  //   };
  // }

  // // DELETE /productos-servicios/:id - Eliminar producto/servicio (soft delete)
  // async eliminarProductoServicio(id: string): Promise<{ data: ProductoServicio }> {
  //   const response = await apiFetch<ProductoServicioSingleResponse>(`${this.baseUrl}/${id}`, {
  //     method: 'DELETE'
  //   });

  //   return {
  //     data: response.data
  //   };
  // }

  // // POST /productos-servicios/:id/restaurar - Restaurar producto/servicio eliminado
  // async restaurarProductoServicio(id: string): Promise<{ data: ProductoServicio }> {
  //   const response = await apiFetch<ProductoServicioSingleResponse>(`${this.baseUrl}/${id}/restaurar`, {
  //     method: 'POST'
  //   });

  //   return {
  //     data: response.data
  //   };
  // }

  // // PATCH /productos-servicios/:id/estado - Cambiar estado activo
  // async cambiarEstado(id: string, activo: boolean): Promise<{ data: ProductoServicio }> {
  //   const response = await apiFetch<ProductoServicioSingleResponse>(`${this.baseUrl}/${id}/estado?activo=${activo}`, {
  //     method: 'PATCH',
  //   });
  //   return { data: response.data };
  // }

  // // GET /productos-servicios/activos - Obtener solo productos/servicios activos
  // async obtenerProductosServiciosActivos(): Promise<{ data: ProductoServicio[] }> {
  //   const response = await apiFetch<ProductoServicioResponse>(`${this.baseUrl}/activos`);

  //   return {
  //     data: response.productosServicios
  //   };
  // }

  // // GET /productos-servicios/unidad-negocio/:businessUnit - Obtener por unidad de negocio
  // async obtenerPorUnidadNegocio(businessUnit: UnidadNegocio): Promise<{ data: ProductoServicio[] }> {
  //   const response = await apiFetch<ProductoServicioResponse>(`${this.baseUrl}/unidad-negocio/${businessUnit}`);

  //   return {
  //     data: response.productosServicios
  //   };
  // }

  // // GET /productos-servicios/estadisticas - Obtener estadísticas
  // async obtenerEstadisticas(): Promise<{ data: any }> {
  //   const response = await apiFetch<any>(`${this.baseUrl}/estadisticas`);

  //   return {
  //     data: response
  //   };
  // }
}

export const productosServiciosService = new ProductosServiciosService();
