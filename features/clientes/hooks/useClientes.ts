import { useClientesStore } from '../store/clientesStore';

export const useClientes = () => {
  const store = useClientesStore();
  return {
    // Estado
    clientes: store.clientes,
    clienteSeleccionado: store.clienteSeleccionado,
    cargando: store.cargando,
    error: store.error,
    pagination: store.pagination,
    estadisticas: store.estadisticas,

    // Acciones de carga
    cargarClientes: store.cargarClientes,
    cargarClientesPaginados: store.cargarClientesPaginados,
    obtenerCliente: store.obtenerCliente,
    cargarEstadisticas: store.cargarEstadisticas,

    // Acciones CRUD
    crearCliente: store.crearCliente,
    actualizarCliente: store.actualizarCliente,
    eliminarCliente: store.eliminarCliente,
    restaurarCliente: store.restaurarCliente,

    // Acciones CRUD locales
    agregarCliente: store.agregarCliente,
    actualizarClienteLocal: store.actualizarClienteLocal,
    eliminarClienteLocal: store.eliminarClienteLocal,
    obtenerClientePorId: store.obtenerClientePorId,

    // Acciones de UI
    seleccionarCliente: store.seleccionarCliente,
    limpiarError: store.limpiarError,

    // Búsqueda y filtros
    buscarClientes: store.buscarClientes,
    obtenerClientesActivos: store.obtenerClientesActivos,
    obtenerClientesConSeñas: store.obtenerClientesConSeñas,

    // Sistema
    reiniciar: store.reiniciar,
  };
}; 