import { apiFetch } from '@/lib/apiClient';

// ─── Presentismo de hoy ──────────────────────────────────────────

export interface MetricasHoy {
  onShift: number;
  late: number;
  absent: number;
  toReview: number;
  uncovered: number;
}

export interface PersonaEnTurno {
  userId: string;
  name: string;
  initials: string;
  detail: string;
  statusLabel: string;
  statusTone: 'ok' | 'alerta' | 'info';
}

export interface PresentismoHoy {
  now: string;
  day: string;
  dateLabel: string;
  clock: string;
  timezone: string;
  metrics: MetricasHoy;
  onNow: PersonaEnTurno[];
  teamSize: number;
  activity: Array<{
    label?: string;
    detail?: string;
    time?: string;
    tone?: string;
  }>;
  incidents: unknown[];
  openIncidents: number;
}

// ─── Semana de turnos ────────────────────────────────────────────

export interface TurnoCelda {
  id: string;
  userId: string;
  worksiteId: string | null;
  worksiteName: string | null;
  day: string;
  startsAt: string;
  endsAt: string;
  timeLabel: string;
  placeLabel: string | null;
  breakMinutes: number;
  published: boolean;
  absence: unknown | null;
}

export interface FilaSemana {
  userId: string | null;
  name: string;
  initials: string;
  plannedHours: number;
  cells: Record<string, TurnoCelda[]>;
}

export interface DiaSemana {
  key: string;
  label: string;
  hours: number;
  weekend: boolean;
}

export interface SemanaHorarios {
  weekStart: string;
  label: string;
  previousWeek: string;
  nextWeek: string;
  days: DiaSemana[];
  rows: FilaSemana[];
  sites: Array<{ id: string; kind: string; name: string }>;
  conflicts: unknown[];
  unpublished: number;
  publishedLabel: string;
  /** Para los turnos que van semana por medio. */
  esSemanaA: boolean;
}

export interface CrearTurnoPayload {
  userId: string;
  day: string;
  desdeMinuto: number;
  hastaMinuto: number;
  pausaMinutos?: number;
  worksiteId?: string | null;
}

export interface EditarTurnoPayload {
  day?: string;
  userId?: string;
  desdeMinuto?: number;
  hastaMinuto?: number;
  pausaMinutos?: number;
}

// ─── Patrón semanal ──────────────────────────────────────────────

export type Alternancia = 'TODAS' | 'SEMANA_A' | 'SEMANA_B';

export interface TramoPatron {
  id: string;
  ritmoUserId: string;
  nombre: string;
  diaIso: number;
  desdeMinuto: number;
  hastaMinuto: number;
  pausaMinutos: number;
  alternancia: Alternancia;
  activo: boolean;
}

export interface PatronDePersona {
  ritmoUserId: string;
  nombre: string;
  tramos: TramoPatron[];
  horasSemanaA: number;
  horasSemanaB: number;
}

export interface TramoPayload {
  ritmoUserId: string;
  diaIso: number;
  desdeMinuto: number;
  hastaMinuto: number;
  pausaMinutos?: number;
  alternancia?: Alternancia;
  activo?: boolean;
}

export interface ResumenGeneracion {
  weekStart: string;
  creados: number;
  yaEstaban: number;
  publicados: number;
  sinResolver: string[];
}

type Envelope<T> = { status: string; data: T };

class PresentismoService {
  private readonly base = '/api/ritmo';

  // ---- hoy ----

  async hoy(): Promise<PresentismoHoy> {
    const res = await apiFetch<Envelope<PresentismoHoy>>(`${this.base}/hoy`);
    return res.data;
  }

  /**
   * URL del stream de eventos. Va aparte de `apiFetch` porque EventSource no
   * acepta cabeceras: se abre contra la URL pelada.
   */
  urlEventos(): string {
    return `${process.env.NEXT_PUBLIC_API_URL ?? ''}${this.base}/eventos`;
  }

  // ---- semana ----

  async semana(desde: string): Promise<SemanaHorarios> {
    const res = await apiFetch<Envelope<SemanaHorarios>>(
      `${this.base}/horarios/semana?desde=${desde}`,
    );
    return res.data;
  }

  async crearTurno(payload: CrearTurnoPayload): Promise<void> {
    await apiFetch(`${this.base}/horarios/turno`, { method: 'POST', json: payload });
  }

  async editarTurno(shiftId: string, cambios: EditarTurnoPayload): Promise<void> {
    await apiFetch(`${this.base}/horarios/turno/${shiftId}`, {
      method: 'PATCH',
      json: cambios,
    });
  }

  async borrarTurno(shiftId: string): Promise<void> {
    await apiFetch(`${this.base}/horarios/turno/${shiftId}`, { method: 'DELETE' });
  }

  async publicar(weekStart: string): Promise<{ published: number }> {
    const res = await apiFetch<Envelope<{ published: number }>>(
      `${this.base}/horarios/publicar`,
      { method: 'POST', json: { weekStart } },
    );
    return res.data;
  }

  async generarDesdePatron(weekStart: string): Promise<ResumenGeneracion> {
    const res = await apiFetch<Envelope<ResumenGeneracion>>(
      `${this.base}/horarios/generar`,
      { method: 'POST', json: { weekStart } },
    );
    return res.data;
  }

  // ---- patrón ----

  async patron(): Promise<PatronDePersona[]> {
    const res = await apiFetch<Envelope<PatronDePersona[]>>(`${this.base}/horarios/patron`);
    return res.data;
  }

  async crearTramo(payload: TramoPayload): Promise<void> {
    await apiFetch(`${this.base}/horarios/patron`, { method: 'POST', json: payload });
  }

  async editarTramo(id: string, cambios: Partial<TramoPayload>): Promise<void> {
    await apiFetch(`${this.base}/horarios/patron/${id}`, {
      method: 'PATCH',
      json: cambios,
    });
  }

  async borrarTramo(id: string): Promise<void> {
    await apiFetch(`${this.base}/horarios/patron/${id}`, { method: 'DELETE' });
  }
}

export const presentismoService = new PresentismoService();

// ─── Helpers de hora ─────────────────────────────────────────────

/** 600 → "10:00" */
export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "10:00" → 600 */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export const DIAS_SEMANA = [
  { iso: 1, corto: 'Lun', largo: 'Lunes' },
  { iso: 2, corto: 'Mar', largo: 'Martes' },
  { iso: 3, corto: 'Mié', largo: 'Miércoles' },
  { iso: 4, corto: 'Jue', largo: 'Jueves' },
  { iso: 5, corto: 'Vie', largo: 'Viernes' },
  { iso: 6, corto: 'Sáb', largo: 'Sábado' },
  { iso: 7, corto: 'Dom', largo: 'Domingo' },
];

/** Lunes de la semana de una fecha, como YYYY-MM-DD. */
export function lunesDe(fecha: Date = new Date()): string {
  const d = new Date(
    Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12),
  );
  const iso = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (iso - 1));
  return d.toISOString().slice(0, 10);
}

export function sumarSemanas(lunes: string, cantidad: number): string {
  const d = new Date(`${lunes}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + cantidad * 7);
  return d.toISOString().slice(0, 10);
}
