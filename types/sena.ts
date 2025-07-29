/**
 * Tipos para el sistema de señas independiente
 * Cada seña es una entidad individual que se puede usar una sola vez
 */

export type EstadoSena = 'disponible' | 'usada' | 'expirada' | 'cancelada';
export type MonedaSena = 'USD' | 'ARS';

export interface SenaIndependiente {
  id: string;
  clienteId: string;
  monto: number;
  moneda: MonedaSena;
  fechaCreacion: Date;
  fechaExpiracion?: Date;
  estado: EstadoSena;
  comandaId?: string; // ID de la comanda donde se usó
  fechaUso?: Date;
  observaciones?: string;
  creadoPor?: string; // ID del usuario que creó la seña
}

export interface CrearSenaData {
  clienteId: string;
  monto: number;
  moneda: MonedaSena;
  observaciones?: string;
  fechaExpiracion?: Date;
}

export interface FiltrosSena {
  clienteId?: string;
  estado?: EstadoSena;
  moneda?: MonedaSena;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface ResumenSenasPorCliente {
  clienteId: string;
  clienteNombre: string;
  senasDisponibles: SenaIndependiente[];
  totalARS: number;
  totalUSD: number;
  cantidadSenas: number;
}

// Estadísticas generales
export interface EstadisticasSenas {
  totalSenas: number;
  senasDisponibles: number;
  senasUsadas: number;
  senasExpiradas: number;
  montoTotalARS: number;
  montoTotalUSD: number;
  montoDisponibleARS: number;
  montoDisponibleUSD: number;
}