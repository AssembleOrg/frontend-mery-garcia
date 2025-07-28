'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { Cliente } from '@/types/caja';
import { 
  clientesService,
  CrearClienteDto,
  ActualizarClienteDto,
  FiltrarClientesDto
} from '@/services/clientes.service';
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

interface ClientesState {
  // Estado
  clientes: Cliente[];
  clienteSeleccionado: Cliente | null;
  cargando: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  estadisticas: {
    totalClientes: number;
    clientesConSeñas: number;
    totalSeñasArs: number;
    totalSeñasUsd: number;
    clientesActivos: number;
    clientesEliminados: number;
  } | null;

  // Acciones de carga
  cargarClientes: () => Promise<void>;
  cargarClientesPaginados: (filtros?: FiltrarClientesDto) => Promise<void>;
  obtenerCliente: (id: string) => Promise<void>;
  cargarEstadisticas: () => Promise<void>;

  // Acciones CRUD
  crearCliente: (clienteData: CrearClienteDto) => Promise<boolean>;
  actualizarCliente: (id: string, clienteData: ActualizarClienteDto) => Promise<boolean>;
  eliminarCliente: (id: string) => Promise<boolean>;
  restaurarCliente: (id: string) => Promise<boolean>;

  // Acciones CRUD locales (compatibilidad)
  agregarCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => void;
  actualizarClienteLocal: (id: string, cliente: Partial<Cliente>) => void;
  eliminarClienteLocal: (id: string) => void;
  obtenerClientePorId: (id: string) => Cliente | undefined;

  // Acciones de UI
  seleccionarCliente: (cliente: Cliente | null) => void;
  limpiarError: () => void;

  // Búsqueda y filtros
  buscarClientes: (query?: string) => Cliente[];
  obtenerClientesActivos: () => Cliente[];
  obtenerClientesConSeñas: () => Cliente[];

  // Sistema
  reiniciar: () => void;
}

const estadoInicial = {
  clientes: [],
  clienteSeleccionado: null,
  cargando: false,
  error: null,
  pagination: null,
  estadisticas: null,
};

