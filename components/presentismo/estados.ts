import type { FilaAsistencia } from '@/services/presentismo.service';

/**
 * Estado que se pinta en cada celda. Sale de la fila de asistencia, pero
 * corregido por la fecha: Ritmo marca como "ausente" cualquier turno sin
 * marcas, incluso los de mañana o los de hoy que todavía no empezaron.
 */
export type EstadoVisual =
  | 'TRABAJADO'
  | 'TARDE'
  | 'EN_CURSO'
  | 'INCOMPLETO'
  | 'AUSENTE'
  | 'LICENCIA'
  | 'PLANIFICADO'
  | 'SIN_TURNO';

export const ESTADOS: Record<
  EstadoVisual,
  { texto: string; celda: string; chip: string }
> = {
  TRABAJADO: {
    texto: 'Trabajado',
    celda: 'bg-[#d8eadf] text-[#24533a]',
    chip: 'bg-[#d8eadf] text-[#24533a]',
  },
  TARDE: {
    texto: 'Llegó tarde',
    celda: 'bg-[#fbe3b8] text-[#7a4a05]',
    chip: 'bg-[#fbe3b8] text-[#7a4a05]',
  },
  EN_CURSO: {
    texto: 'En curso',
    celda: 'bg-[#eef6f1] text-[#24533a] ring-1 ring-inset ring-[#9cc8ad]',
    chip: 'bg-[#eef6f1] text-[#24533a] ring-1 ring-inset ring-[#9cc8ad]',
  },
  INCOMPLETO: {
    texto: 'Incompleto',
    celda: 'mg-rayado text-[#7a4a05]',
    chip: 'mg-rayado text-[#7a4a05]',
  },
  AUSENTE: {
    texto: 'Ausente',
    celda: 'bg-[#f8c9dc] text-[#9b1450]',
    chip: 'bg-[#f8c9dc] text-[#9b1450]',
  },
  LICENCIA: {
    texto: 'Licencia',
    celda: 'bg-[#dfe3f5] text-[#3b4a86]',
    chip: 'bg-[#dfe3f5] text-[#3b4a86]',
  },
  PLANIFICADO: {
    texto: 'Planificado',
    celda: 'bg-white text-[#8b5a6b] border border-dashed border-[#d4a7ca]',
    chip: 'bg-white text-[#8b5a6b] border border-dashed border-[#d4a7ca]',
  },
  SIN_TURNO: {
    texto: 'Sin turno',
    celda: 'bg-[#fdf6f8] text-[#8b5a6b]',
    chip: 'bg-[#fcf0f3] text-[#8b5a6b]',
  },
};

/** Orden de la leyenda. */
export const LEYENDA: EstadoVisual[] = [
  'TRABAJADO',
  'TARDE',
  'EN_CURSO',
  'INCOMPLETO',
  'AUSENTE',
  'LICENCIA',
  'PLANIFICADO',
  'SIN_TURNO',
];

const TZ = 'America/Argentina/Buenos_Aires';

/** Hoy en Buenos Aires, YYYY-MM-DD. */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Minutos desde la medianoche, hora de Buenos Aires. */
export function ahoraMinutos(): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .split(':')
    .map(Number);
  return h * 60 + m;
}

/** "10:30" → 630. */
export function aMinutos(hora: string | null | undefined): number | null {
  if (!hora) return null;
  const [h, m] = hora.split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
}

export function estadoVisual(fila: FilaAsistencia | undefined, hoy = hoyISO()): EstadoVisual {
  if (!fila) return 'SIN_TURNO';
  const tieneTurno = !!fila.shiftStart;

  if (fila.day > hoy) return fila.state === 'LICENCIA' ? 'LICENCIA' : tieneTurno ? 'PLANIFICADO' : 'SIN_TURNO';

  if (fila.day === hoy) {
    if (fila.checkIn && !fila.checkOut) return 'EN_CURSO';
    const inicio = aMinutos(fila.shiftStart);
    if (!fila.checkIn && inicio !== null && ahoraMinutos() < inicio) return 'PLANIFICADO';
  }

  switch (fila.state) {
    case 'LICENCIA':
      return 'LICENCIA';
    case 'AUSENTE':
      return 'AUSENTE';
    case 'INCOMPLETO':
      return 'INCOMPLETO';
    case 'SIN_TURNO':
      return 'SIN_TURNO';
    default:
      return fila.lateMinutes > 0 ? 'TARDE' : 'TRABAJADO';
  }
}

// ─── Fechas YYYY-MM-DD sin husos ─────────────────────────────────

export function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function inicioMes(dia: string): string {
  return `${dia.slice(0, 7)}-01`;
}

export function finMes(dia: string): string {
  const [a, m] = dia.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return `${dia.slice(0, 7)}-${String(ultimo).padStart(2, '0')}`;
}

export function sumarMeses(dia: string, n: number): string {
  const [a, m] = dia.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1, 12));
  return d.toISOString().slice(0, 10);
}

/** Días entre dos fechas, ambas incluidas. */
export function rangoDias(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

const INICIALES_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const CORTOS_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function diaSemana(dia: string): number {
  return new Date(`${dia}T12:00:00Z`).getUTCDay();
}

export function inicialDia(dia: string): string {
  return INICIALES_DIA[diaSemana(dia)];
}

export function cortoDia(dia: string): string {
  return CORTOS_DIA[diaSemana(dia)];
}

export function esFinde(dia: string): boolean {
  const d = diaSemana(dia);
  return d === 0 || d === 6;
}

/** 485 → "8h 05m"; 0 → "0h". El mismo formato de duración en toda la pantalla. */
export function horasCortas(minutos: number): string {
  if (!minutos) return '0h';
  const signo = minutos < 0 ? '-' : '';
  const abs = Math.abs(Math.round(minutos));
  return `${signo}${Math.floor(abs / 60)}h ${String(abs % 60).padStart(2, '0')}m`;
}

/**
 * Ritmo informa cuándo pasó cada pendiente en forma relativa ("hace 4 h",
 * "ayer", "hace 7 días"). Se pasa a fecha para poder mostrarla en dd/mm/aaaa
 * y ubicarla en el día. Si el texto no se entiende, null.
 */
export function diaDePendiente(cuando: string | null | undefined, ahora: Date = new Date()): string | null {
  if (!cuando) return null;
  const t = cuando.trim().toLowerCase();
  const hoy = hoyISO();
  if (/^(hace (un|1) momento|recién|ahora|hace \d+ ?(s|min|m)\b)/.test(t) || /minuto/.test(t)) return hoy;
  const horas = /^hace (\d+) ?h/.exec(t);
  if (horas) {
    const d = new Date(ahora.getTime() - Number(horas[1]) * 3_600_000);
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  }
  if (t === 'hoy') return hoy;
  if (t === 'ayer') return sumarDias(hoy, -1);
  const dias = /^hace (\d+) d[ií]as?/.exec(t);
  if (dias) return sumarDias(hoy, -Number(dias[1]));
  const semanas = /^hace (\d+) semanas?/.exec(t);
  if (semanas) return sumarDias(hoy, -7 * Number(semanas[1]));
  return null;
}

/** Normaliza nombres para cruzar pendientes (vienen por nombre) con personas. */
export function claveNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
