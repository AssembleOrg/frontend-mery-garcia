'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { Personal, PersonalSimple, UnidadNegocio } from '@/types/caja';
import { logger } from '@/lib/utils';

// Storage helper para evitar acceso a localStorage en SSR
const safeJSONStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  const memoryStore = new Map<string, string>();
  return {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
  } as Storage;
});

interface PersonalState {
  // Estado
  personal: Personal[];
  personalSimple: PersonalSimple[];
  cargando: boolean;
  error: string | null;

  // Acciones CRUD
  agregarPersonal: (personal: Omit<PersonalSimple, 'id'>) => void;
  actualizarPersonal: (id: string, personal: Partial<PersonalSimple>) => void;
  eliminarPersonal: (id: string) => void;
  obtenerPersonalPorId: (id: string) => PersonalSimple | undefined;

  // Consultas
  obtenerPersonalPorUnidad: (unidad?: UnidadNegocio) => Personal[];
  buscarPersonal: (query: string) => PersonalSimple[];
  obtenerPersonalActivo: () => PersonalSimple[];

  // Sistema
  limpiarError: () => void;
  reiniciar: () => void;
}

// Estado inicial
const estadoInicial = {
  personal: [],
  personalSimple: [],
  cargando: false,
  error: null,
};

export const usePersonalStore = create<PersonalState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === ACCIONES CRUD ===
        agregarPersonal: (personalData: Omit<PersonalSimple, 'id'>) => {
          const idGenerado = `personal-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Versión simplificada
          const nuevoPersonalSimple: PersonalSimple = {
            ...personalData,
            id: idGenerado,
          };

          // Versión completa para compatibilidad
          const nuevoPersonalCompleto: Personal = {
            id: idGenerado,
            nombre: personalData.nombre,
            activo: true,
            unidadesDisponibles: ['tattoo', 'estilismo', 'formacion'],
            fechaIngreso: new Date(),
          };

          set((state) => ({
            personalSimple: [...state.personalSimple, nuevoPersonalSimple],
            personal: [...state.personal, nuevoPersonalCompleto],
            error: null,
          }));

          logger.info('Personal creado exitosamente:', nuevoPersonalSimple);
        },

        actualizarPersonal: (
          id: string,
          personalActualizado: Partial<PersonalSimple>
        ) => {
          set((state) => {
            // Actualizar arrays simples y completos
            const personalSimpleActualizado = state.personalSimple.map((p) =>
              p.id === id ? { ...p, ...personalActualizado } : p
            );

            const personalActualizadoCompleto = state.personal.map((p) =>
              p.id === id
                ? {
                    ...p,
                    nombre: personalActualizado.nombre || p.nombre,
                  }
                : p
            );

            return {
              personalSimple: personalSimpleActualizado,
              personal: personalActualizadoCompleto,
              error: null,
            };
          });

          logger.info('Personal actualizado:', { id, ...personalActualizado });
        },

        eliminarPersonal: (id: string) => {
          set((state) => ({
            personalSimple: state.personalSimple.filter((p) => p.id !== id),
            personal: state.personal.filter((p) => p.id !== id),
            error: null,
          }));

          logger.info('Personal eliminado:', id);
        },

        obtenerPersonalPorId: (id: string) => {
          const { personalSimple } = get();
          return personalSimple.find((p) => p.id === id);
        },

        // === CONSULTAS ===
        obtenerPersonalPorUnidad: (unidad?: UnidadNegocio) => {
          const { personal, personalSimple } = get();

          // Si la lista completa está vacía pero existe simple, convertirla
          if (personal.length === 0 && personalSimple.length > 0) {
            return personalSimple.map((ps) => ({
              id: ps.id,
              nombre: ps.nombre,
              activo: true,
              unidadesDisponibles: ['tattoo', 'estilismo', 'formacion'],
              fechaIngreso: new Date(),
            }));
          }

          // Filtrar por unidad si se especifica
          if (unidad) {
            return personal.filter(
              (p) => p.unidadesDisponibles.includes(unidad) && p.activo
            );
          }

          return personal.filter((p) => p.activo);
        },

        buscarPersonal: (query: string) => {
          const { personalSimple } = get();
          const texto = query.trim().toLowerCase();

          if (!texto) return personalSimple;

          return personalSimple.filter((p) =>
            p.nombre.toLowerCase().includes(texto)
          );
        },

        obtenerPersonalActivo: () => {
          const { personalSimple } = get();
          return personalSimple; // Por ahora todos son activos
        },

        // === SISTEMA ===
        limpiarError: () => {
          set({ error: null });
        },

        reiniciar: () => {
          set(estadoInicial);
          logger.info('Personal store reiniciado');
        },
      }),
      {
        name: 'personal-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          personal: state.personal,
          personalSimple: state.personalSimple,
        }),
      }
    ),
    {
      name: 'personal-store',
    }
  )
);

// === HOOKS DE CONVENIENCIA ===
export const usePersonal = () => {
  const store = usePersonalStore();
  return {
    personal: store.personalSimple,
    personalCompleto: store.personal,
    agregarPersonal: store.agregarPersonal,
    actualizarPersonal: store.actualizarPersonal,
    eliminarPersonal: store.eliminarPersonal,
    buscarPersonal: store.buscarPersonal,
    cargando: store.cargando,
    error: store.error,
  };
};

export const usePersonalPorUnidad = () => {
  const store = usePersonalStore();
  return {
    obtenerPersonalPorUnidad: store.obtenerPersonalPorUnidad,
    personalActivo: store.obtenerPersonalActivo(),
  };
};
