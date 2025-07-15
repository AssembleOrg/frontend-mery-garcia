import { useProductosServiciosStore } from '../store/productosServiciosStore';

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
