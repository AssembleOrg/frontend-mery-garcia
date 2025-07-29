'use client';

import { useSenaStore } from '../store/senaStore';
import { CrearSenaData, FiltrosSena } from '@/types/sena';
import { useClienteStore } from '@/features/clientes/store/clienteStore';

export const useSenas = () => {
  const {
    senas,
    cargando,
    error,
    crearSena,
    obtenerSenas,
    obtenerSenaPorId,
    usarSena,
    cancelarSena,
    actualizarSena,
    obtenerSenasDisponiblesPorCliente,
    obtenerResumenPorCliente,
    obtenerEstadisticasGenerales,
    validarSenaDisponible,
    calcularMontoDisponible,
    limpiarError,
    reiniciar,
    cargarDatosPrueba,
    limpiarDatos,
  } = useSenaStore();

  const { clientes } = useClienteStore();

  // Wrapper functions with additional logic if needed
  const crearSenaCompleta = async (data: CrearSenaData) => {
    try {
      const senaId = await crearSena(data);
      return { success: !!senaId, senaId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  };

  const obtenerSenasConClientes = async (filtros?: FiltrosSena) => {
    const senasResult = await obtenerSenas(filtros);
    return senasResult.map(sena => ({
      ...sena,
      clienteNombre: clientes.find(c => c.id === sena.clienteId)?.nombre || 'Cliente no encontrado'
    }));
  };

  const obtenerResumenConNombreCliente = (clienteId: string) => {
    const resumen = obtenerResumenPorCliente(clienteId);
    if (!resumen) return null;

    const cliente = clientes.find(c => c.id === clienteId);
    return {
      ...resumen,
      clienteNombre: cliente?.nombre || 'Cliente no encontrado'
    };
  };

  return {
    // Estado
    senas,
    cargando,
    error,

    // Operaciones CRUD
    crearSena: crearSenaCompleta,
    obtenerSenas: obtenerSenasConClientes,
    obtenerSenaPorId,
    usarSena,
    cancelarSena,
    actualizarSena,

    // Consultas específicas
    obtenerSenasDisponiblesPorCliente,
    obtenerResumenPorCliente: obtenerResumenConNombreCliente,
    obtenerEstadisticasGenerales,

    // Validaciones
    validarSenaDisponible,
    calcularMontoDisponible,

    // Sistema
    limpiarError,
    reiniciar,

    // Testing utilities
    cargarDatosPrueba,
    limpiarDatos,
  };
};