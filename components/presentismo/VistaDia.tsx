'use client';

import { useEffect, useRef, useState } from 'react';
import { duracion, type FilaAsistencia } from '@/services/presentismo.service';
import type { Persona, Seleccion } from './Presentismo';
import { ESTADOS, aMinutos, ahoraMinutos, estadoVisual } from './estados';
import Esqueleto from './Esqueleto';

interface Props {
  dia: string;
  hoy: string;
  personas: Persona[];
  filaDe: (userId: string, day: string) => FilaAsistencia | undefined;
  cargando: boolean;
  seleccion: Seleccion | null;
  onSeleccionar: (s: Seleccion) => void;
}

/** El día como línea de tiempo: el turno planificado y, encima, lo que realmente pasó. */
export default function VistaDia({ dia, hoy, personas, filaDe, cargando, seleccion, onSeleccionar }: Props) {
  const esHoy = dia === hoy;
  const [ahora, setAhora] = useState(ahoraMinutos);
  const contenedor = useRef<HTMLDivElement>(null);
  const foco = useRef<number | null>(null);

  useEffect(() => {
    if (!esHoy) return;
    const t = setInterval(() => setAhora(ahoraMinutos()), 60_000);
    return () => clearInterval(t);
  }, [esHoy]);

  // En pantallas angostas la línea de tiempo no entra: se abre centrada en
  // ahora (hoy) o en la primera actividad del día, no en las 6 de la mañana.
  useEffect(() => {
    const el = contenedor.current;
    if (!el || foco.current === null || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = Math.max(0, foco.current * el.scrollWidth - el.clientWidth / 2);
  }, [dia, cargando]);

  if (cargando && personas.length === 0) return <Esqueleto filas={5} />;

  // Ventana horaria: lo que abarcan turnos y marcas del día, con un margen.
  const minutos: number[] = [];
  for (const p of personas) {
    const f = filaDe(p.userId, dia);
    for (const h of [f?.shiftStart, f?.shiftEnd, f?.checkIn, f?.checkOut]) {
      const m = aMinutos(h);
      if (m !== null) minutos.push(m);
    }
  }
  if (esHoy) minutos.push(ahora);
  const desdeH = minutos.length ? Math.max(0, Math.floor(Math.min(...minutos) / 60) - 1) : 8;
  const hastaH = minutos.length ? Math.min(24, Math.ceil(Math.max(...minutos) / 60) + 1) : 20;
  const inicio = desdeH * 60;
  const total = Math.max(60, (hastaH - desdeH) * 60);
  const pct = (m: number) => `${((m - inicio) / total) * 100}%`;
  const ancho = (a: number, b: number) => `${(Math.max(0, b - a) / total) * 100}%`;
  const horas = Array.from({ length: hastaH - desdeH + 1 }, (_, i) => desdeH + i);
  const primeraActividad = minutos.length ? Math.min(...minutos) : inicio;
  foco.current = ((esHoy ? ahora : primeraActividad) - inicio) / total;
  const paso = horas.length > 14 ? 2 : 1;

  const ordenadas = [...personas].sort((a, b) => {
    const fa = aMinutos(filaDe(a.userId, dia)?.shiftStart) ?? 9999;
    const fb = aMinutos(filaDe(b.userId, dia)?.shiftStart) ?? 9999;
    return fa - fb || a.nombre.localeCompare(b.nombre, 'es');
  });

  return (
    <div
      ref={contenedor}
      className={`mg-scroll overflow-x-auto rounded-xl border border-[#f5d0d9] bg-white transition-opacity ${
        cargando ? 'opacity-60' : ''
      }`}
    >
      <div className="min-w-[640px]">
        {/* Regla de horas */}
        <div className="flex border-b border-[#f5d0d9]">
          <div className="sticky left-0 z-10 w-[7.5rem] sm:w-[10.5rem] shrink-0 bg-white px-3 py-2 text-xs text-[#8b5a6b]">Persona</div>
          <div className="relative h-8 flex-1">
            {horas.map((h, i) =>
              i % paso === 0 ? (
                <span
                  key={h}
                  className={`absolute top-2 text-[11px] text-[#8b5a6b] tabular-nums ${i === 0 ? 'pl-1' : '-translate-x-1/2'}`}
                  style={{ left: pct(h * 60) }}
                >
                  {String(h).padStart(2, '0')}
                </span>
              ) : null,
            )}
          </div>
          <div className="w-28 shrink-0 px-3 py-2 text-right text-xs text-[#8b5a6b]">Trabajado</div>
        </div>

        {ordenadas.map((p) => {
          const f = filaDe(p.userId, dia);
          const estado = estadoVisual(f, hoy);
          const ini = aMinutos(f?.shiftStart);
          const fin = aMinutos(f?.shiftEnd);
          const entrada = aMinutos(f?.checkIn);
          const salida = aMinutos(f?.checkOut) ?? (esHoy && entrada !== null ? ahora : null);
          const elegida = seleccion?.userId === p.userId && seleccion.day === dia;
          const revisar = f?.review === 'PENDIENTE';

          return (
            <button
              key={p.userId}
              onClick={() => onSeleccionar({ userId: p.userId, day: dia })}
              aria-pressed={elegida}
              className={`group flex w-full items-stretch border-b border-[#fcf0f3] text-left last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ec9cab] ${
                elegida ? 'bg-[#fcf0f3]' : 'hover:bg-[#fdf8fa]'
              }`}
            >
              <div
                className={`sticky left-0 z-10 flex w-[7.5rem] sm:w-[10.5rem] shrink-0 items-center gap-2 px-3 py-3 ${
                  elegida ? 'bg-[#fcf0f3]' : 'bg-white group-hover:bg-[#fdf8fa]'
                }`}
              >
                <span className="text-sm leading-tight break-words">{p.nombre}</span>
                {revisar && <span className="h-2 w-2 shrink-0 rounded-full bg-[#d97706]" title="A revisar" />}
              </div>

              <div className="relative h-14 flex-1">
                {/* Líneas de hora */}
                {horas.map((h) => (
                  <span key={h} className="absolute inset-y-0 w-px bg-[#fcf0f3]" style={{ left: pct(h * 60) }} />
                ))}

                {/* Turno planificado */}
                {ini !== null && fin !== null && (
                  <span
                    className={`absolute inset-y-2.5 rounded-md ${
                      estado === 'AUSENTE' || estado === 'LICENCIA'
                        ? ESTADOS[estado].celda
                        : 'border border-dashed border-[#d4a7ca] bg-[#fdf6f8]'
                    }`}
                    style={{ left: pct(ini), width: ancho(ini, fin) }}
                  >
                    {(estado === 'AUSENTE' || estado === 'LICENCIA' || estado === 'PLANIFICADO') && (
                      <span className="absolute inset-0 flex items-center px-2 text-xs whitespace-nowrap">
                        {estado === 'PLANIFICADO' ? `${f?.shiftStart}–${f?.shiftEnd}` : ESTADOS[estado].texto}
                      </span>
                    )}
                  </span>
                )}

                {/* Lo que pasó */}
                {entrada !== null && salida !== null && (
                  <span
                    className={`absolute inset-y-4 flex items-center rounded-md px-2 text-xs whitespace-nowrap ${ESTADOS[estado].chip}`}
                    style={{ left: pct(entrada), width: ancho(entrada, salida) }}
                  >
                    <span className="tabular-nums">
                      {f?.checkIn}–{f?.checkOut ?? 'ahora'}
                    </span>
                    {!f?.checkOut && esHoy && (
                      <span className="mg-latido absolute -right-1 h-2 w-2 rounded-full bg-[#3f8f5f]" />
                    )}
                  </span>
                )}

                {ini === null && entrada === null && (
                  <span className="absolute inset-0 flex items-center px-3 text-xs text-[#8b5a6b]">Sin turno</span>
                )}

                {/* Ahora */}
                {esHoy && ahora >= inicio && ahora <= inicio + total && (
                  <span className="absolute inset-y-0 w-0.5 bg-[#ec9cab]" style={{ left: pct(ahora) }} aria-hidden />
                )}
              </div>

              <div className="flex w-28 shrink-0 flex-col items-end justify-center px-3 text-right">
                <span className="text-sm tabular-nums">
                  {f?.workedMinutes
                    ? duracion(f.workedMinutes)
                    : esHoy && entrada !== null && !f?.checkOut
                      ? duracion(ahora - entrada)
                      : '—'}
                </span>
                {esHoy && entrada !== null && !f?.checkOut && !f?.workedMinutes && (
                  <span className="text-xs text-[#24533a]">en curso</span>
                )}
                {!!f?.lateMinutes && <span className="text-xs text-[#7a4a05] tabular-nums">{f.lateMinutes} min tarde</span>}
              </div>
            </button>
          );
        })}

        {personas.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-[#8b5a6b]">No hay nadie del equipo cargado en Ritmo todavía.</p>
        )}
      </div>
    </div>
  );
}
