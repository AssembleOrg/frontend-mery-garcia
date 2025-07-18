'use client';

import { useClienteStore } from '../store/clienteStore';
import { Cliente } from '@/types/caja';

export const useCliente = () => {
  const {
    clientes,
    cargando,
    error,
    agregarCliente: agregarClienteStore,
    actualizarCliente: actualizarClienteStore,
    eliminarCliente,
    obtenerClientePorId,
    agregarSeña,
    usarSeña,
    obtenerSeñasDisponibles,
    buscarCliente,
    obtenerClientesActivos,
    limpiarError,
    reiniciar,
  } = useClienteStore();

  // Wrapper para agregar cliente con seña inicial
  const agregarCliente = (
    clienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'señasDisponibles'>,
    señaInicial?: number
  ) => {
    agregarClienteStore(clienteData, señaInicial);
  };

  // Wrapper para actualizar cliente con señas
  const actualizarCliente = (
    id: string,
    clienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'señasDisponibles'>,
    señasActuales?: number
  ) => {
    const datosActualizados: Partial<Cliente> = {
      ...clienteData,
    };

    // Si se proporcionan señas actuales, incluirlas en la actualización
    if (señasActuales !== undefined) {
      datosActualizados.señasDisponibles = señasActuales;
    }

    actualizarClienteStore(id, datosActualizados);
  };

  return {
    clientes,
    cargando,
    error,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerClientePorId,
    agregarSeña,
    usarSeña,
    obtenerSeñasDisponibles,
    buscarCliente,
    obtenerClientesActivos,
    limpiarError,
    reiniciar,
  };
};
