import type { EstadoPedido, Moneda } from '@/services/compras.service';

const TZ = 'America/Argentina/Buenos_Aires';

/**
 * Cada estado con su texto y su color plano (paleta de DESIGN.md: los mismos
 * tonos que Presentismo, con texto siempre al lado).
 */
export const ESTADOS: Record<
  EstadoPedido,
  { texto: string; ayuda: string; clase: string }
> = {
  ANOTADO: {
    texto: 'Anotado',
    ayuda: 'Una nota o un deseo: todavía sin precio.',
    clase: 'border border-dashed border-[#d4a7ca] bg-white text-[#8b5a6b]',
  },
  PEDIR_PRECIO: {
    texto: 'Pedir precio',
    ayuda: 'Queda en la lista de Melián para cotizarlo.',
    clase: 'bg-[#dfe3f5] text-[#3b4a86]',
  },
  COMPRADO: {
    texto: 'Comprado',
    ayuda: 'Pagado, falta que llegue. Desde acá hay 48 h para corregirlo.',
    clase: 'bg-[#eef6f1] text-[#24533a] ring-1 ring-inset ring-[#9cc8ad]',
  },
  ENTREGADO: {
    texto: 'Entregado',
    ayuda: 'Llegó: lo que afecta stock ya suma.',
    clase: 'bg-[#d8eadf] text-[#24533a]',
  },
  CANCELADO: {
    texto: 'Cancelado',
    ayuda: 'No se compra.',
    clase: 'bg-[#fdf6f8] text-[#8b5a6b] line-through decoration-[#b496a2]',
  },
};

/** Orden en el que avanza un pedido (sin Cancelado). */
export const FLUJO: EstadoPedido[] = [
  'ANOTADO',
  'PEDIR_PRECIO',
  'COMPRADO',
  'ENTREGADO',
];

/** Aviso de poco stock: amarillo suave, sin estridencia. */
export const CLASE_POCO_STOCK = 'bg-[#fff6e6] text-[#7a4a05]';

/** "2026-11-07T18:30:00Z" → "07/11/2026" (hora del salón). */
export function fecha(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

/** "07/11/2026 15:30" (24 h, hora del salón). */
export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
  return `${fecha(iso)} ${hora}`;
}

/** "$ 15.000" / "US$ 120,50". */
export function plata(
  monto: number | null | undefined,
  moneda: Moneda = 'ARS'
): string {
  if (monto === null || monto === undefined) return '';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(monto);
}

/** Total que vale: el cargado a mano o, si no, la suma de los renglones. */
export function totalDe(p: {
  total: number | null;
  totalCalculado: number | null;
}): number | null {
  return p.total ?? p.totalCalculado;
}

/** "API 409: Pasaron más…" → "Pasaron más…". */
export function mensajeError(
  e: unknown,
  porDefecto = 'Algo salió mal'
): string {
  const msg = e instanceof Error ? e.message : '';
  const limpio = msg.replace(/^API \d+:\s*/, '');
  if (!limpio || limpio.startsWith('[') || limpio.startsWith('{'))
    return porDefecto;
  return limpio;
}

/** Para buscar sin importar mayúsculas ni tildes. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Clases comunes (DESIGN.md: botones planos, foco rosa). */
export const FOCO =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]';
export const BOTON_PRIMARIO = `inline-flex items-center justify-center gap-2 rounded-lg bg-[#4a3540] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#6b4c57] disabled:opacity-50 ${FOCO}`;
export const BOTON_SECUNDARIO = `inline-flex items-center justify-center gap-2 rounded-lg border border-[#f5d0d9] bg-white px-3 py-1.5 text-sm text-[#6b4c57] transition-colors hover:bg-[#fcf0f3] disabled:opacity-50 ${FOCO}`;
export const BOTON_PELIGRO = `inline-flex items-center justify-center gap-2 rounded-md px-3 py-1 text-sm text-[#9b1450] transition-colors hover:bg-[#fdf0f5] disabled:opacity-50 ${FOCO}`;
export const BOTON_ICONO = `flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6b4c57] transition-colors hover:bg-[#fcf0f3] disabled:opacity-50 ${FOCO}`;
/** Campo sin ancho: para los que llevan uno propio (w-16, w-32…). */
export const CAMPO_BASE = `h-9 rounded-md border border-[#f5d0d9] bg-white px-2.5 text-sm text-[#4a3540] placeholder:text-[#b496a2] focus:border-[#ec9cab] focus:outline-none focus:ring-2 focus:ring-[#f9bbc4]/60 disabled:bg-[#fdf6f8] disabled:text-[#8b5a6b]`;
export const CAMPO = `${CAMPO_BASE} w-full`;
export const ETIQUETA = 'text-xs text-[#8b5a6b]';
