import { create } from 'zustand';
import { FiltrarMovimientosDto, movimientoService } from '@/services/movimiento.service';
import { MovimientoNew, MovimientoCreateNew } from '@/services/unidadNegocio.service';

interface MovimientosState {
  // Estado
  movimientos: MovimientoNew[];
  movimientosPaginados: {
    data: MovimientoNew[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  loading: boolean;
  error: string | null;
  lastRequestId: string | null;

  // Acciones
  crearMovimiento: (movimiento: MovimientoCreateNew) => Promise<MovimientoNew | null>;
  resetError: () => void;
  resetState: () => void;
  obtenerMovimientosPaginados: (filtros: FiltrarMovimientosDto) => Promise<{
    data: MovimientoNew[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
}

// Función para generar un ID único para cada request
const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useMovimientosStore = create<MovimientosState>((set, get) => ({
  // Estado inicial
  movimientos: [],
  movimientosPaginados: {
    data: [],
    meta: {
      total: 0,
      page: 0,
      limit: 0,
      totalPages: 0,
    },
  },
  loading: false,
  error: null,
  lastRequestId: null,

  // Crear movimiento con protección contra race requests
  crearMovimiento: async (movimiento: MovimientoCreateNew) => {
    const requestId = generateRequestId();
    
    // Si ya hay una request en curso, no permitir otra
    if (get().loading) {
      console.warn('Movimiento: Ya hay una request en curso, ignorando nueva request');
      return null;
    }

    set({
      loading: true,
      error: null,
      lastRequestId: requestId,
    });

    try {
      console.log('Movimiento: Creando movimiento...', { requestId, movimiento });
      
      const nuevoMovimiento = await movimientoService.crearMovimiento(movimiento);
      
      // Verificar que esta request sigue siendo la más reciente
      if (get().lastRequestId !== requestId) {
        console.warn('Movimiento: Request obsoleta, ignorando respuesta', { requestId, currentRequestId: get().lastRequestId });
        return null;
      }

      // Actualizar el estado con el nuevo movimiento
      set((state) => ({
        movimientos: [...state.movimientos, nuevoMovimiento],
        loading: false,
        error: null,
      }));

      console.log('Movimiento: Movimiento creado exitosamente', { requestId, nuevoMovimiento });
      return nuevoMovimiento;

    } catch (error) {
      // Verificar que esta request sigue siendo la más reciente
      if (get().lastRequestId !== requestId) {
        console.warn('Movimiento: Error en request obsoleta, ignorando', { requestId, currentRequestId: get().lastRequestId });
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear movimiento';
      
      set({
        loading: false,
        error: errorMessage,
      });

      console.error('Movimiento: Error al crear movimiento', { requestId, error: errorMessage });
      throw error;
    }
  },
  obtenerMovimientosPaginados: async (filtros: FiltrarMovimientosDto) => {
    const response = await movimientoService.obtenerMovimientosPaginados(filtros);
    set({ movimientosPaginados: response });
    return response;
  },

  // Resetear error
  resetError: () => {
    set({ error: null });
  },

  // Resetear estado completo
  resetState: () => {
    set({
      movimientos: [],
      loading: false,
      error: null,
      lastRequestId: null,
    });
  },
})); 