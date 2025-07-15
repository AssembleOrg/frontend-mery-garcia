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

// === CLIENTE API PURO - SIN LÓGICA DE NEGOCIO ===

// Cambiar estado de comanda - Solo llamada HTTP
export const cambiarEstadoComanda = async (
  payload: CambiarEstadoPayload
): Promise<RespuestaValidacion> => {
  logger.info('[API] Cambiar estado comanda:', payload);

  try {
    await mockDelay();

    // Simular actualización en backend - Solo transformación de datos
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
      estadoAnterior: { estado: 'pendiente' },
      estadoNuevo: {
        estado: payload.nuevoEstado,
        observaciones: payload.observaciones,
      },
      fecha: new Date().toISOString(),
      observaciones: payload.observaciones,
    };

    logger.success('[API] Estado cambiado exitosamente');

    return {
      exito: true,
      mensaje: `Estado cambiado a "${payload.nuevoEstado}" exitosamente`,
      data: {
        trazabilidad,
        historialCambio,
      },
    };
  } catch (error) {
    logger.error('[API] Error al cambiar estado:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor',
      errores: ['Error al procesar la solicitud'],
    };
  }
};

// Validar comanda - Solo llamada HTTP
export const validarComanda = async (
  payload: ValidarComandaPayload
): Promise<RespuestaValidacion> => {
  logger.info('[API] Validar comanda:', payload);

  try {
    await mockDelay(800);

    // Simular validación en backend - Solo transformación de datos
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

    logger.success('[API] Comanda validada exitosamente');

    return {
      exito: true,
      mensaje: 'Comanda validada exitosamente.',
      data: {
        trazabilidad,
        historialCambio,
      },
    };
  } catch (error) {
    logger.error('[API] Error al validar comanda:', error);
    return {
      exito: false,
      mensaje: 'Error interno del servidor',
      errores: ['Error al procesar la validación'],
    };
  }
};

// Obtener historial de una comanda - Solo llamada HTTP
export const obtenerHistorialComanda = async (
  comandaId: string
): Promise<RespuestaValidacion> => {
  logger.info('[API] Obtener historial:', comandaId);

  try {
    await mockDelay(300);

    // Mock del historial - Solo transformación de datos
    const historial: HistorialCambio[] = [
      {
        id: 'hist-1',
        comandaId,
        usuario: 'user-1',
        accion: 'creacion',
        estadoAnterior: {},
        estadoNuevo: { estado: 'pendiente' },
        fecha: new Date(Date.now() - 86400000).toISOString(),
        observaciones: 'Comanda creada',
      },
      {
        id: 'hist-2',
        comandaId,
        usuario: 'user-1',
        accion: 'cambio_estado',
        estadoAnterior: { estado: 'pendiente' },
        estadoNuevo: { estado: 'completado' },
        fecha: new Date(Date.now() - 3600000).toISOString(),
        observaciones: 'Servicio completado, pago recibido',
      },
    ];

    return {
      exito: true,
      mensaje: 'Historial obtenido exitosamente',
      data: { historial },
    };
  } catch (error) {
    logger.error('[API] Error al obtener historial:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener el historial',
      errores: ['Error interno del servidor'],
    };
  }
};

// Obtener comandas validadas para traspaso - Solo llamada HTTP
export const obtenerComandasValidadas = async (
  fechaDesde: string,
  fechaHasta: string
): Promise<RespuestaValidacion> => {
  logger.info('[API] Obtener comandas validadas:', {
    fechaDesde,
    fechaHasta,
  });

  try {
    await mockDelay(400);

    // Mock de comandas validadas - Solo transformación de datos
    const comandasValidadas: ComandaConValidacion[] = [];

    return {
      exito: true,
      mensaje: `${comandasValidadas.length} comandas validadas encontradas`,
      data: { comandasValidadas },
    };
  } catch (error) {
    logger.error('[API] Error al obtener comandas validadas:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener comandas validadas',
      errores: ['Error interno del servidor'],
    };
  }
};

export const realizarTraspaso = async (
  comandaIds: string[],
  observaciones?: string
): Promise<RespuestaValidacion> => {
  logger.info('[API] Realizar traspaso:', {
    comandaIds,
    observaciones,
  });

  try {
    await mockDelay(1000);

    const traspasoInfo = {
      id: `traspaso-${Date.now()}`,
      fechaTraspaso: new Date().toISOString(),
      comandasTraspasadas: comandaIds,
      observaciones,
    };

    logger.success('[API] Traspaso realizado exitosamente:', traspasoInfo);

    return {
      exito: true,
      mensaje: `${comandaIds.length} comandas traspasadas exitosamente a Caja 2`,
      data: traspasoInfo,
    };
  } catch (error) {
    logger.error('[API] Error al realizar traspaso:', error);
    return {
      exito: false,
      mensaje: 'Error al realizar el traspaso',
      errores: ['Error interno del servidor'],
    };
  }
};
