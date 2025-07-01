import {
  EstadoComandaNegocio,
  ComandaConValidacion,
  TrazabilidadComanda,
  HistorialCambio,
} from '@/types/caja';

import { logger } from '@/lib/utils';

// Tipos para los payloads de las acciones
export interface CambiarEstadoPayload {
  comandaId: string;
  nuevoEstado: EstadoComandaNegocio;
  observaciones?: string;
  usuarioId: string;
}

export interface ValidarComandaPayload {
  comandaId: string;
  observaciones?: string;
  adminId: string;
}

export interface RespuestaValidacion {
  exito: boolean;
  mensaje: string;
  data?: Record<string, unknown>;
  errores?: string[];
}

// Simular delay de red
const mockDelay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock del usuario actual (en producción vendría del AuthService)
export const obtenerUsuarioActual = async () => {
  await mockDelay(100);
  return {
    id: 'user-1',
    nombre: 'Usuario Demo',
    rol: 'admin' as 'admin' | 'vendedor',
  };
};

// Cambiar estado de comanda (vendedor)
export const cambiarEstadoComanda = async (
  payload: CambiarEstadoPayload
): Promise<RespuestaValidacion> => {
  logger.info('[MOCK API] Cambiar estado comanda:', payload);

  try {
    await mockDelay();

    // Validaciones de negocio
    if (
      payload.nuevoEstado === 'completado' &&
      !payload.observaciones?.trim()
    ) {
      return {
        exito: false,
        mensaje: 'Se requieren observaciones para marcar como completado',
        errores: ['Observaciones requeridas para estado completado'],
      };
    }

    // Simular actualización en backend
    const trazabilidad: TrazabilidadComanda = {
      creadoPor: payload.usuarioId,
      fechaCreacion: new Date().toISOString(),
      modificadoPor: payload.usuarioId,
      fechaModificacion: new Date().toISOString(),
    };

    const historialCambio: HistorialCambio = {
      id: `cambio-${Date.now()}`,
      comandaId: payload.comandaId,
      usuario: payload.usuarioId,
      accion: 'cambio_estado',
      estadoAnterior: { estado: 'pendiente' }, // En producción se obtendría de la BD
      estadoNuevo: {
        estado: payload.nuevoEstado,
        observaciones: payload.observaciones,
      },
      fecha: new Date().toISOString(),
      observaciones: payload.observaciones,
    };

    // Log para debugging
    logger.success('[MOCK API] Estado cambiado exitosamente');
    logger.debug('[MOCK API] Trazabilidad:', trazabilidad);
    logger.debug('[MOCK API] Historial:', historialCambio);

    return {
      exito: true,
      mensaje: `Estado cambiado a "${payload.nuevoEstado}" exitosamente`,
      data: {
        trazabilidad,
        historialCambio,
      },
    };
  } catch (error) {
    logger.error('[MOCK API] Error al cambiar estado:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor',
      errores: ['Error al procesar la solicitud'],
    };
  }
};

// Validar comanda (admin)
export const validarComanda = async (
  payload: ValidarComandaPayload
): Promise<RespuestaValidacion> => {
  console.log('✅ [MOCK API] Validar comanda:', payload);

  try {
    await mockDelay(800); // Simular operación más lenta

    // En producción: verificar que el usuario sea admin
    const usuario = await obtenerUsuarioActual();
    if (usuario.rol !== 'admin') {
      return {
        exito: false,
        mensaje: 'Solo los administradores pueden validar comandas',
        errores: ['Permisos insuficientes'],
      };
    }

    // Simular validación en backend
    const trazabilidad: TrazabilidadComanda = {
      creadoPor: 'sistema',
      fechaCreacion: new Date().toISOString(),
      validadoPor: payload.adminId,
      fechaValidacion: new Date().toISOString(),
      observacionesValidacion: payload.observaciones,
    };

    const historialCambio: HistorialCambio = {
      id: `validacion-${Date.now()}`,
      comandaId: payload.comandaId,
      usuario: payload.adminId,
      accion: 'validacion',
      estadoAnterior: { estadoValidacion: 'no_validado' },
      estadoNuevo: {
        estadoValidacion: 'validado',
        observaciones: payload.observaciones,
      },
      fecha: new Date().toISOString(),
      observaciones: payload.observaciones,
    };

    // Log para debugging
    console.log('🔒 [MOCK API] Comanda validada exitosamente');
    console.log('📋 [MOCK API] Trazabilidad:', trazabilidad);
    console.log('📝 [MOCK API] Historial:', historialCambio);

    return {
      exito: true,
      mensaje: 'Comanda validada exitosamente.',
      data: {
        trazabilidad,
        historialCambio,
      },
    };
  } catch (error) {
    console.error('❌ [MOCK API] Error al validar comanda:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor',
      errores: ['Error al procesar la validación'],
    };
  }
};