export const useClientesStore = create<ClientesState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === ACCIONES DE CARGA ===
        cargarClientes: async () => {
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.obtenerClientes();
            
            if (!response || !response.data) {
              throw new Error('Respuesta inválida del servidor');
            }
            
            set({ 
              clientes: response.data,
              cargando: false 
            });
            logger.info('✅ Clientes cargados:', response.data.length);
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al cargar clientes';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al cargar clientes: ${errorMessage}`);
            logger.error('❌ Error cargando clientes:', error);
          }
        },

        cargarClientesPaginados: async (filtros?: FiltrarClientesDto) => {
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.obtenerClientesPaginados(filtros);
            
            if (!response || !response.data) {
              throw new Error('Respuesta inválida del servidor');
            }
            
            set({ 
              clientes: response.data,
              pagination: response.pagination || null,
              cargando: false 
            });
            
            logger.info('✅ Clientes paginados cargados:', response.data.length);
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al cargar clientes paginados';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al cargar clientes: ${errorMessage}`);
            logger.error('❌ Error cargando clientes paginados:', error);
          }
        },

        obtenerCliente: async (id: string) => {
          if (!id) {
            toast.error('ID de cliente requerido');
            return;
          }
          
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.obtenerCliente(id);
            
            if (!response || !response.data) {
              throw new Error('Cliente no encontrado');
            }
            
            set({ 
              clienteSeleccionado: response.data,
              cargando: false 
            });
            logger.info('✅ Cliente obtenido:', response.data.nombre);
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al obtener cliente';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al obtener cliente: ${errorMessage}`);
            logger.error('❌ Error obteniendo cliente:', error);
          }
        },

        cargarEstadisticas: async () => {
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.obtenerEstadisticas();
            
            if (!response || !response.data) {
              throw new Error('Respuesta inválida del servidor');
            }
            
            set({ 
              estadisticas: response.data,
              cargando: false 
            });
            logger.info('✅ Estadísticas de clientes cargadas');
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al cargar estadísticas';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al cargar estadísticas: ${errorMessage}`);
            logger.error('❌ Error cargando estadísticas:', error);
          }
        },

        // === ACCIONES CRUD ===
        crearCliente: async (clienteData: CrearClienteDto) => {
          if (!clienteData || !clienteData.nombre?.trim()) {
            toast.error('Nombre del cliente es requerido');
            return false;
          }
          
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.crearCliente(clienteData);
            
            if (!response || !response.data) {
              throw new Error('Error al crear cliente');
            }
            
            // Agregar el nuevo cliente al estado
            set(state => ({
              clientes: [...state.clientes, response.data],
              cargando: false
            }));
            
            toast.success(`✅ Cliente "${response.data.nombre}" creado exitosamente`);
            logger.info('✅ Cliente creado:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al crear cliente';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al crear cliente: ${errorMessage}`);
            logger.error('❌ Error creando cliente:', error);
            return false;
          }
        },

        actualizarCliente: async (id: string, clienteData: ActualizarClienteDto) => {
          if (!id) {
            toast.error('ID de cliente requerido');
            return false;
          }
          
          if (!clienteData || !clienteData.nombre?.trim()) {
            toast.error('Nombre del cliente es requerido');
            return false;
          }
          
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.actualizarCliente(id, clienteData);
            
            if (!response || !response.data) {
              throw new Error('Error al actualizar cliente');
            }
            
            // Actualizar en el estado
            set(state => ({
              clientes: state.clientes.map(c => 
                c.id === id ? response.data : c
              ),
              clienteSeleccionado: state.clienteSeleccionado?.id === id 
                ? response.data 
                : state.clienteSeleccionado,
              cargando: false
            }));
            
            toast.success(`✅ Cliente "${response.data.nombre}" actualizado exitosamente`);
            logger.info('✅ Cliente actualizado:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al actualizar cliente';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al actualizar cliente: ${errorMessage}`);
            logger.error('❌ Error actualizando cliente:', error);
            return false;
          }
        },

        eliminarCliente: async (id: string) => {
          if (!id) {
            toast.error('ID de cliente requerido');
            return false;
          }
          
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.eliminarCliente(id);
            
            if (!response || !response.data) {
              throw new Error('Error al eliminar cliente');
            }
            
            // Actualizar en el estado
            set(state => ({
              clientes: state.clientes.map(c => 
                c.id === id ? response.data : c
              ),
              clienteSeleccionado: state.clienteSeleccionado?.id === id 
                ? response.data 
                : state.clienteSeleccionado,
              cargando: false
            }));
            
            toast.success(`✅ Cliente "${response.data.nombre}" eliminado exitosamente`);
            logger.info('✅ Cliente eliminado:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al eliminar cliente';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al eliminar cliente: ${errorMessage}`);
            logger.error('❌ Error eliminando cliente:', error);
            return false;
          }
        },

        restaurarCliente: async (id: string) => {
          if (!id) {
            toast.error('ID de cliente requerido');
            return false;
          }
          
          set({ cargando: true, error: null });
          try {
            const response = await clientesService.restaurarCliente(id);
            
            if (!response || !response.data) {
              throw new Error('Error al restaurar cliente');
            }
            
            // Actualizar en el estado
            set(state => ({
              clientes: state.clientes.map(c => 
                c.id === id ? response.data : c
              ),
              clienteSeleccionado: state.clienteSeleccionado?.id === id 
                ? response.data 
                : state.clienteSeleccionado,
              cargando: false
            }));
            
            toast.success(`✅ Cliente "${response.data.nombre}" restaurado exitosamente`);
            logger.info('✅ Cliente restaurado:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Error desconocido al restaurar cliente';
            
            set({ 
              error: errorMessage,
              cargando: false 
            });
            
            toast.error(`Error al restaurar cliente: ${errorMessage}`);
            logger.error('❌ Error restaurando cliente:', error);
            return false;
          }
        },

        // === ACCIONES CRUD LOCALES (Compatibilidad) ===
        // Nota: Estas funciones están deshabilitadas ya que todo se maneja vía endpoints
        agregarCliente: (cliente: Omit<Cliente, 'id' | 'fechaRegistro'>) => {
          logger.warning('❌ Función local deshabilitada. Usar crearCliente() en su lugar.');
        },

        actualizarClienteLocal: (id: string, clienteActualizado: Partial<Cliente>) => {
          logger.warning('❌ Función local deshabilitada. Usar actualizarCliente() en su lugar.');
        },

        eliminarClienteLocal: (id: string) => {
          logger.warning('❌ Función local deshabilitada. Usar eliminarCliente() en su lugar.');
        },

        obtenerClientePorId: (id: string) => {
          logger.warning('❌ Función local deshabilitada. Usar obtenerCliente() en su lugar.');
          return undefined;
        },

        // === ACCIONES DE UI ===
        seleccionarCliente: (cliente: Cliente | null) => {
          set({ clienteSeleccionado: cliente });
        },

        limpiarError: () => {
          set({ error: null });
        },

        // === BÚSQUEDA Y FILTROS ===
        // Nota: Estas funciones están deshabilitadas ya que todo se maneja vía endpoints
        buscarClientes: (query = '') => {
          logger.warning('❌ Búsqueda local deshabilitada. Usar cargarClientesPaginados() con filtros en su lugar.');
          return [];
        },

        obtenerClientesActivos: () => {
          logger.warning('❌ Función local deshabilitada. Usar cargarClientesPaginados() con filtros en su lugar.');
          return [];
        },

        obtenerClientesConSeñas: () => {
          logger.warning('❌ Función local deshabilitada. Usar cargarClientesPaginados() con filtros en su lugar.');
          return [];
        },

        // === SISTEMA ===
        reiniciar: () => {
          set(estadoInicial);
          logger.info('Store de clientes reiniciado');
        },
      }),
      {
        name: 'clientes-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          clientes: state.clientes,
        }),
      }
    ),
    {
      name: 'ClientesStore',
    }
  )
); 