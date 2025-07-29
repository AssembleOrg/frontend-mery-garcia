'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente } from '@/types/caja';
import { logger } from '@/lib/utils';

interface ClienteState {
  // Estado
  clientes: Cliente[];
  cargando: boolean;
  error: string | null;

  // Acciones CRUD
  agregarCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => void;
  actualizarCliente: (id: string, cliente: Partial<Cliente>) => void;
  eliminarCliente: (id: string) => void;
  obtenerClientePorId: (id: string) => Cliente | undefined;

  // Consultas
  buscarCliente: (query: string) => Cliente[];
  obtenerClientesActivos: () => Cliente[];

  // Sistema
  limpiarError: () => void;
  reiniciar: () => void;
}

// Clientes de prueba para testing
const clientesPrueba: Cliente[] = [
  {
    id: 'test-cliente-maria',
    nombre: 'María García',
    telefono: '+549111234567',
    email: 'maria.garcia@email.com',
    fechaRegistro: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
  },
  {
    id: 'test-cliente-juan',
    nombre: 'Juan Carlos López',
    telefono: '+549112345678',
    email: 'juan.lopez@email.com',
    fechaRegistro: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 días atrás
  },
  {
    id: 'test-cliente-ana',
    nombre: 'Ana Martínez',
    telefono: '+549113456789',
    email: 'ana.martinez@email.com',
    fechaRegistro: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
  }
];

// Estado inicial con clientes de prueba para testing
const estadoInicial = {
  clientes: clientesPrueba,
  cargando: false,
  error: null,
};

export const useClienteStore = create<ClienteState>()(
  devtools(
    (set, get) => ({
        ...estadoInicial,

        // === ACCIONES CRUD ===
        agregarCliente: (clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
          const idGenerado = `cliente-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const nuevoCliente: Cliente = {
            ...clienteData,
            id: idGenerado,
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
    }
  )
);
