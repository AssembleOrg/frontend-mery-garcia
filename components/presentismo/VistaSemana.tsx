'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Send } from 'lucide-react';
import { formatDiaISO } from '@/lib/utils';
import {
  presentismoService,
  type FilaAsistencia,
  type SemanaHorarios,
} from '@/services/presentismo.service';
import type { Persona, Seleccion } from './Presentismo';
import { ESTADOS, cortoDia, esFinde, estadoVisual, horasCortas, rangoDias, sumarDias } from './estados';
import Esqueleto from './Esqueleto';

interface Props {
  desde: string;
  hoy: string;
  personas: Persona[];
  filaDe: (userId: string, day: string) => FilaAsistencia | undefined;
  cargando: boolean;
  version: number;
  seleccion: Seleccion | null;
  onSeleccionar: (s: Seleccion) => void;
  onIrAlDia: (day: string) => void;
  onCambio: () => void;
}

/** La semana: los turnos cargados y, en los días que ya pasaron, cómo fueron. */
export default function VistaSemana({
  desde,
  hoy,
  personas,
  filaDe,
  cargando,
  version,
  seleccion,
  onSeleccionar,
  onIrAlDia,
  onCambio,
}: Props) {
  const [semana, setSemana] = useState<SemanaHorarios | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const dias = rangoDias(desde, sumarDias(desde, 6));

  useEffect(() => {
    let vigente = true;
    presentismoService
      .semana(desde)
      .then((s) => vigente && setSemana(s))
      .catch(() => vigente && toast.error('No se pudieron cargar los turnos de la semana'));
    return () => {
      vigente = false;
    };
  }, [desde, version]);

  const turnosDe = (userId: string, day: string) =>
    semana?.rows.find((r) => r.userId === userId)?.cells[day] ?? [];

  const publicar = async () => {
    setOcupado(true);
    try {
      const { published } = await presentismoService.publicar(desde);
      toast.success(
        published > 0
          ? `Semana publicada: ${published} ${published === 1 ? 'cambio' : 'cambios'}`
          : 'No había cambios para publicar',
      );
      onCambio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar');
    } finally {
      setOcupado(false);
    }
  };

  const rearmar = async () => {
    setOcupado(true);
    try {
      const r = await presentismoService.generarDesdePatron(desde);
      toast.success(`${r.creados} turnos creados · ${r.yaEstaban} ya estaban`);
      onCambio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo rearmar la semana');
    } finally {
      setOcupado(false);
    }
  };

  if ((cargando && personas.length === 0) || !semana) return <Esqueleto filas={5} />;

  const sinPublicar = semana.unpublished;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#8b5a6b]">
          {semana.publishedLabel} · semana {semana.esSemanaA ? 'A' : 'B'}
          {sinPublicar > 0 && (
            <span className="text-[#7a4a05]">
              {' '}
              · {sinPublicar} {sinPublicar === 1 ? 'cambio' : 'cambios'} sin publicar: el equipo todavía no los ve
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={rearmar}
            disabled={ocupado}
            title="Vuelve a armar la semana desde el horario fijo, sin pisar lo que ya está cargado"
            className="inline-flex items-center gap-2 rounded-lg border border-[#f5d0d9] bg-white px-3 py-1.5 text-sm text-[#6b4c57] transition-colors hover:bg-[#fcf0f3] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
          >
            <RefreshCw className="h-4 w-4" />
            Rearmar desde horario fijo
          </button>
          <button
            onClick={publicar}
            disabled={ocupado}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4a3540] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#6b4c57] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
          >
            <Send className="h-4 w-4" />
            Publicar
            {sinPublicar > 0 && (
              <span className="rounded-full bg-[#f9bbc4] px-1.5 text-xs leading-5 text-[#4a3540] tabular-nums">{sinPublicar}</span>
            )}
          </button>
        </div>
      </div>

      <div
        className={`mg-scroll overflow-x-auto rounded-xl border border-[#f5d0d9] bg-white transition-opacity ${
          cargando ? 'opacity-60' : ''
        }`}
      >
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[7.5rem] sm:w-[10.5rem]" />
            {dias.map((d) => (
              <col key={d} />
            ))}
            <col className="w-[6.5rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#f5d0d9]">
              <th scope="col" className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-normal text-[#8b5a6b]">
                Persona
              </th>
              {dias.map((d) => (
                <th key={d} scope="col" className={`px-1 py-1.5 font-normal ${esFinde(d) ? 'bg-[#fbf3f6]' : ''}`}>
                  <button
                    onClick={() => onIrAlDia(d)}
                    title={`Ver el ${formatDiaISO(d)}`}
                    className={`w-full rounded-md px-2 py-1 text-xs transition-colors hover:bg-[#fcf0f3] focus-visible:outline-2 focus-visible:outline-[#ec9cab] ${
                      d === hoy ? 'bg-[#f9bbc4] text-[#4a3540]' : 'text-[#6b4c57]'
                    }`}
                  >
                    {cortoDia(d)} <span className="tabular-nums">{formatDiaISO(d).slice(0, 5)}</span>
                  </button>
                </th>
              ))}
              <th scope="col" className="border-l border-[#f5d0d9] px-3 py-2 text-right text-xs font-normal text-[#8b5a6b]">
                Trabajado
              </th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.userId} className="border-b border-[#fcf0f3] last:border-b-0">
                <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-normal">
                  <span className="block truncate">{p.nombre}</span>
                </th>
                {dias.map((d) => {
                  const fila = filaDe(p.userId, d);
                  const turnos = turnosDe(p.userId, d);
                  const estado = turnos.length === 0 && !fila ? 'SIN_TURNO' : estadoVisual(fila, hoy);
                  const elegida = seleccion?.userId === p.userId && seleccion.day === d;
                  const pendienteDePublicar = turnos.some((t) => !t.published);
                  return (
                    <td
                      key={d}
                      className={`p-1 align-top ${d === hoy ? 'bg-[#f6f1f4]' : esFinde(d) ? 'bg-[#fbf3f6]' : ''}`}
                    >
                      <button
                        onClick={() => onSeleccionar({ userId: p.userId, day: d })}
                        aria-pressed={elegida}
                        aria-label={`${p.nombre}, ${formatDiaISO(d)}: ${ESTADOS[estado].texto}`}
                        className={`relative flex h-full min-h-[3.25rem] w-full flex-col items-start justify-center gap-0.5 rounded-md px-2 py-1.5 text-left transition-shadow duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ec9cab] ${
                          estado === 'SIN_TURNO' ? 'hover:bg-[#fdf6f8]' : ESTADOS[estado].celda
                        } ${elegida ? 'ring-2 ring-[#4a3540]' : ''}`}
                      >
                        {turnos.map((t) => (
                          <span key={t.id} className="text-xs tabular-nums">
                            {t.timeLabel}
                          </span>
                        ))}
                        {fila?.checkIn && (
                          <span className="text-[11px] tabular-nums opacity-80">
                            real {fila.checkIn}–{fila.checkOut ?? '…'}
                          </span>
                        )}
                        {pendienteDePublicar && (
                          <span className="text-[10px] text-[#7a4a05]">sin publicar</span>
                        )}
                        {fila?.review === 'PENDIENTE' && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#d97706]" title="A revisar" />
                        )}
                      </button>
                    </td>
                  );
                })}
                {(() => {
                  let trabajado = 0;
                  let planificado = 0;
                  for (const d of dias) {
                    const f = filaDe(p.userId, d);
                    if (!f || d > hoy) continue;
                    trabajado += f.workedMinutes;
                    planificado += f.plannedMinutes;
                  }
                  return (
                    <td className="border-l border-[#f5d0d9] px-3 text-right align-middle">
                      <span className="block text-sm tabular-nums">{horasCortas(trabajado)}</span>
                      {planificado > 0 && (
                        <span className="block text-[11px] text-[#8b5a6b] tabular-nums">de {horasCortas(planificado)}</span>
                      )}
                    </td>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
