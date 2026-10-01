'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import HoraInput, { HORA_VALIDA } from './HoraInput';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DIAS_SEMANA,
  horaAMinutos,
  minutosAHora,
  presentismoService,
  type Alternancia,
  type PatronDePersona,
  type TramoPatron,
} from '@/services/presentismo.service';

interface Edicion {
  tramo: TramoPatron | null;
  ritmoUserId: string;
  nombre: string;
  diaIso: number;
  desde: string;
  hasta: string;
  alternancia: Alternancia;
}

const ETIQUETA_ALTERNANCIA: Record<Alternancia, string> = {
  TODAS: 'Todas las semanas',
  SEMANA_A: 'Semana A (una sí, una no)',
  SEMANA_B: 'Semana B (la otra)',
};

export default function TabPatron() {
  const [patron, setPatron] = useState<PatronDePersona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [edicion, setEdicion] = useState<Edicion | null>(null);

  /**
   * Se cruza el patrón con el equipo de Ritmo: quien todavía no tiene ningún
   * tramo igual tiene que aparecer, porque si no no hay forma de cargarle el
   * primero.
   */
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [tramos, equipo] = await Promise.all([
        presentismoService.patron(),
        presentismoService.equipo(),
      ]);

      const porId = new Map(tramos.map((p) => [p.ritmoUserId, p]));
      const completo: PatronDePersona[] = equipo.people
        .filter((p) => p.role === 'EMPLEADO' && p.isActive)
        .map(
          (p) =>
            porId.get(p.id) ?? {
              ritmoUserId: p.id,
              nombre: p.fullName,
              tramos: [],
              horasSemanaA: 0,
              horasSemanaB: 0,
            },
        );

      // Si alguien tiene patrón pero ya no figura como empleado activo, se
      // muestra igual: si no, su horario quedaría generándose sin que se vea.
      for (const p of tramos) {
        if (!completo.some((c) => c.ritmoUserId === p.ritmoUserId)) completo.push(p);
      }

      setPatron(completo);
    } catch (error) {
      console.error('Error cargando el horario fijo:', error);
      toast.error('No se pudo cargar el horario fijo');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirNuevo = (persona: PatronDePersona, diaIso = 2) =>
    setEdicion({
      tramo: null,
      ritmoUserId: persona.ritmoUserId,
      nombre: persona.nombre,
      diaIso,
      desde: '10:00',
      hasta: '18:00',
      alternancia: 'TODAS',
    });

  const abrirExistente = (tramo: TramoPatron) =>
    setEdicion({
      tramo,
      ritmoUserId: tramo.ritmoUserId,
      nombre: tramo.nombre,
      diaIso: tramo.diaIso,
      desde: minutosAHora(tramo.desdeMinuto),
      hasta: minutosAHora(tramo.hastaMinuto),
      alternancia: tramo.alternancia,
    });

  const guardar = async () => {
    if (!edicion) return;
    if (!HORA_VALIDA.test(edicion.desde) || !HORA_VALIDA.test(edicion.hasta)) {
      toast.error('Escribí las horas como 10:00 o 18:30');
      return;
    }
    const desdeMinuto = horaAMinutos(edicion.desde);
    const hastaMinuto = horaAMinutos(edicion.hasta);
    if (hastaMinuto <= desdeMinuto) {
      toast.error('La salida tiene que ser posterior a la entrada');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        diaIso: edicion.diaIso,
        desdeMinuto,
        hastaMinuto,
        alternancia: edicion.alternancia,
      };
      if (edicion.tramo) {
        await presentismoService.editarTramo(edicion.tramo.id, payload);
      } else {
        await presentismoService.crearTramo({ ...payload, ritmoUserId: edicion.ritmoUserId });
      }
      toast.success('Horario fijo actualizado', {
        description: 'Se aplica a las semanas que se generen de ahora en adelante.',
      });
      setEdicion(null);
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    if (!edicion?.tramo) return;
    setGuardando(true);
    try {
      await presentismoService.borrarTramo(edicion.tramo.id);
      toast.success('Tramo eliminado');
      setEdicion(null);
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-[#fcf0f3]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="max-w-[70ch] text-sm text-[#6b4c57]">
        El horario que se repite todas las semanas. El domingo a la noche se arma sola la semana
        siguiente a partir de acá. Un cambio vale de ahí en adelante; para un día puntual, usá la
        escala Semana o Día.
      </p>

      {patron.length === 0 ? (
        <div className="rounded-xl border border-[#f5d0d9] bg-white px-4 py-12 text-center text-sm text-[#6b4c57]">
          No hay nadie del equipo cargado en Ritmo todavía.
        </div>
      ) : (
        <div className="mg-scroll overflow-x-auto rounded-xl border border-[#f5d0d9] bg-white">
          <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-[7.5rem] sm:w-[10.5rem]" />
              {DIAS_SEMANA.map((d) => (
                <col key={d.iso} />
              ))}
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#f5d0d9] text-xs text-[#8b5a6b]">
                <th scope="col" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-normal">Persona</th>
                {DIAS_SEMANA.map((d) => (
                  <th key={d.iso} scope="col" className="px-1 py-2 text-center font-normal">{d.corto}</th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-normal">Horas</th>
              </tr>
            </thead>
            <tbody>
              {patron.map((persona) => (
                <tr key={persona.ritmoUserId} className="border-b border-[#fcf0f3] last:border-b-0">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-normal">
                    <span className="block truncate">{persona.nombre}</span>
                  </th>
                  {DIAS_SEMANA.map((d) => {
                    const tramos = persona.tramos.filter((t) => t.diaIso === d.iso);
                    return (
                      <td key={d.iso} className="p-1 align-top">
                        <div className="flex min-h-[3.25rem] flex-col gap-1">
                          {tramos.map((tramo) => (
                            <button
                              key={tramo.id}
                              onClick={() => abrirExistente(tramo)}
                              className={`rounded-md px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ec9cab] ${
                                tramo.activo
                                  ? 'bg-[#f3e4ec] text-[#4a3540] hover:bg-[#ead0dc]'
                                  : 'bg-[#fcf0f3] text-[#8b5a6b] line-through'
                              }`}
                            >
                              <span className="tabular-nums">
                                {minutosAHora(tramo.desdeMinuto)}–{minutosAHora(tramo.hastaMinuto)}
                              </span>
                              {tramo.alternancia !== 'TODAS' && (
                                <span className="ml-1 text-[10px] text-[#8b5a6b]">
                                  {tramo.alternancia === 'SEMANA_A' ? 'sem. A' : 'sem. B'}
                                </span>
                              )}
                            </button>
                          ))}
                          <button
                            onClick={() => abrirNuevo(persona, d.iso)}
                            aria-label={`Agregar ${d.largo} a ${persona.nombre}`}
                            className={`flex flex-1 items-center justify-center rounded-md text-[#d4a7ca] transition-colors hover:bg-[#fcf0f3] hover:text-[#8b5a6b] focus-visible:outline-2 focus-visible:outline-[#ec9cab] ${
                              tramos.length ? 'min-h-6' : 'min-h-[3.25rem]'
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-3 text-right text-xs tabular-nums text-[#6b4c57]">
                    {persona.horasSemanaA === persona.horasSemanaB
                      ? `${persona.horasSemanaA} h`
                      : `A ${persona.horasSemanaA} h · B ${persona.horasSemanaB} h`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!edicion} onOpenChange={(abierto) => !abierto && setEdicion(null)}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4a3540]">
              {edicion?.tramo ? 'Editar día fijo' : 'Agregar día fijo'}
            </DialogTitle>
            <DialogDescription className="text-[#8b5a6b]">
              {edicion?.nombre} · se aplica a las semanas que se generen de ahora en adelante.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[#6b4c57]">Día</Label>
              <Select
                value={String(edicion?.diaIso ?? 2)}
                onValueChange={(v) =>
                  setEdicion((prev) => (prev ? { ...prev, diaIso: Number(v) } : prev))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem key={d.iso} value={String(d.iso)}>
                      {d.largo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-desde" className="text-[#6b4c57]">
                  Entrada
                </Label>
                <HoraInput
                  id="p-desde"
                  etiqueta="Entrada"
                  valor={edicion?.desde ?? ''}
                  onCambio={(v) => setEdicion((prev) => (prev ? { ...prev, desde: v } : prev))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-hasta" className="text-[#6b4c57]">
                  Salida
                </Label>
                <HoraInput
                  id="p-hasta"
                  etiqueta="Salida"
                  valor={edicion?.hasta ?? ''}
                  onCambio={(v) => setEdicion((prev) => (prev ? { ...prev, hasta: v } : prev))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#6b4c57]">Repetición</Label>
              <Select
                value={edicion?.alternancia ?? 'TODAS'}
                onValueChange={(v) =>
                  setEdicion((prev) =>
                    prev ? { ...prev, alternancia: v as Alternancia } : prev,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ETIQUETA_ALTERNANCIA) as Alternancia[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ETIQUETA_ALTERNANCIA[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#8b5a6b]">
                «Semana A / B» es para quien trabaja semana por medio: se carga un tramo en
                cada una.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {edicion?.tramo ? (
              <Button
                variant="outline"
                onClick={borrar}
                disabled={guardando}
                className="border-[#f5d0d9] text-[#9b1450] hover:bg-[#fdf0f5]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEdicion(null)} disabled={guardando}>
                Cancelar
              </Button>
              <Button
                onClick={guardar}
                disabled={guardando}
                className="bg-[#4a3540] text-white hover:bg-[#6b4c57]"
              >
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
