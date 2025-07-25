'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { Cliente } from '@/types/caja';
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

interface ClienteState {
  // Estado
  clientes: Cliente[];
  cargando: boolean;
  error: string | null;

  // Acciones CRUD
  agregarCliente: (
    cliente: Omit<Cliente, 'id' | 'fechaRegistro' | 'señasDisponibles'>,
    señaInicial?: { ars: number; usd: number }
  ) => void;
  actualizarCliente: (id: string, cliente: Partial<Cliente>) => void;
  eliminarCliente: (id: string) => void;
  obtenerClientePorId: (id: string) => Cliente | undefined;

  // Gestión de señas
  agregarSeña: (clienteId: string, monto: number, moneda: 'ars' | 'usd') => void;
  usarSeña: (clienteId: string, monto: number, moneda: 'ars' | 'usd') => boolean;
  obtenerSeñasDisponibles: (clienteId: string) => { ars: number; usd: number };

  // Consultas
  buscarCliente: (query: string) => Cliente[];
  obtenerClientesActivos: () => Cliente[];

  // Sistema
  limpiarError: () => void;
  reiniciar: () => void;
}

// Estado inicial
const estadoInicial = {
  clientes: [],
  cargando: false,
  error: null,
};

export const useClienteStore = create<ClienteState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === ACCIONES CRUD ===
        agregarCliente: (
          clienteData: Omit<
            Cliente,
            'id' | 'fechaRegistro' | 'señasDisponibles'
          >,
          señaInicial?: { ars: number; usd: number }
        ) => {
          const idGenerado = `cliente-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const nuevoCliente: Cliente = {
            ...clienteData,
            id: idGenerado,
            señasDisponibles: señaInicial || { ars: 0, usd: 0 }, // Usar la seña inicial si se proporciona
            fechaRegistro: new Date(),
          };

          set((state) => ({
            clientes: [...state.clientes, nuevoCliente],
            error: null,
          }));

          logger.info('Cliente creado exitosamente:', nuevoCliente);
        },

        actualizarCliente: (
          id: string,
          clienteActualizado: Partial<Cliente>
        ) => {
          set((state) => ({
            clientes: state.clientes.map((c) =>
              c.id === id ? { ...c, ...clienteActualizado } : c
            ),
            error: null,
          }));

          logger.info('Cliente actualizado:', { id, ...clienteActualizado });
        },

        eliminarCliente: (id: string) => {
          set((state) => ({
            clientes: state.clientes.filter((c) => c.id !== id),
            error: null,
          }));

          logger.info('Cliente eliminado:', id);
        },

        obtenerClientePorId: (id: string) => {
          const { clientes } = get();
          return clientes.find((c) => c.id === id);
        },

        // === GESTIÓN DE SEÑAS ===
        agregarSeña: (clienteId: string, monto: number, moneda: 'ars' | 'usd') => {
          set((state) => ({
            clientes: state.clientes.map((c) => {
              if (c.id === clienteId) {
                const señasActuales = c.señasDisponibles || { ars: 0, usd: 0 };
                const señasActualizadas = {
                  ...señasActuales,
                  [moneda]: (señasActuales[moneda] || 0) + monto,
                };
                return { ...c, señasDisponibles: señasActualizadas };
              }
              return c;
            }),
            error: null,
          }));

          logger.info('Seña agregada:', { clienteId, monto, moneda });
        },

        usarSeña: (clienteId: string, monto: number, moneda: 'ars' | 'usd') => {
          const { clientes } = get();
          const cliente = clientes.find((c) => c.id === clienteId);

          if (!cliente || (cliente.señasDisponibles?.[moneda] ?? 0) < monto) {
            return false;
          }

          set((state) => ({
            clientes: state.clientes.map((c) => {
              if (c.id === clienteId) {
                const señasActualizadas = {
                  ...c.señasDisponibles,
                  [moneda]: c.señasDisponibles![moneda] - monto,
                };
                return { ...c, señasDisponibles: señasActualizadas };
              }
              return c;
            }),
            error: null,
          }));

          logger.info('Seña utilizada:', { clienteId, monto, moneda });
          return true;
        },

        obtenerSeñasDisponibles: (clienteId: string) => {
          const { clientes } = get();
          const cliente = clientes.find((c) => c.id === clienteId);
          return cliente?.señasDisponibles || { ars: 0, usd: 0 };
        },

        // === CONSULTAS ===
        buscarCliente: (query: string) => {
          const { clientes } = get();
          const texto = query.trim().toLowerCase();

          if (!texto) return clientes;

          return clientes.filter(
            (c) =>
              c.nombre.toLowerCase().includes(texto) ||
              c.telefono?.toLowerCase().includes(texto) ||
              c.email?.toLowerCase().includes(texto) ||
              c.cuit?.toLowerCase().includes(texto)
          );
        },

        obtenerClientesActivos: () => {
          const { clientes } = get();
          return clientes;
        },

        // === SISTEMA ===
        limpiarError: () => {
          set({ error: null });
        },

        reiniciar: () => {
          set(estadoInicial);
          logger.info('Cliente store reiniciado');
        },
      }),
      {
        name: 'cliente-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          clientes: state.clientes,
        }),
      }
    ),
    {
      name: 'cliente-store',
    }
  )
);
