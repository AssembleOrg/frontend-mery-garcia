import { productosServiciosService } from '@/services/productosServicios.service';
import { FiltrarProductosServiciosNew, ProductoServicioCreateNew, ProductoServicioNew, TipoProductoServicioNew } from '@/services/unidadNegocio.service';
import { create } from 'zustand';

interface ProductosServiciosState {
  productosServicios: ProductoServicioNew[];
  productosServiciosPaginados: { data: ProductoServicioNew[]; meta: { total: number; page: number; limit: number; totalPages: number; } };
  isLoading: boolean;
  error: string | undefined;
  hasLoaded: boolean;
  setProductosServicios: (productosServicios: ProductoServicioNew[]) => void;
  crearProductoServicio: (productoServicio: ProductoServicioCreateNew) => Promise<ProductoServicioNew>;
  loadProductosServicios: () => Promise<ProductoServicioNew[]>;
  clear: () => void;
  reloadProductosServicios: () => Promise<void>;
  getProductosServiciosPaginados: (filtros: FiltrarProductosServiciosNew) => Promise<{
    data: ProductoServicioNew[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
  reloadProductosServiciosPaginados: (filtros: FiltrarProductosServiciosNew) => Promise<{
    data: ProductoServicioNew[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>;
  cambiarEstado: (id: string, activo: boolean) => Promise<ProductoServicioNew | undefined>;
}

const useProductosServiciosStore = create<ProductosServiciosState>((set,get) => ({
  productosServicios: [],
  productosServiciosPaginados: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } },
  isLoading: false,
  error: undefined,
  hasLoaded: false,
  crearProductoServicio: async (productoServicio: ProductoServicioCreateNew) => {
    set({ isLoading: true });
    const productoServicioResponse = await productosServiciosService.crearProductoServicio(productoServicio);
    set({ productosServicios: [...get().productosServicios, productoServicioResponse.data] });
    set({ isLoading: false });
    return productoServicioResponse.data;
  },
  actualizarProductoServicio: async (id: string, productoServicio: ProductoServicioCreateNew) => {
    set({ isLoading: true });
    const productoServicioResponse = await productosServiciosService.actualizarProductoServicio(id, productoServicio);
    set({ productosServicios: get().productosServicios.map(producto => producto.id === id ? productoServicioResponse : producto) });
    set({ isLoading: false });
    return productoServicioResponse;
  },
  cambiarEstado: async (id: string, activo: boolean) => {
    if (get().isLoading) return;
    set({ isLoading: true });
    const productoServicio = await productosServiciosService.cambiarEstado(id, activo);
    set({ productosServicios: get().productosServicios.map(producto => producto.id === id ? productoServicio : producto) });
    set({ isLoading: false });
    return productoServicio;
  },
  getProductosServiciosPaginados: async (filtros: FiltrarProductosServiciosNew) => {
    if (get().isLoading) return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } }; 
    set({ isLoading: true });
    const productosServicios = await productosServiciosService.obtenerProductosServiciosPaginados(filtros);
    set({ productosServiciosPaginados: productosServicios });
    set({ hasLoaded: true });
    set({ isLoading: false });
    return productosServicios;
  },
  setProductosServicios: (productosServicios: ProductoServicioNew[]) => {
    set({ productosServicios });
  },
  loadProductosServicios: async () => {
    if (get().isLoading) return [];
    set({ isLoading: true });
    const productosServicios = await productosServiciosService.getProductosServicios();
    set({ productosServicios });
    set({ hasLoaded: true });
    set({ isLoading: false });
    return productosServicios;
  },
  clear: () => {
    set({ productosServicios: [], error: undefined, hasLoaded: false });
  },
  reloadProductosServicios: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    const productosServicios = await productosServiciosService.getProductosServicios();
    set({ productosServicios });
    set({ isLoading: false });
  },
  reloadProductosServiciosPaginados: async (filtros: FiltrarProductosServiciosNew) => {
    if (get().isLoading) return { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };
    set({ isLoading: true });
    const productosServicios = await productosServiciosService.obtenerProductosServiciosPaginados(filtros);
    set({ productosServiciosPaginados: productosServicios });
    set({ isLoading: false });
    return productosServicios;
  },
}));

export default useProductosServiciosStore;
