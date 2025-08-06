'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';

// Configuraciones de descuentos por método de pago
export interface ConfiguracionDescuentos {
  EFECTIVO: number;
  TRANSFERENCIA: number;
  TARJETA: number;
  GIFT_CARD: number;
  QR: number;
  PRECIO_LISTA: number;
}

interface ConfiguracionState {
  descuentosPorMetodo: ConfiguracionDescuentos;
  actualizarDescuentoMetodo: (
    metodo: keyof ConfiguracionDescuentos,
    porcentaje: number
  ) => void;
  resetearConfiguracion: () => void;
}

const configuracionInicial: ConfiguracionDescuentos = {
  EFECTIVO: 10,
  TRANSFERENCIA: 5,
  TARJETA: 0,
  GIFT_CARD: 0,
  QR: 0,
  PRECIO_LISTA: 0,
};

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
  };
});

export const useConfiguracionStore = create<ConfiguracionState>()(
  devtools(
    persist(
      (set, get) => ({
        descuentosPorMetodo: configuracionInicial,

        actualizarDescuentoMetodo: (
          metodo: keyof ConfiguracionDescuentos,
          porcentaje: number
        ) => {
          set((state: ConfiguracionState) => ({
            descuentosPorMetodo: {
              ...state.descuentosPorMetodo,
              [metodo]: Math.max(0, Math.min(100, porcentaje)),
            },
          }));
        },

        resetearConfiguracion: () => {
          set({ descuentosPorMetodo: configuracionInicial });
        },
      }),
      {
        name: 'configuracion-descuentos',
        storage: safeJSONStorage,
      }
    ),
    { name: 'configuracion-store' }
  )
);

// Hook para usar la configuración
export const useConfiguracion = () => {
  const store = useConfiguracionStore();
  return {
    descuentosPorMetodo: store.descuentosPorMetodo,
    actualizarDescuentoMetodo: store.actualizarDescuentoMetodo,
    resetearConfiguracion: store.resetearConfiguracion,
  };
};
