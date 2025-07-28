'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { TipoCambio } from '@/types/caja';
import {
  DolarResponse,
  getCotizacion,
  getHistorial,
  saveManualRate,
} from '@/services/exchangeRate.service';
import { toast } from 'sonner';

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

interface ExchangeRateState {
  // Estado
  tipoCambio: TipoCambio;
  inicializado: boolean;
  cargando: boolean;
  error: string | null;
  historial: DolarResponse[];

  // Acciones
  cargarTipoCambioInicial: () => Promise<void>;
  actualizarTipoCambio: (tipoCambio: TipoCambio) => void;
  guardarTipoCambioManual: (valorVenta: number, casa?: string) => Promise<boolean>;
  cargarHistorial: (limit?: number) => Promise<void>;
  limpiarHistorial: () => void;
  reiniciar: () => void;
  limpiarError: () => void;
  getTipoCambio: () => TipoCambio;
}

// Estado inicial
const estadoInicial = {
  tipoCambio: {
    valorCompra: 0,
    valorVenta: 0,
    fecha: new Date(),
    fuente: 'Manual',
    modoManual: false,
  } as TipoCambio,
  inicializado: false,
  cargando: false,
  error: null,
  historial: [],
};

export const useExchangeRateStore = create<ExchangeRateState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // Cargar tipo de cambio inicial
        cargarTipoCambioInicial: async () => {
          const { inicializado } = get();
          if (inicializado) return;

          set({ cargando: true, error: null });
          try {
            const cotizacion = await getCotizacion();

            if (cotizacion) {
              const tipoCambio: TipoCambio = {
                valorCompra: cotizacion.compra,
                valorVenta: cotizacion.venta,
                fecha: new Date(cotizacion.fechaActualizacion || new Date()),
                fuente: cotizacion.casa || 'API',
                modoManual: cotizacion.casa === 'Manual',
              };

              set({
                tipoCambio,
                inicializado: true,
                cargando: false,
                error: null,
              });
            } else {
              set({
                inicializado: false,
                cargando: false,
                error:
                  'No se pudo obtener cotización. Debe configurar un valor operativo manualmente.',
              });
            }
          } catch (error) {
            console.error('Error cargando tipo de cambio inicial:', error);
            set({
              cargando: false,
              error:
                'Error al cargar el tipo de cambio. Debe configurar un valor operativo manualmente.',
              inicializado: false,
            });
          }
        },

        // Actualizar tipo de cambio
        actualizarTipoCambio: (tipoCambio: TipoCambio) => {
          set({ tipoCambio, error: null });
        },

        guardarTipoCambioManual: async (valorVenta: number, casa = 'Manual') => {
          set({ cargando: true, error: null });
          try {
            const response = await saveManualRate({ 
              venta: valorVenta, 
              casa 
            });

            if (response?.data) {
              const tipoCambio: TipoCambio = {
                valorCompra: response.data.compra,
                valorVenta: response.data.venta,
                fecha: new Date(response.data.fechaActualizacion || new Date()),
                fuente: response.data.casa || 'Manual',
                modoManual: true,
              };

              set({ tipoCambio, cargando: false });
              
              // Reload history to get the latest entry
              get().cargarHistorial();
              
              toast.success('Tipo de cambio actualizado correctamente');
              return true;
            }

            throw new Error('Respuesta inválida del servidor');
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Error al guardar tipo de cambio';
            set({ cargando: false, error: errorMessage });
            toast.error(errorMessage);
            return false;
          }
        },
        getTipoCambio: () => {
          return get().tipoCambio;
        },

        // Cargar historial
        cargarHistorial: async (limit = 10) => {
          set({ cargando: true, error: null });
          try {
            const historial = await getHistorial(limit);
            set({ historial: historial || [], cargando: false });
          } catch (error) {
            console.error('Error cargando historial:', error);
            set({
              cargando: false,
              error: 'Error al cargar el historial de tipos de cambio',
            });
          }
        },

        // Limpiar historial (solo local, el backend mantiene su historial)
        limpiarHistorial: () => {
          set({ historial: [] });
          toast.info('Historial local limpiado');
        },

        // Reiniciar store
        reiniciar: () => {
          set(estadoInicial);
        },

        // Limpiar error
        limpiarError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'exchange-rate-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          tipoCambio: state.tipoCambio,
          inicializado: state.inicializado,
        }),
      }
    ),
    {
      name: 'exchange-rate-store',
    }
  )
);
