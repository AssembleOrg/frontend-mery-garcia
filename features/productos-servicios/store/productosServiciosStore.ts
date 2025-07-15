'use client';

import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import { ProductoServicio, UnidadNegocio } from '@/types/caja';
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

interface ProductosServiciosState {
  // Estado
  productosServicios: ProductoServicio[];
  cargando: boolean;
  error: string | null;

  // Acciones CRUD
  agregarProductoServicio: (producto: Omit<ProductoServicio, 'id'>) => void;
  actualizarProductoServicio: (
    id: string,
    producto: Partial<ProductoServicio>
  ) => void;
  eliminarProductoServicio: (id: string) => void;
  obtenerProductoServicioPorId: (id: string) => ProductoServicio | undefined;

  // Búsqueda y filtros
  buscarProductosServicios: (
    query?: string,
    unidad?: UnidadNegocio
  ) => ProductoServicio[];
  obtenerProductosActivos: () => ProductoServicio[];
  obtenerProductosPorUnidad: (unidad: UnidadNegocio) => ProductoServicio[];

  // Sistema
  reiniciar: () => void;
  limpiarError: () => void;
}

const estadoInicial = {
  productosServicios: [],
  cargando: false,
  error: null,
};

export const useProductosServiciosStore = create<ProductosServiciosState>()(
  devtools(
    persist(
      (set, get) => ({
        ...estadoInicial,

        // === ACCIONES CRUD ===
        agregarProductoServicio: (producto: Omit<ProductoServicio, 'id'>) => {
          const nuevoProducto: ProductoServicio = {
            ...producto,
            id: `producto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          set((state) => ({
            productosServicios: [...state.productosServicios, nuevoProducto],
            error: null,
          }));

          logger.info('✅ Producto/Servicio creado:', nuevoProducto);
        },

        actualizarProductoServicio: (
          id: string,
          productoActualizado: Partial<ProductoServicio>
        ) => {
          set((state) => ({
            productosServicios: state.productosServicios.map((p) =>
              p.id === id ? { ...p, ...productoActualizado } : p
            ),
            error: null,
          }));

          logger.info('✅ Producto/Servicio actualizado:', {
            id,
            ...productoActualizado,
          });
        },

        eliminarProductoServicio: (id: string) => {
          set((state) => ({
            productosServicios: state.productosServicios.filter(
              (p) => p.id !== id
            ),
            error: null,
          }));

          logger.info('✅ Producto/Servicio eliminado:', id);
        },

        obtenerProductoServicioPorId: (id: string) => {
          return get().productosServicios.find((p) => p.id === id);
        },

        // === BÚSQUEDA Y FILTROS ===
        buscarProductosServicios: (query = '', unidad?: UnidadNegocio) => {
          const { productosServicios } = get();
          const texto = query.trim().toLowerCase();

          return productosServicios.filter((ps) => {
            const coincideTexto =
              texto === '' || ps.nombre.toLowerCase().includes(texto);
            const coincideUnidad = unidad ? ps.businessUnit === unidad : true;
            return coincideTexto && coincideUnidad && ps.activo;
          });
        },

        obtenerProductosActivos: () => {
          const { productosServicios } = get();
          return productosServicios.filter((p) => p.activo);
        },

        obtenerProductosPorUnidad: (unidad: UnidadNegocio) => {
          const { productosServicios } = get();
          return productosServicios.filter(
            (p) => p.businessUnit === unidad && p.activo
          );
        },

        // === SISTEMA ===
        reiniciar: () => {
          set(estadoInicial);
          logger.info('Store de productos/servicios reiniciado');
        },

        limpiarError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'productos-servicios-store',
        storage: safeJSONStorage,
        partialize: (state) => ({
          productosServicios: state.productosServicios,
        }),
      }
    ),
    {
      name: 'ProductosServiciosStore',
    }
  )
);

// Hook especializado para productos/servicios
export const useProductosServicios = () => {
  const store = useProductosServiciosStore();
  return {
    // Estado
    productosServicios: store.productosServicios,
    cargando: store.cargando,
    error: store.error,

    // Acciones CRUD
    agregarProductoServicio: store.agregarProductoServicio,
    actualizarProductoServicio: store.actualizarProductoServicio,
    eliminarProductoServicio: store.eliminarProductoServicio,
    obtenerProductoServicioPorId: store.obtenerProductoServicioPorId,

    // Búsqueda y filtros
    buscarProductosServicios: store.buscarProductosServicios,
    obtenerProductosActivos: store.obtenerProductosActivos,
    obtenerProductosPorUnidad: store.obtenerProductosPorUnidad,

    // Sistema
    reiniciar: store.reiniciar,
    limpiarError: store.limpiarError,
  };
};

// Hook para datos de referencia (mantiene compatibilidad)
export const useDatosReferencia = () => {
  const store = useProductosServiciosStore();
  return {
    productosServicios: store.productosServicios,
    buscarProductosServicios: store.buscarProductosServicios,
    agregarProductoServicio: store.agregarProductoServicio,
    actualizarProductoServicio: store.actualizarProductoServicio,
    eliminarProductoServicio: store.eliminarProductoServicio,
    obtenerProductoServicioPorId: store.obtenerProductoServicioPorId,
  };
};
