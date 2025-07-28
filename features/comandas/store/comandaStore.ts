'use client';
import { create } from 'zustand';
import { ComandaCreateNew, ComandaNew, ComandaUpdateNew, FiltrarComandasNew } from '@/services/unidadNegocio.service';
import { comandasService } from '@/services/comandas.service';

interface ComandaState {
  // Estados principales
  comandas: ComandaNew[];
  comandasPaginadas: {
    data: ComandaNew[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  filters: FiltrarComandasNew;
  cargando: boolean;
  error: string | null;
  lastUpdate: number;

  // Acciones - Comandas
  agregarComanda: (comanda: ComandaCreateNew) => void;
  persistirComanda: (comanda: ComandaCreateNew) => void;
  actualizarComanda: (id: string, comanda: ComandaUpdateNew) => void;

  // Acciones - Filtros
  setFilters: (filters: FiltrarComandasNew) => void;

  // Acciones - Carga
  cargarComandas: () => Promise<void>;
  cargarComandasPaginadas: (filters: FiltrarComandasNew) => Promise<void>;
  getUltimaComanda: () => Promise<ComandaNew | undefined>;
  existeComanda: (numero: string) => Promise<boolean>;
  getComandasPaginadas: () => {
    data: ComandaNew[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
}

const useComandaStore = create<ComandaState>((set, get) => ({
  comandas: [],
  comandasPaginadas: {
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  },
  filters: {},
  cargando: false,
  error: null,
  lastUpdate: 0,

  getComandasPaginadas: () => {
    return get().comandasPaginadas;
  },

  persistirComanda: async (comanda: ComandaCreateNew) => {
    const nuevaComanda = await comandasService.crearComanda(comanda);
    set((state) => ({
      comandas: [...state.comandas, nuevaComanda],
    }));
    return nuevaComanda;
  },
  existeComanda: async (numero: string) => {
    const existe = await comandasService.existeComanda(numero);
    return existe;
  },

  // Acciones - Comandas
  agregarComanda: async (comanda: ComandaCreateNew) => {
   if (get().cargando) {
    return;
   }
   set({ cargando: true });
   try {
    const nuevaComanda = await comandasService.crearComanda(comanda);
   } catch (error) {
    set({ error: error instanceof Error ? error.message : 'Error al crear comanda' });
   } finally {
    set({ cargando: false });
   }
  },
  actualizarComanda: (id: string, comanda: Partial<ComandaNew>) => {
    set((state) => ({
      comandas: state.comandas.map((c) => (c.id === id ? { ...c, ...comanda } : c)),
    }));
  },
  setFilters: (filters: FiltrarComandasNew) => {
    set({ filters });
  },

  // Acciones - Carga
  cargarComandas: async () => {
    set({ cargando: true, error: null });
    try {
      const comandas = await comandasService.obtenerComandas();
      set({ comandas });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al cargar comandas' });
    } finally {
      set({ cargando: false });
    }
  },
  cargarComandasPaginadas: async (filters: FiltrarComandasNew) => {
    if (get().cargando) return;
    set({ cargando: true, error: null });
    try {
      const { data, pagination } = await comandasService.obtenerComandasPaginadas(filters);
      set({ comandasPaginadas: { data, pagination } });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al cargar comandas' });
    } finally {
      set({ cargando: false });
    }
  },
  getUltimaComanda: async () => {
    if (get().cargando) return;
    set({ cargando: true, error: null });
    try {
      const comanda = await comandasService.obtenerUltimaComanda();
      return comanda;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al cargar la última comanda' });
    } finally {
      set({ cargando: false });
    }
  },
}));

export default useComandaStore;