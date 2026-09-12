'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Spinner from '@/components/common/Spinner';
import { CheckCircle2, Inbox, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  presentismoService,
  type Bandeja,
  type Pendiente,
  type TipoPendiente,
} from '@/services/presentismo.service';

const TIPO: Record<TipoPendiente, { texto: string; clase: string }> = {
  LICENCIA: { texto: 'Licencia', clase: 'border-sky-200 bg-sky-50 text-sky-700' },
  AUSENCIA: { texto: 'Ausencia', clase: 'border-rose-200 bg-rose-50 text-rose-700' },
  FICHAJE: { texto: 'Fichaje a revisar', clase: 'border-amber-200 bg-amber-50 text-amber-700' },
  TARDE: { texto: 'Llegada tarde', clase: 'border-orange-200 bg-orange-50 text-orange-700' },
  HORAS_EXTRA: { texto: 'Horas extra', clase: 'border-violet-200 bg-violet-50 text-violet-700' },
};

const FILTROS: Array<{ key: string; label: string; tipos: TipoPendiente[] | null }> = [
  { key: 'todo', label: 'Todo', tipos: null },
  { key: 'licencias', label: 'Licencias y vacaciones', tipos: ['LICENCIA', 'AUSENCIA'] },
  { key: 'fichajes', label: 'Fichajes a revisar', tipos: ['FICHAJE'] },
  { key: 'otros', label: 'Tarde y horas extra', tipos: ['TARDE', 'HORAS_EXTRA'] },
];

export default function TabPendientes() {
  const [bandeja, setBandeja] = useState<Bandeja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [resolviendo, setResolviendo] = useState(false);
  const [filtro, setFiltro] = useState('todo');
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setBandeja(await presentismoService.pendientes());
      setElegidos(new Set());
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      toast.error('No se pudieron cargar los pendientes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    if (!bandeja) return [];
    const tipos = FILTROS.find((f) => f.key === filtro)?.tipos;
    return tipos ? bandeja.incidents.filter((i) => tipos.includes(i.kind)) : bandeja.incidents;
  }, [bandeja, filtro]);

  const alternar = (id: string) =>
    setElegidos((previos) => {
      const copia = new Set(previos);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });

  const resolver = async (decision: 'APROBADA' | 'RECHAZADA') => {
    const ids = [...elegidos];
    if (ids.length === 0) return;
    setResolviendo(true);
    try {
      await presentismoService.resolverPendientes(ids, decision);
      toast.success(
        `${ids.length} ${ids.length === 1 ? 'pedido' : 'pedidos'} ${
          decision === 'APROBADA' ? 'aprobados' : 'rechazados'
        }`,
      );
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo resolver');
    } finally {
      setResolviendo(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!bandeja) return null;

  const { counts } = bandeja;

  return (
    <div className="space-y-4">
      <Card className="border border-[#f9bbc4]/30 bg-white/95">
        <CardContent className="p-4 text-sm text-[#6b4c57]">
          Acá llega todo lo que espera una decisión: los días que pide el equipo y las
          marcas que quedaron dudosas. Aprobar una marca a revisar no cambia la hora, solo
          confirma que la jornada vale.
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Esperando decisión', valor: counts.total, alerta: counts.total > 0 },
          { label: 'Licencias', valor: counts.licencias, alerta: false },
          { label: 'Fichajes a revisar', valor: counts.fichajes, alerta: counts.fichajes > 0 },
          { label: 'Resueltos esta semana', valor: counts.resueltasSemana, alerta: false },
        ].map((m) => (
          <Card key={m.label} className="border border-[#f9bbc4]/30 bg-white/95">
            <CardContent className="p-4">
              <div className="text-xs text-[#6b4c57]">{m.label}</div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  m.alerta ? 'text-amber-600' : 'text-[#4a3540]'
                }`}
              >
                {m.valor}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros y acciones */}
      <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={filtro === f.key ? 'default' : 'outline'}
                onClick={() => setFiltro(f.key)}
                className={
                  filtro === f.key
                    ? 'bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white'
                    : ''
                }
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => resolver('RECHAZADA')}
              disabled={elegidos.size === 0 || resolviendo}
              className="text-rose-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rechazar
              {elegidos.size > 0 && ` (${elegidos.size})`}
            </Button>
            <Button
              size="sm"
              onClick={() => resolver('APROBADA')}
              disabled={elegidos.size === 0 || resolviendo}
              className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprobar
              {elegidos.size > 0 && ` (${elegidos.size})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {visibles.length === 0 ? (
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardContent className="py-16 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-[#d4a7ca]" />
            <p className="text-sm text-[#8b5a6b]">
              {bandeja.incidents.length === 0
                ? 'No hay nada esperando una decisión. Todo al día.'
                : 'No hay nada de este tipo abierto.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
          <CardContent className="divide-y divide-[#f9bbc4]/15 p-0">
            {visibles.map((item: Pendiente) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 p-4 transition hover:bg-[#f9bbc4]/5"
              >
                <Checkbox
                  checked={elegidos.has(item.id)}
                  onCheckedChange={() => alternar(item.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#4a3540]">{item.person}</span>
                    <Badge variant="outline" className={TIPO[item.kind]?.clase}>
                      {TIPO[item.kind]?.texto ?? item.kind}
                    </Badge>
                    {item.priority === 'alta' && (
                      <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-[#6b4c57]">{item.label}</div>
                  {item.detail && (
                    <div className="mt-0.5 text-xs text-[#8b5a6b]">{item.detail}</div>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[#8b5a6b]">{item.when}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
