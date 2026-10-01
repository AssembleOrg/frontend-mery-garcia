'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Plus, Trash2, X, ZoomIn } from 'lucide-react';
import { formatDiaConNombre, formatDiaISO, mesesEnEspanol } from '@/lib/utils';
import {
  duracion,
  horaAMinutos,
  lunesDe,
  presentismoService,
  type FilaAsistencia,
  type Pendiente,
  type TurnoCelda,
} from '@/services/presentismo.service';
import type { Persona } from './Presentismo';
import { ESTADOS, diaDePendiente, estadoVisual, hoyISO } from './estados';
import HoraInput, { HORA_VALIDA } from './HoraInput';

interface Props {
  persona: Persona;
  day: string;
  fila: FilaAsistencia | undefined;
  pendientes: Pendiente[];
  onCambio: () => void;
  /** null cuando el contenedor (la hoja del celular) ya trae su propio cerrar. */
  onCerrar: (() => void) | null;
  onIrAlDia?: () => void;
}

const TIPO_PENDIENTE: Record<string, string> = {
  LICENCIA: 'Licencia',
  AUSENCIA: 'Ausencia',
  FICHAJE: 'Fichaje a revisar',
  TARDE: 'Llegada tarde',
  HORAS_EXTRA: 'Horas extra',
};

const REVISION: Record<string, string> = {
  VALIDO: 'Justificado',
  PENDIENTE: 'A revisar',
  RECHAZADO: 'Rechazado',
};

