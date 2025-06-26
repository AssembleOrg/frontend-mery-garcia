import {
  ComandaConValidacion,
  EstadoComandaNegocio,
  EstadoValidacion,
  TrazabilidadComanda,
  HistorialCambio,
} from '@/types/caja';

// Acciones disponibles para cada rol
export interface AccionesComanda {
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeCambiarEstado: boolean;
  puedeValidar: boolean;
  puedeVerHistorial: boolean;
}

// Payload para cambiar estado
export interface CambiarEstadoPayload {
  comandaId: string;
  nuevoEstado: EstadoComandaNegocio;
  observaciones?: string;
  usuarioId: string;
}

// Payload para validar comanda
export interface ValidarComandaPayload {
  comandaId: string;
  observaciones?: string;
  adminId: string;
}

// Respuesta del sistema de validación
export interface RespuestaValidacion {
  exito: boolean;
  mensaje: string;
  comanda?: ComandaConValidacion;
  errores?: string[];
}

export type {
  ComandaConValidacion,
  EstadoComandaNegocio,
  EstadoValidacion,
  TrazabilidadComanda,
  HistorialCambio,
};
