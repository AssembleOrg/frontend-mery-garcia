'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import Spinner from '@/components/common/Spinner';
import { Plus, Repeat, Trash2 } from 'lucide-react';
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

  const abrirNuevo = (persona: PatronDePersona) =>
    setEdicion({
      tramo: null,
      ritmoUserId: persona.ritmoUserId,
      nombre: persona.nombre,
      diaIso: 2,
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
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-[#f9bbc4]/30 bg-white/95">
        <CardContent className="flex items-start gap-3 p-4">
          <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-[#d4a7ca]" />
          <p className="text-sm text-[#6b4c57]">
            Este es el horario que se repite todas las semanas. El domingo a la noche se
            arma sola la semana que viene a partir de acá. Cambiar un tramo afecta de ahí
            en adelante; para tocar un día puntual, usá la pestaña «Semana».
          </p>
        </CardContent>
      </Card>

      {patron.length === 0 ? (
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-[#8b5a6b]">Todavía no hay ningún horario fijo cargado.</p>
          </CardContent>
        </Card>
      ) : (
        patron.map((persona) => (
          <Card
            key={persona.ritmoUserId}
            className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-[#4a3540]">{persona.nombre}</CardTitle>
                <div className="mt-1 text-xs text-[#8b5a6b]">
                  {persona.horasSemanaA === persona.horasSemanaB
                    ? `${persona.horasSemanaA} h por semana`
                    : `${persona.horasSemanaA} h (semana A) · ${persona.horasSemanaB} h (semana B)`}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => abrirNuevo(persona)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar día
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {persona.tramos.length === 0 && (
                  <p className="py-1 text-sm text-[#8b5a6b]">
                    Todavía no tiene horario fijo. Tocá «Agregar día» para cargarle el
                    primero.
                  </p>
                )}
                {persona.tramos.map((tramo) => {
                  const dia = DIAS_SEMANA.find((d) => d.iso === tramo.diaIso);
                  return (
                    <button
                      key={tramo.id}
                      onClick={() => abrirExistente(tramo)}
                      className={`rounded-md border px-3 py-2 text-left transition hover:border-[#d4a7ca] hover:bg-[#f9bbc4]/10 ${
                        tramo.activo
                          ? 'border-[#e8b4c6]/40 bg-white'
                          : 'border-neutral-200 bg-neutral-50 opacity-60'
                      }`}
                    >
                      <div className="text-xs font-semibold text-[#6b4c57]">{dia?.largo}</div>
                      <div className="text-sm font-medium text-[#4a3540]">
                        {minutosAHora(tramo.desdeMinuto)}–{minutosAHora(tramo.hastaMinuto)}
                      </div>
                      {tramo.alternancia !== 'TODAS' && (
                        <Badge
                          variant="outline"
                          className="mt-1 border-[#d4a7ca]/40 text-[10px] text-[#8b5a6b]"
                        >
                          {tramo.alternancia === 'SEMANA_A' ? 'Semana A' : 'Semana B'}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
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
                <Input
                  id="p-desde"
                  type="time"
                  value={edicion?.desde ?? ''}
                  onChange={(e) =>
                    setEdicion((prev) => (prev ? { ...prev, desde: e.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-hasta" className="text-[#6b4c57]">
                  Salida
                </Label>
                <Input
                  id="p-hasta"
                  type="time"
                  value={edicion?.hasta ?? ''}
                  onChange={(e) =>
                    setEdicion((prev) => (prev ? { ...prev, hasta: e.target.value } : prev))
                  }
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
                className="text-rose-600"
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