/** Todo lo de una persona en un día, y lo que se puede hacer al respecto. */
export default function PanelDia({ persona, day, fila, pendientes, onCambio, onCerrar, onIrAlDia }: Props) {
  const [turnos, setTurnos] = useState<TurnoCelda[] | null>(null);
  const [nuevo, setNuevo] = useState<{ desde: string; hasta: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const estado = estadoVisual(fila, hoyISO());
  const conDia = pendientes.map((p) => ({ ...p, dia: diaDePendiente(p.when) }));
  const delDia = conDia.filter((p) => p.dia === day);
  const otros = conDia.filter((p) => p.dia !== day);

  // Los turnos del día salen de la semana: ahí están los ids para editarlos.
  useEffect(() => {
    let vigente = true;
    setTurnos(null);
    setNuevo(null);
    presentismoService
      .semana(lunesDe(new Date(`${day}T12:00:00`)))
      .then((s) => {
        if (!vigente) return;
        setTurnos(s.rows.find((r) => r.userId === persona.userId)?.cells[day] ?? []);
      })
      .catch(() => vigente && setTurnos([]));
    return () => {
      vigente = false;
    };
  }, [day, persona.userId, fila]);

  const ejecutar = async (accion: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try {
      await accion();
      toast.success(ok);
      setNuevo(null);
      onCambio();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setOcupado(false);
    }
  };

  const validar = (desde: string, hasta: string) => {
    if (!HORA_VALIDA.test(desde) || !HORA_VALIDA.test(hasta)) {
      toast.error('Escribí las horas como 10:00 o 18:30');
      return false;
    }
    if (horaAMinutos(hasta) <= horaAMinutos(desde)) {
      toast.error('La salida tiene que ser posterior a la entrada');
      return false;
    }
    return true;
  };

  const datos: Array<[string, string, string?]> = fila
    ? [
        ['Turno', fila.shiftStart ? `${fila.shiftStart}–${fila.shiftEnd}` : 'Sin turno'],
        ['Entrada', fila.checkIn ?? '—'],
        ['Salida', fila.checkOut ?? (fila.checkIn ? 'en curso' : '—')],
        ['Pausa', fila.breakMinutes ? duracion(fila.breakMinutes) : '—'],
        ['Trabajado', duracion(fila.workedMinutes)],
        ['Saldo', fila.plannedMinutes && estado !== 'PLANIFICADO' ? duracion(fila.balanceMinutes) : '—', fila.balanceMinutes < 0 && estado !== 'PLANIFICADO' ? 'text-[#9b1450]' : undefined],
        ['Tarde', fila.lateMinutes ? `${fila.lateMinutes} min` : '—', fila.lateMinutes ? 'text-[#7a4a05]' : undefined],
      ]
    : [];

  return (
    <div className="flex flex-col">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 border-b border-[#f5d0d9] p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg leading-tight">{persona.nombre}</h2>
          <p className="mt-0.5 text-sm text-[#8b5a6b] tabular-nums">{formatDiaConNombre(day)}</p>
          <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs ${ESTADOS[estado].chip}`}>
            {ESTADOS[estado].texto}
          </span>
        </div>
        <div className={`flex shrink-0 gap-1 ${onCerrar ? '' : 'mr-8'}`}>
          {onIrAlDia && (
            <button
              onClick={onIrAlDia}
              aria-label="Ver este día"
              title="Ver este día"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b4c57] hover:bg-[#fcf0f3] focus-visible:outline-2 focus-visible:outline-[#ec9cab]"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          )}
          {onCerrar && (
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6b4c57] hover:bg-[#fcf0f3] focus-visible:outline-2 focus-visible:outline-[#ec9cab]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lo que pasó */}
      {fila && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-[#f5d0d9] p-4 text-sm">
          {datos.map(([etiqueta, valor, clase]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-xs text-[#8b5a6b]">{etiqueta}</dt>
              <dd className={`tabular-nums ${clase ?? ''}`}>{valor}</dd>
            </div>
          ))}
          {fila.review && (
            <div className="col-span-2 flex flex-col">
              <dt className="text-xs text-[#8b5a6b]">Revisión</dt>
              <dd className={fila.review === 'PENDIENTE' ? 'text-[#7a4a05]' : ''}>
                {REVISION[fila.review] ?? fila.review}
                {fila.reviewReason && <span className="block text-xs text-[#8b5a6b]">{fila.reviewReason}</span>}
              </dd>
            </div>
          )}
        </dl>
      )}

      {/* Turno */}
      <section className="border-b border-[#f5d0d9] p-4">
        <h3 className="mb-2 text-sm text-[#6b4c57]">Turno de este día</h3>
        {turnos === null ? (
          <div className="h-9 animate-pulse rounded-md bg-[#fcf0f3]" />
        ) : (
          <div className="space-y-2">
            {turnos.map((t) => (
              <EditorTurno
                key={`${t.id}-${t.timeLabel}`}
                turno={t}
                ocupado={ocupado}
                onGuardar={(desde, hasta) =>
                  validar(desde, hasta) &&
                  ejecutar(
                    () =>
                      presentismoService.editarTurno(t.id, {
                        day,
                        desdeMinuto: horaAMinutos(desde),
                        hastaMinuto: horaAMinutos(hasta),
                      }),
                    'Turno actualizado',
                  )
                }
                onBorrar={() => ejecutar(() => presentismoService.borrarTurno(t.id), 'Turno eliminado')}
              />
            ))}

            {nuevo ? (
              <div className="flex items-center gap-2">
                <HoraInput valor={nuevo.desde} onCambio={(v) => setNuevo({ ...nuevo, desde: v })} etiqueta="Entrada" />
                <span className="text-[#8b5a6b]">–</span>
                <HoraInput valor={nuevo.hasta} onCambio={(v) => setNuevo({ ...nuevo, hasta: v })} etiqueta="Salida" />
                <button
                  onClick={() =>
                    validar(nuevo.desde, nuevo.hasta) &&
                    ejecutar(
                      () =>
                        presentismoService.crearTurno({
                          userId: persona.userId,
                          day,
                          desdeMinuto: horaAMinutos(nuevo.desde),
                          hastaMinuto: horaAMinutos(nuevo.hasta),
                        }),
                      'Turno agregado',
                    )
                  }
                  disabled={ocupado}
                  aria-label="Agregar turno"
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-[#4a3540] text-white hover:bg-[#6b4c57] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setNuevo(null)}
                  aria-label="Cancelar"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[#6b4c57] hover:bg-[#fcf0f3]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setNuevo({ desde: '10:00', hasta: '18:00' })}
                className="inline-flex items-center gap-1.5 text-sm text-[#6b4c57] underline-offset-4 hover:underline"
              >
                <Plus className="h-4 w-4" />
                {turnos.length ? 'Agregar otro turno' : 'Agregar turno'}
              </button>
            )}
            {turnos.some((t) => !t.published) && (
              <p className="text-xs text-[#7a4a05]">Sin publicar: el equipo lo ve cuando se publique la semana.</p>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-[#8b5a6b]">Cambia sólo este día. Lo que se repite cada semana está en Horario fijo.</p>
      </section>

      {/* Pendientes de la persona: los de este día primero */}
      <section className="p-4">
        <h3 className="text-sm text-[#6b4c57]">
          Esperando decisión
        </h3>
        {pendientes.length === 0 ? (
          <p className="mt-2 text-sm text-[#8b5a6b]">Nada pendiente de {persona.nombre.split(' ')[0]}.</p>
        ) : (
          <>
            <ListaPendientes
              titulo={`Este día (${delDia.length})`}
              items={delDia}
              vacio="Nada de este día."
              ocupado={ocupado}
              onResolver={(id, d) =>
                ejecutar(() => presentismoService.resolverPendientes([id], d), d === 'APROBADA' ? 'Aprobado' : 'Rechazado')
              }
            />
            {otros.length > 0 && (
              <ListaPendientes
                titulo={`Otros días de ${persona.nombre.split(' ')[0]} (${otros.length})`}
                items={otros}
                ocupado={ocupado}
                onResolver={(id, d) =>
                  ejecutar(() => presentismoService.resolverPendientes([id], d), d === 'APROBADA' ? 'Aprobado' : 'Rechazado')
                }
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EditorTurno({
  turno,
  ocupado,
  onGuardar,
  onBorrar,
}: {
  turno: TurnoCelda;
  ocupado: boolean;
  onGuardar: (desde: string, hasta: string) => void;
  onBorrar: () => void;
}) {
  const [original] = useState(() => turno.timeLabel.split('–').map((s) => s.trim()));
  const [desde, setDesde] = useState(original[0] ?? '10:00');
  const [hasta, setHasta] = useState(original[1] ?? '18:00');
  const cambio = desde !== original[0] || hasta !== original[1];

  return (
    <div className="flex items-center gap-2">
      <HoraInput valor={desde} onCambio={setDesde} etiqueta="Entrada" />
      <span className="text-[#8b5a6b]">–</span>
      <HoraInput valor={hasta} onCambio={setHasta} etiqueta="Salida" />
      {cambio ? (
        <button
          onClick={() => onGuardar(desde, hasta)}
          disabled={ocupado}
          aria-label="Guardar turno"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-[#4a3540] text-white hover:bg-[#6b4c57] disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={onBorrar}
          disabled={ocupado}
          aria-label="Eliminar turno"
          title="Eliminar turno"
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#9b1450] hover:bg-[#fdf0f5] disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ListaPendientes({
  titulo,
  items,
  vacio,
  ocupado,
  onResolver,
}: {
  titulo: string;
  items: Array<Pendiente & { dia: string | null }>;
  vacio?: string;
  ocupado: boolean;
  onResolver: (id: string, decision: 'APROBADA' | 'RECHAZADA') => void;
}) {
  return (
    <div className="mt-3">
      <h4 className="text-xs text-[#8b5a6b]">{titulo}</h4>
      {items.length === 0 ? (
        vacio && <p className="mt-1 text-sm text-[#8b5a6b]">{vacio}</p>
      ) : (
        <ul className="mt-1">
          {items.map((p) => (
            <li key={p.id} className="border-t border-[#f5d0d9] py-3 first:border-t-0 first:pt-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{TIPO_PENDIENTE[p.kind] ?? mesesEnEspanol(p.label)}</span>
                <span className="shrink-0 text-xs text-[#8b5a6b] tabular-nums">
                  {p.dia ? formatDiaISO(p.dia) : mesesEnEspanol(p.when)}
                </span>
              </div>
              {p.detail && <p className="mt-1 text-xs text-[#8b5a6b]">{mesesEnEspanol(p.detail)}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onResolver(p.id, 'APROBADA')}
                  disabled={ocupado}
                  className="rounded-md bg-[#4a3540] px-3 py-1 text-sm text-white hover:bg-[#6b4c57] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => onResolver(p.id, 'RECHAZADA')}
                  disabled={ocupado}
                  className="rounded-md px-3 py-1 text-sm text-[#9b1450] hover:bg-[#fdf0f5] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
