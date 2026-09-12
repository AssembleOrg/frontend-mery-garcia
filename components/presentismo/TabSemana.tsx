'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Spinner from '@/components/common/Spinner';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  horaAMinutos,
  lunesDe,
  presentismoService,
  sumarSemanas,
  type SemanaHorarios,
  type TurnoCelda,
} from '@/services/presentismo.service';

interface Edicion {
  /** Turno existente, o null si se está creando uno nuevo. */
  turno: TurnoCelda | null;
  userId: string;
  nombre: string;
  day: string;
  desde: string;
  hasta: string;
}

export default function TabSemana() {
  const [lunes, setLunes] = useState(() => lunesDe());
  const [semana, setSemana] = useState<SemanaHorarios | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [edicion, setEdicion] = useState<Edicion | null>(null);

  const cargar = useCallback(async (desde: string) => {
    setCargando(true);
    try {
      setSemana(await presentismoService.semana(desde));
    } catch (error) {
      console.error('Error cargando la semana:', error);
      toast.error('No se pudo cargar la semana');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(lunes);
  }, [lunes, cargar]);

  const abrirNuevo = (userId: string, nombre: string, day: string) =>
    setEdicion({ turno: null, userId, nombre, day, desde: '10:00', hasta: '18:00' });

  const abrirExistente = (turno: TurnoCelda, nombre: string) => {
    const [desde, hasta] = turno.timeLabel.split('–');
    setEdicion({
      turno,
      userId: turno.userId,
      nombre,
      day: turno.day,
      desde: desde?.trim() ?? '10:00',
      hasta: hasta?.trim() ?? '18:00',
    });
  };

  const guardar = async () => {
    if (!edicion) return;
    const desdeMinuto = horaAMinutos(edicion.desde);
    const hastaMinuto = horaAMinutos(edicion.hasta);
    if (hastaMinuto <= desdeMinuto) {
      toast.error('La salida tiene que ser posterior a la entrada');
      return;
    }

    setGuardando(true);
    try {
      if (edicion.turno) {
        await presentismoService.editarTurno(edicion.turno.id, {
          day: edicion.day,
          desdeMinuto,
          hastaMinuto,
        });
        toast.success('Turno actualizado');
      } else {
        await presentismoService.crearTurno({
          userId: edicion.userId,
          day: edicion.day,
          desdeMinuto,
          hastaMinuto,
        });
        toast.success('Turno agregado');
      }
      setEdicion(null);
      await cargar(lunes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el turno');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    if (!edicion?.turno) return;
    setGuardando(true);
    try {
      await presentismoService.borrarTurno(edicion.turno.id);
      toast.success('Turno eliminado');
      setEdicion(null);
      await cargar(lunes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el turno');
    } finally {
      setGuardando(false);
    }
  };

  const publicar = async () => {
    setGuardando(true);
    try {
      const { published } = await presentismoService.publicar(lunes);
      toast.success(
        published > 0
          ? `Semana publicada: ${published} ${published === 1 ? 'cambio' : 'cambios'}`
          : 'No había cambios para publicar',
      );
      await cargar(lunes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar');
    } finally {
      setGuardando(false);
    }
  };

  const regenerar = async () => {
    setGuardando(true);
    try {
      const r = await presentismoService.generarDesdePatron(lunes);
      toast.success(`${r.creados} turnos creados · ${r.yaEstaban} ya estaban`);
      await cargar(lunes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de semana */}
      <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLunes(sumarSemanas(lunes, -1))}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[210px] text-center">
              <div className="font-semibold text-[#4a3540]">{semana?.label ?? '…'}</div>
              <div className="text-xs text-[#8b5a6b]">
                {semana?.publishedLabel}
                {semana && (
                  <> · semana {semana.esSemanaA ? 'A' : 'B'}</>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLunes(sumarSemanas(lunes, 1))}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLunes(lunesDe())}>
              Hoy
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={regenerar}
              disabled={guardando}
              title="Vuelve a armar la semana desde el horario fijo, sin pisar lo que ya está cargado"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rearmar desde el horario fijo
            </Button>
            <Button
              size="sm"
              onClick={publicar}
              disabled={guardando}
              className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white"
              title="Hasta que no se publica, el equipo no ve los cambios en su teléfono"
            >
              <Send className="mr-2 h-4 w-4" />
              Publicar
              {semana && semana.unpublished > 0 && (
                <Badge className="ml-2 bg-white/25 text-white">{semana.unpublished}</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !semana ? null : (
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardContent className="p-0">
            {/* La grilla scrollea sola: con 7 días no entra en un celular */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="border-b border-[#f9bbc4]/30">
                    <th className="sticky left-0 z-10 bg-white p-3 text-left text-xs font-semibold text-[#6b4c57]">
                      Persona
                    </th>
                    {semana.days.map((dia) => (
                      <th
                        key={dia.key}
                        className={`p-3 text-center text-xs font-semibold ${
                          dia.weekend ? 'bg-[#f9bbc4]/5 text-[#8b5a6b]' : 'text-[#6b4c57]'
                        }`}
                      >
                        {dia.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {semana.rows
                    .filter((fila) => fila.userId)
                    .map((fila) => (
                      <tr key={fila.userId} className="border-b border-[#f9bbc4]/15">
                        <td className="sticky left-0 z-10 bg-white p-3">
                          <div className="text-sm font-medium text-[#4a3540]">{fila.name}</div>
                          <div className="text-xs text-[#8b5a6b]">{fila.plannedHours} h</div>
                        </td>
                        {semana.days.map((dia) => {
                          const turnos = fila.cells[dia.key] ?? [];
                          return (
                            <td
                              key={dia.key}
                              className={`p-2 align-top ${dia.weekend ? 'bg-[#f9bbc4]/5' : ''}`}
                            >
                              <div className="space-y-1">
                                {turnos.map((turno) => (
                                  <button
                                    key={turno.id}
                                    onClick={() => abrirExistente(turno, fila.name)}
                                    className={`w-full rounded-md px-2 py-1.5 text-xs font-medium transition hover:opacity-80 ${
                                      turno.published
                                        ? 'bg-[#e8b4c6]/30 text-[#4a3540]'
                                        : 'border border-dashed border-[#d4a7ca] bg-[#d4a7ca]/10 text-[#6b4c57]'
                                    }`}
                                    title={turno.published ? 'Publicado' : 'Sin publicar'}
                                  >
                                    {turno.timeLabel}
                                  </button>
                                ))}
                                <button
                                  onClick={() => abrirNuevo(fila.userId!, fila.name, dia.key)}
                                  className="flex w-full items-center justify-center rounded-md py-1 text-[#d4a7ca] opacity-0 transition hover:bg-[#f9bbc4]/10 focus:opacity-100 group-hover:opacity-100 sm:opacity-60"
                                  aria-label={`Agregar turno a ${fila.name} el ${dia.label}`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alta / edición de un turno suelto */}
      <Dialog open={!!edicion} onOpenChange={(abierto) => !abierto && setEdicion(null)}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4a3540]">
              {edicion?.turno ? 'Editar turno' : 'Agregar turno'}
            </DialogTitle>
            <DialogDescription className="text-[#8b5a6b]">
              {edicion?.nombre} · {edicion?.day}
              <br />
              Cambia sólo este día. Para el horario que se repite todas las semanas, usá
              la pestaña «Horario fijo».
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="desde" className="text-[#6b4c57]">
                Entrada
              </Label>
              <Input
                id="desde"
                type="time"
                value={edicion?.desde ?? ''}
                onChange={(e) =>
                  setEdicion((prev) => (prev ? { ...prev, desde: e.target.value } : prev))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hasta" className="text-[#6b4c57]">
                Salida
              </Label>
              <Input
                id="hasta"
                type="time"
                value={edicion?.hasta ?? ''}
                onChange={(e) =>
                  setEdicion((prev) => (prev ? { ...prev, hasta: e.target.value } : prev))
                }
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            {edicion?.turno ? (
              <Button variant="outline" onClick={borrar} disabled={guardando} className="text-rose-600">
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
                className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white"
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
