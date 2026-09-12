import { apiFetch, getToken } from '@/lib/apiClient';

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

// ─── Pendientes de decisión ──────────────────────────────────────

export type TipoPendiente = 'FICHAJE' | 'AUSENCIA' | 'LICENCIA' | 'TARDE' | 'HORAS_EXTRA';

export interface Pendiente {
  /** "LICENCIA:uuid" — alcanza para resolverla. */
  id: string;
  kind: TipoPendiente;
  label: string;
  person: string;
  detail: string;
  when: string;
  priority: 'alta' | 'media' | 'baja';
  tone: 'alerta' | 'info' | 'tarde' | 'licencia';
}

export interface Bandeja {
  incidents: Pendiente[];
  counts: {
    total: number;
    fichajes: number;
    ausencias: number;
    licencias: number;
    horasExtra: number;
    resueltasSemana: number;
  };
}

// ─── Equipo ──────────────────────────────────────────────────────

export interface PersonaRitmo {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'CONTABLE' | 'EMPLEADO' | 'PLATAFORMA';
  employeeCode: string | null;
  worksiteName: string | null;
  initials: string;
  isActive: boolean;
  /** "activo" | "sin-invitar" | "sin-acceso" */
  access: string;
  accessLabel: string;
  statusLabel: string;
  statusTone: 'ok' | 'alerta' | 'info';
  shiftsThisWeek: number;
  hoursThisWeek: number;
  lateThisMonth: number;
  lastLoginAt: string | null;
}

export interface Equipo {
  people: PersonaRitmo[];
  total: number;
  withAccess: number;
  notInvited: number;
  inactive: number;
  sites: Array<{ id: string; name: string; kind: string }>;
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
   * Abre el stream de presentismo y llama a `onEvento` con cada fichaje.
   *
   * No se usa EventSource: no acepta cabeceras, y la unica forma de
   * autenticarlo seria mandar el token en la URL, donde quedaria escrito en
   * los logs. Con fetch el token va en la cabecera como en el resto de la app;
   * a cambio hay que reconectar a mano, que es lo que EventSource daba gratis.
   *
   * Devuelve la funcion para cerrarlo.
   */
  escucharEventos(
    onEvento: (evento: unknown) => void,
    onEstado: (conectado: boolean) => void,
  ): () => void {
    const control = new AbortController();
    let cerrado = false;
    let intentos = 0;

    const conectar = async () => {
      while (!cerrado) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? ''}${this.base}/eventos`,
            {
              headers: {
                Accept: 'text/event-stream',
                ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
              },
              signal: control.signal,
            },
          );
          if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

          intentos = 0;
          onEstado(true);
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!cerrado) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Los mensajes de SSE se separan con una linea en blanco.
            const partes = buffer.split('\n\n');
            buffer = partes.pop() ?? '';
            for (const parte of partes) {
              const tipo = /^event:\s*(.+)$/m.exec(parte)?.[1]?.trim();
              const data = /^data:\s*(.+)$/m.exec(parte)?.[1];
              if (tipo === 'fichaje' && data) onEvento(JSON.parse(data));
            }
          }
        } catch {
          if (cerrado) return;
        }

        onEstado(false);
        // Espera creciente hasta 30 s: si el backend se cayo, no tiene sentido
        // martillarlo cada segundo.
        intentos += 1;
        const espera = Math.min(1000 * 2 ** Math.min(intentos, 5), 30_000);
        await new Promise((r) => setTimeout(r, espera));
      }
    };

    void conectar();
    return () => {
      cerrado = true;
      control.abort();
    };
  }

  /** Lo que espera una decisión: licencias, fichajes a revisar, tarde, extra. */
  async pendientes(): Promise<Bandeja> {
    const res = await apiFetch<Envelope<Bandeja>>(`${this.base}/pendientes`);
    return res.data;
  }

  async resolverPendientes(ids: string[], decision: 'APROBADA' | 'RECHAZADA'): Promise<void> {
    await apiFetch(`${this.base}/pendientes/resolver`, {
      method: 'POST',
      json: { ids, decision },
    });
  }

  /** El equipo dado de alta en Ritmo, con su estado de acceso. */
  async equipo(): Promise<Equipo> {
    const res = await apiFetch<Envelope<Equipo>>(`${this.base}/personal`);
    return res.data;
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

// ─── Reporte de asistencia ───────────────────────────────────────

export type EstadoDia = 'TRABAJADO' | 'INCOMPLETO' | 'AUSENTE' | 'LICENCIA' | 'SIN_TURNO';
export type RevisionDia = 'VALIDO' | 'PENDIENTE' | 'RECHAZADO';

export interface FilaAsistencia {
  userId: string;
  fullName: string;
  employeeCode: string | null;
  day: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  plannedMinutes: number;
  checkIn: string | null;
  checkOut: string | null;
  breakMinutes: number;
  workedMinutes: number;
  balanceMinutes: number;
  lateMinutes: number;
  punches: number;
  state: EstadoDia;
  review: RevisionDia | null;
  reviewReason: string | null;
  absenceKind: string | null;
  absenceStatus: string | null;
}

export interface ReporteAsistencia {
  from: string;
  to: string;
  timezone: string;
  rows: FilaAsistencia[];
  summary: {
    people: number;
    days: number;
    workedMinutes: number;
    plannedMinutes: number;
    pendingDays: number;
    absentDays: number;
    leaveDays: number;
    lateDays: number;
  };
}

class ReportesService {
  private readonly base = '/api/ritmo/reportes';

  async asistencia(desde: string, hasta: string): Promise<ReporteAsistencia> {
    const res = await apiFetch<{ status: string; data: ReporteAsistencia }>(
      `${this.base}/asistencia?desde=${desde}&hasta=${hasta}`,
    );
    return res.data;
  }

  /**
   * Baja el PDF. Va por fetch y no abriendo la URL porque el endpoint pide el
   * token en la cabecera; despues se fuerza la descarga con un enlace temporal.
   */
  async descargarPdf(desde: string, hasta: string): Promise<void> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}${this.base}/asistencia.pdf?desde=${desde}&hasta=${hasta}`,
      { headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {} },
    );
    if (!res.ok) throw new Error('No se pudo generar el PDF');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia-${desde}-a-${hasta}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const reportesService = new ReportesService();

/** 485 → "8h 05m"; negativos con signo. */
export function duracion(minutos: number): string {
  if (!minutos) return '—';
  const signo = minutos < 0 ? '-' : '';
  const abs = Math.abs(minutos);
  return `${signo}${Math.floor(abs / 60)}h ${String(abs % 60).padStart(2, '0')}m`;
}

/** "2026-09-15" → "15/09". */
export function fechaCorta(dia: string): string {
  const [, m, d] = dia.split('-');
  return `${d}/${m}`;
}
