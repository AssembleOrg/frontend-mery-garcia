'use client';

import { formatDiaISO, mesesEnEspanol } from '@/lib/utils';
import { diaDePendiente } from './estados';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Inbox, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  presentismoService,
  type Bandeja,
  type Pendiente,
  type TipoPendiente,
} from '@/services/presentismo.service';

const TIPO: Record<TipoPendiente, { texto: string; clase: string }> = {
  LICENCIA: { texto: 'Licencia', clase: 'bg-[#dfe3f5] text-[#3b4a86]' },
  AUSENCIA: { texto: 'Ausencia', clase: 'bg-[#f8c9dc] text-[#9b1450]' },
  FICHAJE: { texto: 'Fichaje a revisar', clase: 'bg-[#fbe3b8] text-[#7a4a05]' },
  TARDE: { texto: 'Llegada tarde', clase: 'bg-[#fbe3b8] text-[#7a4a05]' },
  HORAS_EXTRA: { texto: 'Horas extra', clase: 'bg-[#ead7e4] text-[#5b2139]' },
};

const FILTROS: Array<{ key: string; label: string; tipos: TipoPendiente[] | null }> = [
  { key: 'todo', label: 'Todo', tipos: null },
  { key: 'licencias', label: 'Licencias y vacaciones', tipos: ['LICENCIA', 'AUSENCIA'] },
  { key: 'fichajes', label: 'Fichajes a revisar', tipos: ['FICHAJE'] },
  { key: 'otros', label: 'Tarde y horas extra', tipos: ['TARDE', 'HORAS_EXTRA'] },
];

export default function TabPendientes({ onCambio }: { onCambio?: () => void } = {}) {
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
      onCambio?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo resolver');
    } finally {
      setResolviendo(false);
    }
  };

  if (cargando && !bandeja) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-[#fcf0f3]" />
        ))}
      </div>
    );
  }
  if (!bandeja) return null;

  const { counts } = bandeja;
  const todosElegidos = visibles.length > 0 && visibles.every((v) => elegidos.has(v.id));

  return (
    <div className="space-y-4">
      <p className="max-w-[70ch] text-sm text-[#6b4c57]">
        Todo lo que espera una decisión: los días que pide el equipo y las marcas que quedaron
        dudosas. Aprobar una marca a revisar no cambia la hora, solo confirma que la jornada vale.
      </p>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {[
          { label: 'Esperando decisión', valor: counts.total, alerta: counts.total > 0 },
          { label: 'Licencias', valor: counts.licencias, alerta: false },
          { label: 'Fichajes a revisar', valor: counts.fichajes, alerta: counts.fichajes > 0 },
          { label: 'Resueltos esta semana', valor: counts.resueltasSemana, alerta: false },
        ].map((m) => (
          <div key={m.label} className="flex flex-col">
            <dt className="text-xs text-[#8b5a6b]">{m.label}</dt>
            <dd className={`text-xl tabular-nums ${m.alerta ? 'text-[#7a4a05]' : 'text-[#4a3540]'}`}>{m.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filtrar" className="inline-flex w-fit flex-wrap rounded-lg border border-[#f5d0d9] bg-white p-0.5">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filtro === f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab] ${
                filtro === f.key ? 'bg-[#4a3540] text-white' : 'text-[#6b4c57] hover:bg-[#fcf0f3]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => resolver('RECHAZADA')}
            disabled={elegidos.size === 0 || resolviendo}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[#9b1450] transition-colors hover:bg-[#fdf0f5] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
          >
            <XCircle className="h-4 w-4" />
            Rechazar{elegidos.size > 0 && ` (${elegidos.size})`}
          </button>
          <button
            onClick={() => resolver('APROBADA')}
            disabled={elegidos.size === 0 || resolviendo}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4a3540] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#6b4c57] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec9cab]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprobar{elegidos.size > 0 && ` (${elegidos.size})`}
          </button>
        </div>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-xl border border-[#f5d0d9] bg-white px-4 py-14 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-[#d4a7ca]" />
          <p className="text-sm text-[#6b4c57]">
            {bandeja.incidents.length === 0
              ? 'No hay nada esperando una decisión. Todo al día.'
              : 'No hay nada de este tipo abierto.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#f5d0d9] bg-white">
          <label className="flex cursor-pointer items-center gap-3 border-b border-[#f5d0d9] px-4 py-2 text-xs text-[#8b5a6b]">
            <Checkbox
              checked={todosElegidos}
              onCheckedChange={() =>
                setElegidos(todosElegidos ? new Set() : new Set(visibles.map((v) => v.id)))
              }
              className="border-[#d4a7ca] data-[state=checked]:border-[#4a3540] data-[state=checked]:bg-[#4a3540]"
            />
            Elegir todo lo visible
          </label>
          <ul className="divide-y divide-[#fcf0f3]">
            {visibles.map((item: Pendiente) => (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                    elegidos.has(item.id) ? 'bg-[#fcf0f3]' : 'hover:bg-[#fdf8fa]'
                  }`}
                >
                  <Checkbox
                    checked={elegidos.has(item.id)}
                    onCheckedChange={() => alternar(item.id)}
                    className="mt-0.5 border-[#d4a7ca] data-[state=checked]:border-[#4a3540] data-[state=checked]:bg-[#4a3540]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[#4a3540]">{item.person}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-xs ${TIPO[item.kind]?.clase ?? ''}`}>
                        {TIPO[item.kind]?.texto ?? item.kind}
                      </span>
                      {item.priority === 'alta' && (
                        <span className="rounded-md bg-[#f8c9dc] px-1.5 py-0.5 text-xs text-[#9b1450]">Urgente</span>
                      )}
                    </div>
                    {item.label && item.label !== item.label.toUpperCase() && (
                      <div className="mt-1 text-sm text-[#6b4c57]">{mesesEnEspanol(item.label)}</div>
                    )}
                    {item.detail && (
                      <div className="mt-0.5 text-xs text-[#8b5a6b]">{mesesEnEspanol(item.detail)}</div>
                    )}
                  </div>
                  <span className="shrink-0 text-right text-xs text-[#8b5a6b] tabular-nums">
                    {(() => {
                      const dia = diaDePendiente(item.when);
                      return dia ? (
                        <>
                          {formatDiaISO(dia)}
                          <span className="block text-[11px]">{mesesEnEspanol(item.when)}</span>
                        </>
                      ) : (
                        mesesEnEspanol(item.when)
                      );
                    })()}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
