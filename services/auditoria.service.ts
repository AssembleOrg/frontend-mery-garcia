import { apiFetch } from '@/lib/apiClient';
import { logger } from '@/lib/utils';
import { 
  RegistroAuditoria, 
  FiltrosAuditoria, 
  RespuestaAuditoria,
  ModuloSistema,
  TipoAccion 
} from '@/features/activity/store/activityStore';

export interface AuditoriaService {
  obtenerAuditoria: (filtros?: Partial<FiltrosAuditoria>) => Promise<RespuestaAuditoria>;
  obtenerAuditoriaPaginada: (filtros?: Partial<FiltrosAuditoria>) => Promise<RespuestaAuditoria>;
  obtenerAuditoriaPorUsuario: (usuarioId: string, limit?: number) => Promise<RespuestaAuditoria>;
  obtenerAuditoriaPorModulo: (modulo: ModuloSistema, limit?: number) => Promise<RespuestaAuditoria>;
}

class AuditoriaServiceImpl implements AuditoriaService {
  private readonly baseUrl = '/api/auditoria';

  async obtenerAuditoria(filtros: Partial<FiltrosAuditoria> = {}): Promise<RespuestaAuditoria> {
    try {
      const params = new URLSearchParams();
      
      // Agregar todos los parámetros del DTO
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Asegurar que siempre tengamos valores por defecto para TODOS los parámetros requeridos
      if (!params.has('page')) {
        params.append('page', '1');
      }
      if (!params.has('limit')) {
        params.append('limit', '50');
      }
      if (!params.has('offset')) {
        params.append('offset', '0');
      }
      if (!params.has('modulo')) {
        params.append('modulo', 'todos');
      }
      if (!params.has('tipoAccion')) {
        params.append('tipoAccion', 'todos');
      }
      if (!params.has('usuarioId')) {
        params.append('usuarioId', 'todos');
      }
      if (!params.has('fechaInicio')) {
        // Fecha de hace 30 días por defecto
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        params.append('fechaInicio', fechaInicio.toISOString().split('T')[0]);
      }
      if (!params.has('fechaFin')) {
        // Fecha actual por defecto
        const fechaFin = new Date();
        params.append('fechaFin', fechaFin.toISOString().split('T')[0]);
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
      
      logger.info('🔍 Llamando a auditoría con URL:', url);
      
      const data = await apiFetch<{
        data: {
          data: RegistroAuditoria[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
          };
        };
      }>(url);
      
      logger.info('✅ Auditoría obtenida exitosamente:', data.data?.data?.length || 0, 'registros');
      return {
        data: data.data?.data || [],
        meta: {
          page: data.data?.meta?.page || 1,
          limit: data.data?.meta?.limit || 50,
          total: data.data?.meta?.total || 0,
          totalPages: data.data?.meta?.totalPages || 0,
          hasNextPage: data.data?.meta?.hasNextPage || false,
          hasPreviousPage: data.data?.meta?.hasPreviousPage || false,
        }
      };
    } catch (error) {
      logger.error('❌ Error obteniendo auditoría:', error);
      throw error;
    }
  }

  async obtenerAuditoriaPaginada(filtros: Partial<FiltrosAuditoria> = {}): Promise<RespuestaAuditoria> {
    try {
      const params = new URLSearchParams();
      
      // Agregar todos los parámetros del DTO
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Asegurar que siempre tengamos valores por defecto para TODOS los parámetros requeridos
      if (!params.has('page')) {
        params.append('page', '1');
      }
      if (!params.has('limit')) {
        params.append('limit', '50');
      }
      if (!params.has('offset')) {
        params.append('offset', '0');
      }
      if (!params.has('fechaInicio')) {
        // Fecha de hace 30 días por defecto
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        params.append('fechaInicio', fechaInicio.toISOString().split('T')[0]);
      }
      if (!params.has('fechaFin')) {
        // Fecha actual por defecto
        const fechaFin = new Date();
        params.append('fechaFin', fechaFin.toISOString().split('T')[0]);
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl+'/paginada'}?${queryString}` : this.baseUrl+'/paginada';
      
      logger.info('🔍 Llamando a auditoría paginada con URL:', url);
      
      const data = await apiFetch<
      {
        data: {
          data: RegistroAuditoria[];
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
          };
        };
      }>(url);
      
      logger.info('✅ Auditoría paginada obtenida exitosamente:', data.data?.data?.length || 0, 'registros');
      return {
        data: data.data?.data || [],
        meta: {
            page: data.data?.meta?.page || 1,
            limit: data.data?.meta?.limit || 50,
            total: data.data?.meta?.total || 0,
            totalPages: data.data?.meta?.totalPages || 0,
            hasNextPage: data.data?.meta?.hasNextPage || false,
            hasPreviousPage: data.data?.meta?.hasPreviousPage || false,
        }
      };
    } catch (error) {
      logger.error('❌ Error obteniendo auditoría paginada:', error);
      throw error;
    }
  }

  async obtenerAuditoriaPorUsuario(
    usuarioId: string,
    limit: number = 50
  ): Promise<RespuestaAuditoria> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('usuarioId', usuarioId);

      const url = `${this.baseUrl}?${params.toString()}`;
      logger.info('🔍 Llamando a auditoría por usuario con URL:', url);
      
      const data = await apiFetch<RespuestaAuditoria>(url);
      
      logger.info('✅ Auditoría por usuario obtenida exitosamente:', data.data?.length || 0, 'registros');
      return {
        data: data.data || [],
        meta: {
          page: data.meta?.page || 1,
          limit: data.meta?.limit || limit,
          total: data.meta?.total || 0,
          totalPages: data.meta?.totalPages || 0,
          hasNextPage: data.meta?.hasNextPage || false,
          hasPreviousPage: data.meta?.hasPreviousPage || false,
        }
      };
    } catch (error) {
      logger.error('❌ Error obteniendo auditoría por usuario:', error);
      throw error;
    }
  }

  async obtenerAuditoriaPorModulo(
    modulo: ModuloSistema,
    limit: number = 50
  ): Promise<RespuestaAuditoria> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('modulo', modulo);

      const url = `${this.baseUrl}?${params.toString()}`;
      logger.info('🔍 Llamando a auditoría por módulo con URL:', url);
      
      const data = await apiFetch<RespuestaAuditoria>(url);
      
      logger.info('✅ Auditoría por módulo obtenida exitosamente:', data.data?.length || 0, 'registros');
      return {
        data: data.data || [],
        meta: {
          page: data.meta?.page || 1,
          limit: data.meta?.limit || limit,
          total: data.meta?.total || 0,
          totalPages: data.meta?.totalPages || 0,
          hasNextPage: data.meta?.hasNextPage || false,
          hasPreviousPage: data.meta?.hasPreviousPage || false,
        }
      };
    } catch (error) {
      logger.error('❌ Error obteniendo auditoría por módulo:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const auditoriaService = new AuditoriaServiceImpl(); 