import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EstadoConversacion, Mensaje } from '@/services/whatsapp.service';

export function horaCorta(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

/** "Hoy", "Ayer", "lunes 8", "12/08/2026". */
export function etiquetaDia(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  if (differenceInCalendarDays(new Date(), d) < 7) return format(d, "EEEE d", { locale: es });
  return format(d, 'dd/MM/yyyy');
}

/** Para la lista: hora si es de hoy, si no el día. */
export function fechaLista(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ayer';
  if (differenceInCalendarDays(new Date(), d) < 7) return format(d, 'EEE', { locale: es });
  return format(d, 'dd/MM');
}

export function claveDia(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}

export function resumenMensaje(m: { texto: string | null; tipo: Mensaje['tipo']; autor: Mensaje['autor'] } | null): string {
  if (!m) return 'Sin mensajes';
  const prefijo = m.autor === 'OPERADOR' ? 'Vos: ' : m.autor === 'BOT' ? 'Bot: ' : '';
  switch (m.tipo) {
    case 'AUDIO':
      return `${prefijo}🎧 Audio`;
    case 'IMAGEN':
      return `${prefijo}🖼️ Imagen${m.texto ? ` · ${m.texto}` : ''}`;
    case 'DOCUMENTO':
      return `${prefijo}📎 Archivo${m.texto ? ` · ${m.texto}` : ''}`;
    case 'OTRO':
      return `${prefijo}Contenido no soportado`;
    default:
      return `${prefijo}${m.texto ?? ''}`;
  }
}

export const ESTADO_TEXTO: Record<EstadoConversacion, { texto: string; clase: string; punto: string }> = {
  ESPERANDO: { texto: 'Esperando', clase: 'border-amber-200 bg-amber-50 text-amber-700', punto: 'bg-amber-500' },
  ATENDIDA: { texto: 'En atención', clase: 'border-emerald-200 bg-emerald-50 text-emerald-700', punto: 'bg-emerald-500' },
  BOT: { texto: 'Bot', clase: 'border-sky-200 bg-sky-50 text-sky-700', punto: 'bg-sky-500' },
  CERRADA: { texto: 'Cerrada', clase: 'border-gray-200 bg-gray-50 text-gray-600', punto: 'bg-gray-400' },
};

export const MOTIVO_TEXTO: Record<string, string> = {
  PIDIO_PERSONA: 'Pidió hablar con una persona',
  NO_ENTENDIO: 'El bot no entendió la consulta',
  AUDIO: 'Mandó un audio',
  ARCHIVO: 'Mandó una imagen o archivo',
  RESPUESTA_DERIVA: 'Necesita seguimiento de una persona',
  SEGURIDAD: 'Mensaje sospechoso, revisar',
  BOT_APAGADO: 'El bot está apagado',
  SIN_CLASIFICADOR: 'El clasificador no respondió',
};

export function tamanoLegible(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function duracionLegible(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
