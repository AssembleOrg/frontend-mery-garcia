import { create } from 'zustand';
import { TrabajadorCreateNew, TrabajadorNew, TrabajadorUpdateNew } from '@/services/unidadNegocio.service';
import { trabajadoresService } from '@/services/trabajadores.service';
import { toast } from 'sonner';
import { logger } from '@/lib/utils';

interface TrabajadoresState {
  trabajadores: TrabajadorNew[];
  trabajadorSeleccionado: TrabajadorNew | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadTrabajadores: () => Promise<void>;
  setTrabajadores: (trabajadores: TrabajadorNew[]) => void;
  crearTrabajador: (trabajador: TrabajadorCreateNew) => Promise<TrabajadorNew | null>;
  actualizarTrabajador: (id: string, trabajador: TrabajadorUpdateNew) => Promise<TrabajadorNew | null>;
  eliminarTrabajador: (id: string) => Promise<boolean>;
  getTrabajadores: () => Promise<TrabajadorNew[]>;
  obtenerTrabajadorPorId: (id: string) => Promise<TrabajadorNew | null>;
  seleccionarTrabajador: (trabajador: TrabajadorNew | null) => void;
  limpiarError: () => void;
  reiniciar: () => void;
}

const estadoInicial = {
  trabajadores: [],
  trabajadorSeleccionado: null,
  isLoading: false,
  error: null,
  hasLoaded: false,
};

const useTrabajadoresStore = create<TrabajadoresState>((set, get) => ({
  ...estadoInicial,

  loadTrabajadores: async () => {
    if (get().isLoading) return;
    
    set({ isLoading: true, error: null });
    try {
      const trabajadoresResponse = await trabajadoresService.getTrabajadores();
      
      if (!trabajadoresResponse || !Array.isArray(trabajadoresResponse)) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      set({ 
        trabajadores: trabajadoresResponse,
        hasLoaded: true,
        isLoading: false 
      });
      
      logger.info('✅ Trabajadores cargados:', trabajadoresResponse.length);
      toast.success('✅ Trabajadores cargados correctamente');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al cargar trabajadores';
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      
      toast.error(`Error al cargar trabajadores: ${errorMessage}`);
      logger.error('❌ Error cargando trabajadores:', error);
    }
  },

  setTrabajadores: (trabajadores: TrabajadorNew[]) => {
    set({ trabajadores });
  },

  crearTrabajador: async (trabajador: TrabajadorCreateNew) => {
    if (!trabajador || !trabajador.nombre?.trim()) {
      toast.error('Nombre del trabajador es requerido');
      return null;
    }
    
    set({ isLoading: true, error: null });
    try {
      const trabajadorResponse = await trabajadoresService.crearTrabajador(trabajador);
      
      if (!trabajadorResponse) {
        throw new Error('Error al crear trabajador');
      }
      
      set({ 
        trabajadores: [...get().trabajadores, trabajadorResponse],
        isLoading: false 
      });
      
      toast.success(`✅ Trabajador "${trabajadorResponse.nombre}" creado exitosamente`);
      logger.info('✅ Trabajador creado:', trabajadorResponse);
      return trabajadorResponse;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al crear trabajador';
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      
      toast.error(`Error al crear trabajador: ${errorMessage}`);
      logger.error('❌ Error creando trabajador:', error);
      return null;
    }
  },

  actualizarTrabajador: async (id: string, trabajador: TrabajadorUpdateNew) => {
    if (!id) {
      toast.error('ID de trabajador requerido');
      return null;
    }
    
    if (!trabajador || !trabajador.nombre?.trim()) {
      toast.error('Nombre del trabajador es requerido');
      return null;
    }
    
    set({ isLoading: true, error: null });
    try {
      const trabajadorResponse = await trabajadoresService.actualizarTrabajador(id, trabajador);
      
      if (!trabajadorResponse) {
        throw new Error('Error al actualizar trabajador');
      }
      
      set({ 
        trabajadores: get().trabajadores.map(t => t.id === id ? trabajadorResponse : t),
        trabajadorSeleccionado: get().trabajadorSeleccionado?.id === id 
          ? trabajadorResponse 
          : get().trabajadorSeleccionado,
        isLoading: false 
      });
      
      toast.success(`✅ Trabajador "${trabajadorResponse.nombre}" actualizado exitosamente`);
      logger.info('✅ Trabajador actualizado:', trabajadorResponse);
      return trabajadorResponse;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al actualizar trabajador';
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      
      toast.error(`Error al actualizar trabajador: ${errorMessage}`);
      logger.error('❌ Error actualizando trabajador:', error);
      return null;
    }
  },

  eliminarTrabajador: async (id: string) => {
    if (!id) {
      toast.error('ID de trabajador requerido');
      return false;
    }
    
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar eliminarTrabajador en trabajadoresService
      // await trabajadoresService.eliminarTrabajador(id);
      
      // Por ahora, solo mostrar un toast informativo
      toast.info('Función de eliminación no implementada en el servicio');
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al eliminar trabajador';
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      
      toast.error(`Error al eliminar trabajador: ${errorMessage}`);
      logger.error('❌ Error eliminando trabajador:', error);
      return false;
    }
  },

  getTrabajadores: async () => {
    set({ isLoading: true, error: null });
    try {
      const trabajadoresResponse = await trabajadoresService.getTrabajadores();
      
      if (!trabajadoresResponse || !Array.isArray(trabajadoresResponse)) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      set({ 
        trabajadores: trabajadoresResponse,
        hasLoaded: true,
        isLoading: false 
      });
      
      logger.info('✅ Trabajadores obtenidos:', trabajadoresResponse.length);
      return trabajadoresResponse;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener trabajadores';
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      
      toast.error(`Error al obtener trabajadores: ${errorMessage}`);
      logger.error('❌ Error obteniendo trabajadores:', error);
      return [];
    }
  },

  obtenerTrabajadorPorId: async (id: string) => {
    if (!id) {
      toast.error('ID de trabajador requerido');
      return null;
    }
    
    set({ isLoading: true, error: null });
    try {
      const trabajadorResponse = await trabajadoresService.getTrabajadorPorId(id);
      
      if (!trabajadorResponse) {
        throw new Error('Trabajador no encontrado');
      }
      
      // Agregar al estado si no existe
      const state = get();
      if (!state.trabajadores.find(t => t.id === id)) {
        set({ 
          trabajadores: [...state.trabajadores, trabajadorResponse],
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
      
      logger.info('✅ Trabajador obtenido:', trabajadorResponse.nombre);
      return trabajadorResponse;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener trabajador';
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      
      toast.error(`Error al obtener trabajador: ${errorMessage}`);
      logger.error('❌ Error obteniendo trabajador:', error);
      return null;
    }
  },

  seleccionarTrabajador: (trabajador: TrabajadorNew | null) => {
    set({ trabajadorSeleccionado: trabajador });
  },

  limpiarError: () => {
    set({ error: null });
  },

  reiniciar: () => {
    set(estadoInicial);
    logger.info('Store de trabajadores reiniciado');
  },
}));

export default useTrabajadoresStore;
