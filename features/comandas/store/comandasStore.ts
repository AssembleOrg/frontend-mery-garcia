'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { 
  comandasService,
  CrearComandaDto,
  ActualizarComandaDto,
  FiltrarComandasDto,
  Comanda,
  UnidadNegocio,
  Caja,
  EstadoComanda,
  TipoMoneda,
  TipoPago
} from '@/services/comandas.service';
import { logger, obtenerNumeroComandaManual } from '@/lib/utils';

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

interface ComandasState {
  // Estado
  comandas: Comanda[];
  comandaSeleccionada: Comanda | null;
  cargando: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  estadisticas: {
    totalComandas: number;
    comandasPendientes: number;
    comandasCompletadas: number;
    comandasCanceladas: number;
    totalIngresos: number;
    totalEgresos: number;
    comandasPorUnidad: Record<string, number>;
    comandasPorEstado: Record<string, number>;
  } | null;

  // Acciones de carga
  cargarComandas: () => Promise<void>;
  cargarComandasPaginadas: (filtros?: FiltrarComandasDto) => Promise<void>;
  obtenerComanda: (id: string) => Promise<void>;
  cargarEstadisticas: () => Promise<void>;

  // Acciones CRUD
  crearComanda: (comandaData: CrearComandaDto) => Promise<boolean>;
  crearComandaManual: (tipo: 'ingreso' | 'egreso', monto: number, detalle: string, moneda?: 'USD' | 'ARS', cajaDestino?: string) => Promise<boolean>;
  actualizarComanda: (id: string, comandaData: ActualizarComandaDto) => Promise<boolean>;
  eliminarComanda: (id: string) => Promise<boolean>;

  // Acciones de UI
  seleccionarComanda: (comanda: Comanda | null) => void;
  limpiarError: () => void;

  // Sistema
  reiniciar: () => void;
}

const estadoInicial = {
  comandas: [],
  comandaSeleccionada: null,
  cargando: false,
  error: null,
  pagination: null,
  estadisticas: null,
};

export const useComandasStore = create<ComandasState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === ACCIONES DE CARGA ===
        cargarComandas: async () => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.obtenerComandas();
            set({ 
              comandas: response.data,
              cargando: false 
            });
            logger.info('✅ Comandas cargadas:', response.data.length);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar comandas';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error cargando comandas:', error);
          }
        },

        cargarComandasPaginadas: async (filtros?: FiltrarComandasDto) => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.obtenerComandasPaginadas(filtros);
            console.log('response', response);
            set({ 
              comandas: response.data,
              pagination: response.pagination || null,
              cargando: false 
            });
            logger.warning('✅ Comandas paginadas cargadas:', response.data, response);
            logger.info('✅ Comandas paginadas cargadas:', response.data.length, response);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar comandas paginadas';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error cargando comandas paginadas:', error);
          }
        },

        obtenerComanda: async (id: string) => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.obtenerComanda(id);
            set({ 
              comandaSeleccionada: response.data,
              cargando: false 
            });
            logger.info('✅ Comanda obtenida:', response.data);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al obtener comanda';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error obteniendo comanda:', error);
          }
        },

        cargarEstadisticas: async () => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.obtenerEstadisticas();
            set({ 
              estadisticas: response.data,
              cargando: false 
            });
            logger.info('✅ Estadísticas de comandas cargadas');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar estadísticas';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error cargando estadísticas:', error);
          }
        },

        // === ACCIONES CRUD ===
        crearComanda: async (comandaData: CrearComandaDto) => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.crearComanda(comandaData);
            
            // Agregar la nueva comanda al estado
            set(state => ({
              comandas: [...state.comandas, response.data],
              cargando: false
            }));
            
            toast.success(`Comanda "${response.data.numero}" creada exitosamente`);
            logger.info('✅ Comanda creada:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear comanda';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error creando comanda:', error);
            return false;
          }
        },

        crearComandaManual: async (tipo: 'ingreso' | 'egreso', monto: number, detalle: string, moneda: 'USD' | 'ARS' = 'USD', cajaDestino?: string) => {
          set({ cargando: true, error: null });
          try {
            // Crear DTO para comanda manual
            const comandaManualData: CrearComandaDto = {
              numero: obtenerNumeroComandaManual(),
              fecha: new Date().toISOString(),
              unidadNegocio: UnidadNegocio.TATTOO,
              clienteId: 'manual-movement',
              personalPrincipalId: 'admin-manual',
              enCaja: Caja.CAJA_1,
              estado: EstadoComanda.COMPLETADO,
              moneda: moneda as TipoMoneda,
              subtotal: monto,
              totalDescuentos: 0,
              totalRecargos: 0,
              totalPrepago: 0,
              totalFinal: monto,
              precioDolar: 0, // TODO: Obtener del tipo de cambio
              observaciones: `Movimiento manual: ${detalle}`,
              items: [
                {
                  nombre: detalle,
                  precio: monto,
                  cantidad: 1,
                  descuento: 0,
                  subtotal: monto,
                }
              ],
              metodosPago: [
                {
                  tipo: TipoPago.EFECTIVO,
                  monto: monto,
                  recargoPorcentaje: 0,
                  montoFinal: monto,
                }
              ],
            };

            const response = await comandasService.crearComanda(comandaManualData);
            
            // Agregar la nueva comanda al estado
            set(state => ({
              comandas: [...state.comandas, response.data],
              cargando: false
            }));
            
            toast.success(`Movimiento manual "${response.data.numero}" creado exitosamente`);
            logger.info('✅ Comanda manual creada:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al crear movimiento manual';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error creando comanda manual:', error);
            return false;
          }
        },

        actualizarComanda: async (id: string, comandaData: ActualizarComandaDto) => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.actualizarComanda(id, comandaData);
            
            // Actualizar en el estado
            set(state => ({
              comandas: state.comandas.map(c => 
                c.id === id ? response.data : c
              ),
              comandaSeleccionada: state.comandaSeleccionada?.id === id 
                ? response.data 
                : state.comandaSeleccionada,
              cargando: false
            }));
            
            toast.success(`Comanda "${response.data.numero}" actualizada exitosamente`);
            logger.info('✅ Comanda actualizada:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al actualizar comanda';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error actualizando comanda:', error);
            return false;
          }
        },

        eliminarComanda: async (id: string) => {
          set({ cargando: true, error: null });
          try {
            const response = await comandasService.eliminarComanda(id);
            
            // Remover del estado
            set(state => ({
              comandas: state.comandas.filter(c => c.id !== id),
              comandaSeleccionada: state.comandaSeleccionada?.id === id 
                ? null 
                : state.comandaSeleccionada,
              cargando: false
            }));
            
            toast.success(`Comanda "${response.data.numero}" eliminada exitosamente`);
            logger.info('✅ Comanda eliminada:', response.data);
            return true;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar comanda';
            set({ 
              error: errorMessage,
              cargando: false 
            });
            toast.error(errorMessage);
            logger.error('❌ Error eliminando comanda:', error);
            return false;
          }
        },

        // === ACCIONES DE UI ===
        seleccionarComanda: (comanda: Comanda | null) => {
          set({ comandaSeleccionada: comanda });
        },

        limpiarError: () => {
          set({ error: null });
        },

        // === SISTEMA ===
        reiniciar: () => {
          set(estadoInicial);
          logger.info('Store de comandas reiniciado');
        },
      }),
      {
        name: 'comandas-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          comandas: state.comandas,
        }),
      }
    ),
    {
      name: 'ComandasStore',
    }
  )
); 