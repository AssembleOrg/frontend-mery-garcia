'use client';

import type { FilaAsistencia } from '@/services/presentismo.service';
import { formatDiaISO } from '@/lib/utils';
import type { Persona, Seleccion } from './Presentismo';
import { ESTADOS, estadoVisual, esFinde, horasCortas, inicialDia, rangoDias } from './estados';
import Esqueleto from './Esqueleto';

interface Props {
  desde: string;
  hasta: string;
  hoy: string;
  personas: Persona[];
  filaDe: (userId: string, day: string) => FilaAsistencia | undefined;
  cargando: boolean;
  seleccion: Seleccion | null;
  onSeleccionar: (s: Seleccion) => void;
  onIrAlDia: (day: string) => void;
}

/** El mes como planilla: una fila por persona, una celda por día. */
export default function VistaMes({
  desde,
  hasta,
  hoy,
  personas,
  filaDe,
  cargando,
  seleccion,
  onSeleccionar,
  onIrAlDia,
}: Props) {
  const dias = rangoDias(desde, hasta);

  if (cargando && personas.length === 0) return <Esqueleto filas={5} />;

  return (
    <div
      className={`mg-scroll overflow-x-auto rounded-xl border border-[#f5d0d9] bg-white transition-opacity ${
        cargando ? 'opacity-60' : ''
      }`}
    >
      <table className="w-full min-w-[46rem] table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[7.5rem] sm:w-[9.5rem]" />
          {dias.map((d) => (
            <col key={d} />
          ))}
          <col className="w-[4.75rem]" />
          <col className="w-[3.25rem]" />
          <col className="w-[3.5rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#f5d0d9]">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-normal text-[#8b5a6b]"
            >
              Persona
            </th>
            {dias.map((d) => {
              const esHoy = d === hoy;
              return (
                <th key={d} scope="col" className={`px-0.5 py-1.5 font-normal ${esFinde(d) ? 'bg-[#fbf3f6]' : ''}`}>
                  <button
                    onClick={() => onIrAlDia(d)}
                    title={`Ver el ${formatDiaISO(d)}`}
                    className={`mx-auto flex w-full max-w-7 flex-col items-center rounded-md py-0.5 text-[11px] leading-tight transition-colors hover:bg-[#fcf0f3] focus-visible:outline-2 focus-visible:outline-[#ec9cab] ${
                      esHoy ? 'bg-[#f9bbc4] text-[#4a3540]' : 'text-[#8b5a6b]'
                    }`}
                  >
                    <span>{inicialDia(d)}</span>
                    <span className="tabular-nums text-[#4a3540]">{Number(d.slice(8))}</span>
                  </button>
                </th>
              );
            })}
            <th scope="col" className="border-l border-[#f5d0d9] px-2 py-2 text-right text-xs font-normal text-[#8b5a6b]">
              Horas
            </th>
            <th scope="col" className="px-2 py-2 text-right text-xs font-normal text-[#8b5a6b]">
              Tarde
            </th>
            <th scope="col" className="px-2 pr-3 py-2 text-right text-xs font-normal text-[#8b5a6b]">
              Faltas
            </th>
          </tr>
        </thead>
        <tbody>
          {personas.map((p) => {
            let trabajado = 0;
            let tarde = 0;
            let faltas = 0;
            return (
              <tr key={p.userId} className="border-b border-[#fcf0f3] last:border-b-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-normal"
                >
                  <span className="block truncate">{p.nombre}</span>
                </th>
                {dias.map((d) => {
                  const fila = filaDe(p.userId, d);
                  const estado = estadoVisual(fila, hoy);
                  if (fila && d <= hoy && estado !== 'PLANIFICADO') {
                    trabajado += fila.workedMinutes;
                    if (fila.lateMinutes > 0) tarde += 1;
                    if (estado === 'AUSENTE') faltas += 1;
                  }
                  const elegida = seleccion?.userId === p.userId && seleccion.day === d;
                  const revisar = fila?.review === 'PENDIENTE';
                  return (
                    <td
                      key={d}
                      className={`px-[2px] py-1 ${d === hoy ? 'bg-[#f6f1f4]' : esFinde(d) ? 'bg-[#fbf3f6]' : ''}`}
                    >
                      <button
                        onClick={() => onSeleccionar({ userId: p.userId, day: d })}
                        aria-pressed={elegida}
                        aria-label={`${p.nombre}, ${formatDiaISO(d)}: ${ESTADOS[estado].texto}${revisar ? ', a revisar' : ''}`}
                        title={`${formatDiaISO(d)} · ${ESTADOS[estado].texto}${
                          fila?.checkIn ? ` · ${fila.checkIn}–${fila.checkOut ?? '…'}` : ''
                        }`}
                        className={`relative mx-auto block h-7 w-full max-w-7 rounded-[5px] transition-[box-shadow,transform] duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ec9cab] ${
                          estado === 'SIN_TURNO' ? 'bg-white/70 ring-1 ring-inset ring-[#f5ebee]' : ESTADOS[estado].celda
                        } ${elegida ? 'ring-2 ring-[#4a3540] ring-offset-1' : ''}`}
                      >
                        {revisar && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-[#d97706]" />
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="border-l border-[#f5d0d9] px-2 text-right tabular-nums">{horasCortas(trabajado)}</td>
                <td className={`px-2 text-right tabular-nums ${tarde ? 'text-[#7a4a05]' : 'text-[#8b5a6b]'}`}>{tarde}</td>
                <td className={`px-2 pr-3 text-right tabular-nums ${faltas ? 'text-[#9b1450]' : 'text-[#8b5a6b]'}`}>{faltas}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {personas.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-[#8b5a6b]">
          No hay nadie del equipo cargado en Ritmo todavía.
        </p>
      )}
    </div>
  );
}
