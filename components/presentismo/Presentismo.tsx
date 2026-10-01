'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Download, Inbox, Repeat, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { formatDiaConNombre, formatDiaISO } from '@/lib/utils';
import {
  duracion,
  lunesDe,
  presentismoService,
  reportesService,
  type Bandeja,
  type FilaAsistencia,
  type PersonaRitmo,
} from '@/services/presentismo.service';
import {
  claveNombre,
  cortoDia,
  estadoVisual,
  finMes,
  hoyISO,
  inicioMes,
  sumarDias,
  sumarMeses,
} from './estados';
import VistaDia from './VistaDia';
import VistaSemana from './VistaSemana';
import VistaMes from './VistaMes';
import PanelDia from './PanelDia';
import Leyenda from './Leyenda';
import TabPendientes from './TabPendientes';
import TabPatron from './TabPatron';
import TabEquipo from './TabEquipo';

export type Zoom = 'dia' | 'semana' | 'mes';
type Vista = Zoom | 'pendientes' | 'horario' | 'equipo';

export interface Persona {
  userId: string;
  nombre: string;
  iniciales: string;
}

export interface Seleccion {
  userId: string;
  day: string;
}

const ZOOMS: Array<{ id: Zoom; texto: string }> = [
  { id: 'dia', texto: 'Día' },
  { id: 'semana', texto: 'Semana' },
  { id: 'mes', texto: 'Mes' },
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function periodoDe(zoom: Zoom, fecha: string): { desde: string; hasta: string } {
  if (zoom === 'dia') return { desde: fecha, hasta: fecha };
  if (zoom === 'semana') {
    const lunes = lunesDe(new Date(`${fecha}T12:00:00`));
    return { desde: lunes, hasta: sumarDias(lunes, 6) };
  }
  return { desde: inicioMes(fecha), hasta: finMes(fecha) };
}

function tituloPeriodo(zoom: Zoom, fecha: string, desde: string, hasta: string): string {
  if (zoom === 'dia') return formatDiaConNombre(fecha);
  if (zoom === 'semana') return `${formatDiaISO(desde)} al ${formatDiaISO(hasta)}`;
  const [a, m] = fecha.split('-').map(Number);
  return `${MESES[m - 1]} ${a}`;
}

/** "Luna García" → "LG". */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function Presentismo() {
  const [vista, setVista] = useState<Vista>('dia');
  const [zoom, setZoom] = useState<Zoom>('dia');
  const [fecha, setFecha] = useState(hoyISO);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [filas, setFilas] = useState<FilaAsistencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [equipo, setEquipo] = useState<PersonaRitmo[]>([]);
  const [bandeja, setBandeja] = useState<Bandeja | null>(null);
  const [version, setVersion] = useState(0);
  const [enVivo, setEnVivo] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [esAncho, setEsAncho] = useState(true);
  const [leyendaAbierta, setLeyendaAbierta] = useState(false);

  const hoy = hoyISO();
  const { desde, hasta } = periodoDe(zoom, fecha);
  const incluyeHoy = desde <= hoy && hoy <= hasta;
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const actualizar = () => setEsAncho(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, []);

  // Asistencia del período: la usan las tres escalas y el panel.
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    reportesService
      .asistencia(desde, hasta)
      .then((r) => vigente && setFilas(r.rows))
      .catch(() => vigente && toast.error('No se pudo cargar la asistencia'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [desde, hasta, version]);

  // Equipo y bandeja: alcanza con traerlos al entrar y después de cada cambio.
  useEffect(() => {
    presentismoService.equipo().then((e) => setEquipo(e.people)).catch(() => undefined);
  }, []);
  useEffect(() => {
    presentismoService.pendientes().then(setBandeja).catch(() => undefined);
  }, [version]);

  // En vivo: si el período incluye hoy, cada fichada relee la grilla.
  useEffect(() => {
    if (!incluyeHoy) {
      setEnVivo(false);
      return;
    }
    return presentismoService.escucharEventos((crudo) => {
      const e = crudo as { nombre: string | null; kind: string; aRevisar: boolean; motivo: string | null };
      const quien = e.nombre ?? 'Alguien';
      const que = e.kind === 'ENTRADA' ? 'entró' : e.kind === 'SALIDA' ? 'salió' : 'fichó';
      if (e.aRevisar) toast.warning(`${quien} ${que} · a revisar`, { description: e.motivo ?? undefined });
      else toast.success(`${quien} ${que}`);
      recargar();
    }, setEnVivo);
  }, [incluyeHoy, recargar]);

  // Personas: el equipo activo de Ritmo más quien tenga filas en el período.
  const personas = useMemo<Persona[]>(() => {
    const mapa = new Map<string, Persona>();
    for (const p of equipo) {
      if (p.role === 'EMPLEADO' && p.isActive) {
        mapa.set(p.id, { userId: p.id, nombre: p.fullName, iniciales: p.initials });
      }
    }
    for (const f of filas) {
      if (!mapa.has(f.userId)) {
        mapa.set(f.userId, { userId: f.userId, nombre: f.fullName, iniciales: iniciales(f.fullName) });
      }
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [equipo, filas]);

  const filaDe = useMemo(() => {
    const m = new Map<string, FilaAsistencia>();
    for (const f of filas) m.set(`${f.userId}|${f.day}`, f);
    return (userId: string, day: string) => m.get(`${userId}|${day}`);
  }, [filas]);

  // Cifras del período, sólo hasta hoy: lo que viene todavía no pasó.
  const cifras = useMemo(() => {
    let trabajado = 0;
    let planificado = 0;
    let tarde = 0;
    let faltas = 0;
    let revisar = 0;
    for (const f of filas) {
      if (f.day > hoy) continue;
      const estado = estadoVisual(f, hoy);
      if (estado === 'PLANIFICADO') continue;
      trabajado += f.workedMinutes;
      planificado += f.plannedMinutes;
      if (f.lateMinutes > 0) tarde += 1;
      if (estado === 'AUSENTE') faltas += 1;
      if (f.review === 'PENDIENTE') revisar += 1;
    }
    return { trabajado, planificado, tarde, faltas, revisar };
  }, [filas, hoy]);

  const pendientesDe = useCallback(
    (nombre: string) =>
      (bandeja?.incidents ?? []).filter((i) => claveNombre(i.person) === claveNombre(nombre)),
    [bandeja],
  );

  // Si la selección queda fuera del período nuevo, se suelta.
  useEffect(() => {
    if (seleccion && (seleccion.day < desde || seleccion.day > hasta)) setSeleccion(null);
  }, [desde, hasta, seleccion]);

  const elegirZoom = (z: Zoom) => {
    setVista(z);
    setZoom(z);
    // El zoom se acerca a lo que estaba seleccionado.
    if (seleccion) setFecha(seleccion.day);
  };

  const mover = (paso: number) => {
    setSeleccion(null);
    setFecha((f) => (zoom === 'dia' ? sumarDias(f, paso) : zoom === 'semana' ? sumarDias(f, paso * 7) : sumarMeses(f, paso)));
  };

  const irAlDia = (day: string) => {
    setFecha(day);
    setZoom('dia');
    setVista('dia');
  };

  const descargar = async () => {
    setBajando(true);
    try {
      await reportesService.descargarPdf(desde, hasta);
    } catch {
      toast.error('No se pudo generar el PDF');
    } finally {
      setBajando(false);
    }
  };

  const enGrilla = vista === 'dia' || vista === 'semana' || vista === 'mes';
  const personaSel = seleccion ? personas.find((p) => p.userId === seleccion.userId) : undefined;
  const panel =
    enGrilla && seleccion && personaSel ? (
      <PanelDia
        persona={personaSel}
        day={seleccion.day}
        fila={filaDe(seleccion.userId, seleccion.day)}
        pendientes={pendientesDe(personaSel.nombre)}
        onCambio={recargar}
        onCerrar={esAncho ? () => setSeleccion(null) : null}
        onIrAlDia={zoom === 'dia' ? undefined : () => irAlDia(seleccion.day)}
      />
    ) : null;

  const totalPendientes = bandeja?.counts.total ?? 0;

  return (
    <div className="mg-presentismo text-[#4a3540]">
      {/* Barra */}
      <div className="flex flex-col gap-3 border-b border-[#f5d0d9] pb-4 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
        <div className="flex items-center">
          <div role="tablist" aria-label="Escala" className="grid w-full grid-cols-3 rounded-lg border border-[#f5d0d9] bg-white p-0.5 sm:inline-flex sm:w-auto">
            {ZOOMS.map((z) => {
              const activo = vista === z.id;
              return (
                <button
                  key={z.id}
                  role="tab"
                  aria-selected={activo}
                  onClick={() => elegirZoom(z.id)}
                  className={`rounded-md px-4 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab] ${
                    activo ? 'bg-[#4a3540] text-white' : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
                  }`}
                >
                  {z.texto}
                </button>
              );
            })}
          </div>
        </div>

        {enGrilla ? (
            <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-center">
              <BotonIcono onClick={() => mover(-1)} etiqueta="Anterior">
                <ChevronLeft className="h-4 w-4" />
              </BotonIcono>
              <div className="min-w-0 px-1 text-center sm:min-w-[13rem]">
                <div className="text-base leading-tight whitespace-nowrap tabular-nums">
                  {zoom === 'dia' ? (
                    <>
                      <span className="sm:hidden">
                        {cortoDia(fecha)} {formatDiaISO(fecha)}
                      </span>
                      <span className="hidden sm:inline">{tituloPeriodo(zoom, fecha, desde, hasta)}</span>
                    </>
                  ) : (
                    tituloPeriodo(zoom, fecha, desde, hasta)
                  )}
                </div>
              </div>
              <BotonIcono onClick={() => mover(1)} etiqueta="Siguiente">
                <ChevronRight className="h-4 w-4" />
              </BotonIcono>
              <button
                onClick={() => {
                  setSeleccion(null);
                  setFecha(hoy);
                }}
                disabled={incluyeHoy}
                className="ml-1 rounded-md border border-[#f5d0d9] px-2.5 py-1 text-sm text-[#6b4c57] transition-colors hover:bg-[#fcf0f3] disabled:border-transparent disabled:text-[#8b5a6b] disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
              >
                Hoy
              </button>
              {incluyeHoy && (
                <span className="ml-1 inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-[#8b5a6b]" aria-live="polite">
                  <span className={`h-2 w-2 rounded-full ${enVivo ? 'mg-latido bg-[#3f8f5f]' : 'bg-[#b496a2]'}`} aria-hidden />
                  <span className="sm:hidden">{enVivo ? 'Vivo' : '…'}</span>
                  <span className="hidden sm:inline">{enVivo ? 'En vivo' : 'Reconectando…'}</span>
                </span>
              )}
            </div>
        ) : (
          <span className="hidden lg:block" />
        )}

        <div className="flex items-center gap-1 lg:justify-end">
          <BotonSeccion activo={vista === 'pendientes'} onClick={() => setVista('pendientes')}>
            <Inbox className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Pendientes</span>
            {totalPendientes > 0 && (
              <span
                className={`rounded-full px-1.5 text-xs leading-5 tabular-nums ${
                  vista === 'pendientes' ? 'bg-white/20 text-white' : 'bg-[#fcf0f3] text-[#4a3540] ring-1 ring-[#f5d0d9]'
                }`}
              >
                {totalPendientes}
              </span>
            )}
          </BotonSeccion>
          <BotonSeccion activo={vista === 'horario'} onClick={() => setVista('horario')}>
            <Repeat className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Horario fijo</span>
          </BotonSeccion>
          <BotonSeccion activo={vista === 'equipo'} onClick={() => setVista('equipo')}>
            <Users className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Equipo</span>
          </BotonSeccion>
          {enGrilla && (
            <button
              onClick={descargar}
              disabled={bajando}
              aria-label="Descargar PDF del período"
              className="ml-auto inline-flex items-center gap-2 rounded-lg border whitespace-nowrap border-[#f5d0d9] bg-white px-3 py-1.5 text-sm text-[#6b4c57] transition-colors hover:bg-[#fcf0f3] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab] sm:ml-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{bajando ? 'Generando…' : 'PDF del período'}</span>
            </button>
          )}
        </div>
      </div>

      {enGrilla ? (
        <>
          {/* Cifras del período, en línea */}
          <div className="flex flex-wrap items-end gap-x-8 gap-y-2 py-3 sm:py-4">
            <dl className="grid w-full grid-cols-4 gap-x-3 text-sm sm:flex sm:w-auto sm:gap-x-8">
              <Cifra
                etiqueta="Trabajado"
                valor={duracion(cifras.trabajado)}
                detalle={cifras.planificado ? `de ${duracion(cifras.planificado)}` : undefined}
              />
              <Cifra etiqueta="Tarde" etiquetaLarga="Llegadas tarde" valor={cifras.tarde} alerta={cifras.tarde > 0} />
              <Cifra etiqueta="Faltas" valor={cifras.faltas} alerta={cifras.faltas > 0} />
              <Cifra etiqueta="A revisar" etiquetaLarga="Días a revisar" valor={cifras.revisar} alerta={cifras.revisar > 0} />
            </dl>
            <div className="hidden md:ml-auto md:block">
              <Leyenda />
            </div>
            <div className="w-full md:hidden">
              <button
                onClick={() => setLeyendaAbierta((v) => !v)}
                aria-expanded={leyendaAbierta}
                className="inline-flex items-center gap-1.5 rounded-md text-xs text-[#6b4c57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
              >
                <span className="flex gap-0.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-[#d8eadf]" />
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-[#fbe3b8]" />
                  <span className="h-2.5 w-2.5 rounded-[2px] bg-[#f8c9dc]" />
                </span>
                {leyendaAbierta ? 'Ocultar referencias' : 'Ver referencias'}
              </button>
              {leyendaAbierta && (
                <div className="mg-entrar pt-2">
                  <Leyenda />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div key={`${zoom}-${desde}`} className="mg-entrar min-w-0 flex-1">
              {zoom === 'dia' && (
                <VistaDia
                  dia={fecha}
                  hoy={hoy}
                  personas={personas}
                  filaDe={filaDe}
                  cargando={cargando}
                  seleccion={seleccion}
                  onSeleccionar={setSeleccion}
                />
              )}
              {zoom === 'semana' && (
                <VistaSemana
                  desde={desde}
                  hoy={hoy}
                  personas={personas}
                  filaDe={filaDe}
                  cargando={cargando}
                  version={version}
                  seleccion={seleccion}
                  onSeleccionar={setSeleccion}
                  onIrAlDia={irAlDia}
                  onCambio={recargar}
                />
              )}
              {zoom === 'mes' && (
                <VistaMes
                  desde={desde}
                  hasta={hasta}
                  hoy={hoy}
                  personas={personas}
                  filaDe={filaDe}
                  cargando={cargando}
                  seleccion={seleccion}
                  onSeleccionar={setSeleccion}
                  onIrAlDia={irAlDia}
                />
              )}
            </div>

            {esAncho && panel && (
              <aside className="mg-entrar sticky top-4 w-[340px] shrink-0 rounded-xl border border-[#f5d0d9] bg-white">
                {panel}
              </aside>
            )}
          </div>

          {!esAncho && (
            <Sheet open={!!panel} onOpenChange={(abierto) => !abierto && setSeleccion(null)}>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-0">
                <SheetTitle className="sr-only">Detalle del día</SheetTitle>
                {panel}
              </SheetContent>
            </Sheet>
          )}
        </>
      ) : (
        <div className="mg-entrar pt-4">
          {vista === 'pendientes' && <TabPendientes onCambio={recargar} />}
          {vista === 'horario' && <TabPatron />}
          {vista === 'equipo' && <TabEquipo />}
        </div>
      )}
    </div>
  );
}

function BotonIcono({
  children,
  onClick,
  etiqueta,
}: {
  children: React.ReactNode;
  onClick: () => void;
  etiqueta: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={etiqueta}
      className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b4c57] transition-colors hover:bg-[#fcf0f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
    >
      {children}
    </button>
  );
}

function BotonSeccion({
  children,
  activo,
  onClick,
}: {
  children: React.ReactNode;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab] ${
        activo ? 'bg-[#4a3540] text-white' : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
      }`}
    >
      {children}
    </button>
  );
}

function Cifra({
  etiqueta,
  etiquetaLarga,
  valor,
  detalle,
  alerta,
}: {
  etiqueta: string;
  etiquetaLarga?: string;
  valor: string | number;
  detalle?: string;
  alerta?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="truncate text-xs text-[#8b5a6b]">
        {etiquetaLarga ? (
          <>
            <span className="sm:hidden">{etiqueta}</span>
            <span className="hidden sm:inline">{etiquetaLarga}</span>
          </>
        ) : (
          etiqueta
        )}
      </dt>
      <dd className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
        <span className={`text-base tabular-nums sm:text-xl ${alerta ? 'text-[#9b1450]' : 'text-[#4a3540]'}`}>{valor}</span>
        {detalle && <span className="hidden text-xs text-[#8b5a6b] sm:inline">{detalle}</span>}
      </dd>
    </div>
  );
}
