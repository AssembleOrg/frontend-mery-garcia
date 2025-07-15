'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { TipoCambio } from '@/types/caja';
import {
  ExchangeRate,
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
  historial: ExchangeRate[];

  // Acciones
  cargarTipoCambioInicial: () => Promise<void>;
  actualizarTipoCambio: (tipoCambio: TipoCambio) => void;
  guardarTipoCambioManual: (valorVenta: number) => Promise<boolean>;
  cargarHistorial: (limit?: number) => Promise<void>;
  reiniciar: () => void;
  limpiarError: () => void;
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
                valorVenta: cotizacion.venta || cotizacion.compra,
                fecha: new Date(cotizacion.fechaActualizacion),
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
              // Usar valores por defecto si no hay cotización
              set({
                inicializado: true,
                cargando: false,
                error:
                  'No se pudo obtener la cotización. Usando valores por defecto.',
              });
            }
          } catch (error) {
            console.error('Error cargando tipo de cambio inicial:', error);
            set({
              cargando: false,
              error: 'Error al cargar el tipo de cambio inicial',
              inicializado: true, // Marcar como inicializado para evitar bucles
            });
          }
        },

        // Actualizar tipo de cambio
        actualizarTipoCambio: (tipoCambio: TipoCambio) => {
          set({ tipoCambio, error: null });
        },

        // Guardar tipo de cambio manual
        guardarTipoCambioManual: async (valorVenta: number) => {
          set({ cargando: true, error: null });
          try {
            const response = await saveManualRate(valorVenta);

            if (response?.data) {
              const tipoCambio: TipoCambio = {
                valorCompra: response.data.compra,
                valorVenta: response.data.venta || valorVenta,
                fecha: new Date(response.data.fechaActualizacion),
                fuente: 'Manual',
                modoManual: true,
              };

              set({ tipoCambio, cargando: false });
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
