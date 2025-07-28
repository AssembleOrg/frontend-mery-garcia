import { create } from 'zustand';
import { UnidadNegocioCreateNew, UnidadNegocioNew, unidadNegocioService } from '@/services/unidadNegocio.service';

interface UnidadNegocioState {
  unidadesNegocio: UnidadNegocioNew[];
  isLoading: boolean;
  error: string | undefined;
  hasLoaded: boolean;
  setUnidadesNegocio: (unidadesNegocio: UnidadNegocioNew[]) => void;
  clear: () => void;
  loadUnidadNegocio: () => Promise<void>;
  reloadUnidadNegocio: () => Promise<void>;
  crearUnidadNegocio: (unidadNegocio: UnidadNegocioCreateNew) => Promise<UnidadNegocioNew | undefined>;
}

const useUnidadNegocioStore = create<UnidadNegocioState>((set,get) => ({
  unidadesNegocio: [],
  isLoading: false,
  error: undefined,
  hasLoaded: false,
  crearUnidadNegocio: async (unidadNegocio: UnidadNegocioCreateNew) => {
    set({ isLoading: true, error: undefined, hasLoaded: false });
    try {
      const unidadNegocioResponse = await unidadNegocioService.crearUnidadNegocio(unidadNegocio);
      set({ unidadesNegocio: [...get().unidadesNegocio, unidadNegocioResponse] });
      return unidadNegocioResponse;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  loadUnidadNegocio: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const unidadesNegocio = await unidadNegocioService.getAllUnidadesNegocio();
      set({ unidadesNegocio });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  reloadUnidadNegocio: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const unidadesNegocio = await unidadNegocioService.getAllUnidadesNegocio();
      set({ unidadesNegocio });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  clear: () => {
    set({ unidadesNegocio: [], error: undefined, hasLoaded: false });
  },
  setUnidadesNegocio: (unidadesNegocio: UnidadNegocioNew[]) => {
    set({ unidadesNegocio });
  },
}));

export default useUnidadNegocioStore;