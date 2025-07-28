import { apiFetch } from '@/lib/apiClient';
import { Cliente } from '@/types/caja';

// DTOs para crear y actualizar clientes
export interface CrearClienteDto {
  nombre: string;
  telefono?: string;
  email?: string;
  cuit?: string;
  señaUsd?: number;
  señaArs?: number;
}

export interface ActualizarClienteDto {
  nombre?: string;
  telefono?: string;
  email?: string;
  cuit?: string;
  señaUsd?: number;
  señaArs?: number;
}

export interface FiltrarClientesDto {
  nombre?: string;
  email?: string;
  telefono?: string;
  cuit?: string;
  page?: number;
  limit?: number;
  orderBy?: 'nombre' | 'fechaRegistro' | 'email';
  orderDirection?: 'ASC' | 'DESC';
}

// Interfaz para la respuesta con paginación
export interface ClientesResponse {
  clientes: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interfaz para respuestas individuales
export interface ClienteSingleResponse {
  data: Cliente;
}

// Interfaz para estadísticas
export interface EstadisticasClientesResponse {
  totalClientes: number;
  clientesConSeñas: number;
  totalSeñasArs: number;
  totalSeñasUsd: number;
  clientesActivos: number;
  clientesEliminados: number;
}

class ClientesService {
  private readonly baseUrl = '/api/clientes';

  // GET /clientes - Obtener todos los clientes (sin paginación)
  async obtenerClientes(): Promise<{ data: Cliente[] }> {
    try {
        console.log('obteniendo clientes');
      const response = await apiFetch<{
        data: Cliente[];
        status: string;
      }>(this.baseUrl);
      return { data: response.data };
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  }

  // GET /clientes/paginados - Obtener clientes con paginación y filtros
  async obtenerClientesPaginados(filtros: FiltrarClientesDto = {}): Promise<{ data: Cliente[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      
      // Agregar parámetros de filtro
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'number') {
            params.append(key, value.toString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/paginados?${queryString}` : `${this.baseUrl}/paginados`;
      const response = await apiFetch<{
        data: {
            data: Cliente[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            }
        },
        status: string;
      }>(url);
      console.log('response', response);
      return {
        data: response.data.data,
        pagination: {
          total: response.data.meta.total,
          page: response.data.meta.page,
          limit: response.data.meta.limit,
          totalPages: response.data.meta.totalPages
        }
      };
    } catch (error) {
      console.error('Error al obtener clientes paginados:', error);
      throw error;
    }
  }

  // POST /clientes - Crear nuevo cliente
  async crearCliente(clienteData: CrearClienteDto): Promise<{ data: Cliente }> {
    try {
      const response = await apiFetch<ClienteSingleResponse>(this.baseUrl, {
        method: 'POST',
        json: clienteData
      });
      
      return { data: response.data };
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  }

  // GET /clientes/:id - Obtener cliente específico
  async obtenerCliente(id: string): Promise<{ data: Cliente }> {
    try {
      const response = await apiFetch<ClienteSingleResponse>(`${this.baseUrl}/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      throw error;
    }
  }

  // PUT /clientes/:id - Actualizar cliente
  async actualizarCliente(id: string, clienteData: ActualizarClienteDto): Promise<{ data: Cliente }> {
    try {
      const response = await apiFetch<ClienteSingleResponse>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        json: clienteData
      });
      
      return { data: response.data };
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  // DELETE /clientes/:id - Eliminar cliente (soft delete)
  async eliminarCliente(id: string): Promise<{ data: Cliente }> {
    try {
      const response = await apiFetch<ClienteSingleResponse>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      
      return { data: response.data };
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  // POST /clientes/:id/restaurar - Restaurar cliente eliminado
  async restaurarCliente(id: string): Promise<{ data: Cliente }> {
    try {
      const response = await apiFetch<ClienteSingleResponse>(`${this.baseUrl}/${id}/restaurar`, {
        method: 'POST'
      });
      
      return { data: response.data };
    } catch (error) {
      console.error('Error al restaurar cliente:', error);
      throw error;
    }
  }

  // GET /clientes/estadisticas/resumen - Obtener estadísticas de clientes
  async obtenerEstadisticas(): Promise<{ data: EstadisticasClientesResponse }> {
    try {
      const response = await apiFetch<EstadisticasClientesResponse>(`${this.baseUrl}/estadisticas/resumen`);
      return { data: response };
    } catch (error) {
      console.error('Error al obtener estadísticas de clientes:', error);
      throw error;
    }
  }
}

export const clientesService = new ClientesService(); 