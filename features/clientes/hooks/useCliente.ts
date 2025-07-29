'use client';

import { useClienteStore } from '../store/clienteStore';
import { Cliente } from '@/types/caja';

export const useCliente = () => {
  const {
    clientes,
    cargando,
    error,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerClientePorId,
    buscarCliente,
    obtenerClientesActivos,
    limpiarError,
    reiniciar,
  } = useClienteStore();

  return {
    clientes,
    cargando,
    error,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerClientePorId,
    buscarCliente,
    obtenerClientesActivos,
    limpiarError,
    reiniciar,
  };
};
