import type { EstadoSolicitudStock, SolicitudStock } from '@/services/stock.service';

export const ESTADOS_SOLICITUD: Record<EstadoSolicitudStock, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'border-amber-300 bg-amber-50 text-amber-700' },
  APROBADA: { texto: 'Confirmada', clase: 'border-green-300 bg-green-50 text-green-700' },
  RECHAZADA: { texto: 'Anulada', clase: 'border-red-300 bg-red-50 text-red-600' },
  CANCELADA: { texto: 'Cancelada', clase: 'border-gray-300 bg-gray-50 text-gray-500' },
};

export const fechaSolicitud = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

export const resumenItems = (s: SolicitudStock) =>
  s.items
    .map((i) => `${i.cantidad > 1 ? `${i.nombre} ×${i.cantidad}` : i.nombre}${i.libre ? ' (escrito a mano)' : ''}`)
    .join(', ');

/** Minutos hasta que un registro de Ritmo sin anular se confirma solo (STOCK_AUTOCONFIRMA_MIN). */
export const AUTOCONFIRMA_MIN = 60;

/** "16:42": a qué hora se confirma solo un registro pendiente. */
export const horaAutoconfirma = (iso: string) =>
  new Date(new Date(iso).getTime() + AUTOCONFIRMA_MIN * 60_000).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });
