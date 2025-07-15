'use client';

import { usePersonalStore } from '../store/personalStore';

export const usePersonal = () => {
  const store = usePersonalStore();

  return {
    // Estado
    personal: store.personalSimple,
    personalCompleto: store.personal,
    cargando: store.cargando,
    error: store.error,

    // Acciones
    agregar: store.agregarPersonal,
    actualizar: store.actualizarPersonal,
    eliminar: store.eliminarPersonal,
    buscar: store.buscarPersonal,

    // Utilidades
    obtenerPersonalPorUnidad: store.obtenerPersonalPorUnidad,
    obtenerPorId: store.obtenerPersonalPorId,
    limpiarError: store.limpiarError,
  };
};