// Obtener historial de una comanda
export const obtenerHistorialComanda = async (
  comandaId: string
): Promise<RespuestaValidacion> => {
  console.log('📜 [MOCK API] Obtener historial:', comandaId);

  try {
    await mockDelay(300);

    // Mock del historial
    const historial: HistorialCambio[] = [
      {
        id: 'hist-1',
        comandaId,
        usuario: 'user-1',
        accion: 'creacion',
        estadoAnterior: {},
        estadoNuevo: { estado: 'pendiente' },
        fecha: new Date(Date.now() - 86400000).toISOString(), // Ayer
        observaciones: 'Comanda creada',
      },
      {
        id: 'hist-2',
        comandaId,
        usuario: 'user-1',
        accion: 'cambio_estado',
        estadoAnterior: { estado: 'pendiente' },
        estadoNuevo: { estado: 'completado' },
        fecha: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
        observaciones: 'Servicio completado, pago recibido',
      },
    ];

    return {
      exito: true,
      mensaje: 'Historial obtenido exitosamente',
      data: { historial },
    };
  } catch (error) {
    console.error('❌ [MOCK API] Error al obtener historial:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener el historial',
      errores: ['Error interno del servidor'],
    };
  }
};

// Obtener comandas validadas para traspaso
export const obtenerComandasValidadas = async (
  fechaDesde: string,
  fechaHasta: string
): Promise<RespuestaValidacion> => {
  console.log('📦 [MOCK API] Obtener comandas validadas:', {
    fechaDesde,
    fechaHasta,
  });

  try {
    await mockDelay(400);

    // Mock de comandas validadas (en producción vendría de la BD)
    const comandasValidadas: ComandaConValidacion[] = [];

    return {
      exito: true,
      mensaje: `${comandasValidadas.length} comandas validadas encontradas`,
      data: { comandasValidadas },
    };
  } catch (error) {
    console.error('❌ [MOCK API] Error al obtener comandas validadas:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener comandas validadas',
      errores: ['Error interno del servidor'],
    };
  }
};

// Realizar traspaso a Caja 2
export const realizarTraspaso = async (
  comandaIds: string[],
  observaciones?: string
): Promise<RespuestaValidacion> => {
  console.log('🚚 [MOCK API] Realizar traspaso:', {
    comandaIds,
    observaciones,
  });

  try {
    await mockDelay(1000); // Operación más lenta

    const usuario = await obtenerUsuarioActual();
    if (usuario.rol !== 'admin') {
      return {
        exito: false,
        mensaje: 'Solo los administradores pueden realizar traspasos',
        errores: ['Permisos insuficientes'],
      };
    }

    // Simular traspaso
    const traspasoInfo = {
      id: `traspaso-${Date.now()}`,
      fechaTraspaso: new Date().toISOString(),
      adminQueTraspaso: usuario.id,
      comandasTraspasadas: comandaIds,
      observaciones,
    };

    console.log('🎯 [MOCK API] Traspaso realizado exitosamente:', traspasoInfo);

    return {
      exito: true,
      mensaje: `${comandaIds.length} comandas traspasadas exitosamente a Caja 2`,
      data: traspasoInfo,
    };
  } catch (error) {
    console.error('❌ [MOCK API] Error al realizar traspaso:', error);
    return {
      exito: false,
      mensaje: 'Error al realizar el traspaso',
      errores: ['Error interno del servidor'],
    };
  }
};

// Función para determinar permisos (se usará en el store)
export const calcularPermisosComanda = (
  comanda: Partial<ComandaConValidacion>,
  usuarioRol: 'admin' | 'vendedor'
) => {
  const estaValidado = comanda.estadoValidacion === 'validado';
  const esAdmin = usuarioRol === 'admin';

  return {
    // ✅ ADMIN PUEDE TODO - VENDEDOR LIMITADO SI ESTÁ VALIDADO
    puedeEditar: esAdmin || !estaValidado,
    puedeEliminar: esAdmin,
    puedeCambiarEstado: esAdmin || !estaValidado,
    puedeValidar: esAdmin, // Admin puede validar Y revertir validación
    puedeVerHistorial: true,
  };
};
