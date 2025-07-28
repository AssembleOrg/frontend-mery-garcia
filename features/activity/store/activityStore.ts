import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interfaces para el log de actividad del negocio
export interface ActivityLog {
  id: string;
  fecha: string; // Changed to string for better serialization
  usuario: string;
  usuarioId: string;
  accion: string;
  descripcion: string;
  modulo:
    | 'Caja Grande'
    | 'Caja Chica'
    | 'Usuarios'
    | 'Reportes'
    | 'Configuración';
  metadata?: Record<string, any>; // Para datos adicionales
}

export interface ActivityFilters {
  user?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityStatistics {
  totalActividades: number;
  actividadesHoy: number;
  usuariosActivos: number;
  moduloMasUsado: string;
}

interface ActivityState {
  logs: ActivityLog[];
  filters: ActivityFilters;
  isLoading: boolean;
}

interface ActivityActions {
  // Acciones principales
  logActivity: (
    accion: string,
    modulo: ActivityLog['modulo'],
    descripcion: string,
    metadata?: Record<string, any>
  ) => void;

  // Filtros
  updateFilters: (newFilters: Partial<ActivityFilters>) => void;
  clearFilters: () => void;

  // Utilidades
  getStatistics: () => ActivityStatistics;
  getFilteredLogs: () => ActivityLog[];
  exportToCSV: () => void;
  clearAllLogs: () => void; // Para testing/demo
}

type ActivityStore = ActivityState & ActivityActions;

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      logs: [],
      filters: {} as ActivityFilters,
      isLoading: false,

      // Registrar nueva actividad
      logActivity: (accion, modulo, descripcion, metadata = {}) => {
        // Obtener usuario actual del localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.warn('No hay usuario logueado para registrar actividad');
          return;
        }

        try {
          const user = JSON.parse(userStr);
          const newLog: ActivityLog = {
            id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fecha: new Date().toISOString(),
            usuario: user.nombre,
            usuarioId: user.id,
            accion,
            modulo,
            descripcion,
            metadata,
          };

          set((state) => ({
            logs: [newLog, ...state.logs], // Más recientes primero
          }));

          console.log('✅ Actividad registrada:', {
            accion,
            modulo,
            descripcion,
          });
        } catch (error) {
          console.error('Error al registrar actividad:', error);
        }
      },

      // Actualizar filtros
      updateFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      // Limpiar filtros
      clearFilters: () => {
        set({ filters: {} as ActivityFilters });
      },

      // Obtener logs filtrados
      getFilteredLogs: () => {
        const { logs, filters } = get();

        return logs.filter((log) => {
          if (
            filters.user &&
            !log.usuario.toLowerCase().includes(filters.user.toLowerCase())
          ) {
            return false;
          }
          if (
            filters.module &&
            filters.module !== 'all' &&
            log.modulo !== filters.module
          ) {
            return false;
          }
          if (
            filters.action &&
            filters.action !== 'all' &&
            log.accion !== filters.action
          ) {
            return false;
          }
          if (filters.startDate) {
            const logDate = new Date(log.fecha);
            const startDate = new Date(filters.startDate);
            if (logDate < startDate) {
              return false;
            }
          }
          if (filters.endDate) {
            const logDate = new Date(log.fecha);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // Incluir todo el día
            if (logDate > endDate) {
              return false;
            }
          }
          return true;
        });
      },

      // Calcular estadísticas
      getStatistics: () => {
        const { logs } = get();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const actividadesHoy = logs.filter((log) => {
          const logDate = new Date(log.fecha);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === hoy.getTime();
        }).length;

        const usuariosUnicos = new Set(logs.map((log) => log.usuarioId));

        // Contar actividades por módulo
        const moduloCount: Record<string, number> = {};
        logs.forEach((log) => {
          moduloCount[log.modulo] = (moduloCount[log.modulo] || 0) + 1;
        });

        const moduloMasUsado = Object.entries(moduloCount).reduce(
          (max, [modulo, count]) =>
            count > max.count ? { modulo, count } : max,
          { modulo: 'N/A', count: 0 }
        ).modulo;

        return {
          totalActividades: logs.length,
          actividadesHoy,
          usuariosActivos: usuariosUnicos.size,
          moduloMasUsado,
        };
      },

      // Exportar a CSV
      exportToCSV: () => {
        const filteredLogs = get().getFilteredLogs();

        if (filteredLogs.length === 0) {
          alert('No hay datos para exportar');
          return;
        }

        // Función para normalizar texto y remover tildes
        const normalizarTexto = (texto: string) => {
          return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        };

        const headers = ['Fecha', 'Usuario', 'Accion', 'Modulo', 'Descripcion'].map(normalizarTexto);
        const csvContent = [
          headers.join(','),
          ...filteredLogs.map((log) =>
            [
              new Date(log.fecha).toLocaleString('es-AR'),
              `"${log.usuario}"`,
              `"${log.accion}"`,
              log.modulo,
              `"${log.descripcion}"`,
            ].join(',')
          ),
        ].join('\n');

        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `actividad-sistema-${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('✅ CSV exportado exitosamente');
      },

      // Limpiar todos los logs (para demo)
      clearAllLogs: () => {
        set({ logs: [], filters: {} as ActivityFilters });
      },
    }),
    {
      name: 'activity-logs-storage',
      // Solo persistir logs, no el estado de loading
      partialize: (state) => ({
        logs: state.logs,
      }),
    }
  )
);

// Hook de conveniencia para registrar actividades
export const useLogActivity = () => {
  const logActivity = useActivityStore((state) => state.logActivity);
  return logActivity;
};
