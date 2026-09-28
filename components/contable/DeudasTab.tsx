'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDiaISO } from '@/lib/utils';
import { contableService, type Deuda } from '@/services/contable.service';
import { useContable } from './contexto';
import DeudaCard from './DeudaCard';
import { Cargando, formatMonto, Panel, Vacio } from './ui';

const ESTADOS = [
  { id: 'abiertas', texto: 'Abiertas' },
  { id: 'vencidas', texto: 'Vencidas' },
  { id: 'saldadas', texto: 'Saldadas' },
  { id: 'todas', texto: 'Todas' },
] as const;

type Estado = (typeof ESTADOS)[number]['id'];

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Todas las deudas de la moneda elegida, filtradas por estado. */
export default function DeudasTab() {
  const { moneda, version } = useContable();
  const [lista, setLista] = useState<Deuda[] | null>(null);
  const [estado, setEstado] = useState<Estado>('abiertas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    contableService
      .deudas()
      .then(setLista)
      .catch(() => toast.error('No se pudieron cargar las deudas'));
  }, [version]);

  const deMoneda = useMemo(() => (lista ?? []).filter((d) => d.moneda === moneda), [lista, moneda]);
  const cuenta = useMemo(
    () => ({
      abiertas: deMoneda.filter((d) => d.saldo > 0).length,
      vencidas: deMoneda.filter((d) => d.vencida).length,
      saldadas: deMoneda.filter((d) => d.saldo <= 0).length,
      todas: deMoneda.length,
    }),
    [deMoneda],
  );

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return deMoneda
      .filter((d) =>
        estado === 'abiertas' ? d.saldo > 0 : estado === 'vencidas' ? d.vencida : estado === 'saldadas' ? d.saldo <= 0 : true,
      )
      .filter((d) => !q || normalizar(`${d.concepto} ${d.acreedor?.nombre ?? ''}`).includes(q))
      .sort((a, b) => {
        // Abiertas: primero lo vencido / lo que vence antes; el resto por fecha.
        if (estado !== 'saldadas' && a.saldo > 0 && b.saldo > 0) {
          const va = a.vencimiento ?? '9999';
          const vb = b.vencimiento ?? '9999';
          if (va !== vb) return va.localeCompare(vb);
        }
        return b.fecha.localeCompare(a.fecha);
      });
  }, [deMoneda, estado, busqueda]);

  const totalVisible = visibles.reduce((s, d) => s + d.saldo, 0);

  const exportar = () => {
    const filas = [
      ['Fecha', 'Acreedor', 'Concepto', 'Moneda', 'Monto', 'Pagado', 'Saldo', 'Vencimiento', 'Estado'],
      ...visibles.map((d) => [
        formatDiaISO(d.fecha),
        d.acreedor?.nombre ?? '',
        d.concepto,
        d.moneda,
        String(d.monto).replace('.', ','),
        String(d.pagado).replace('.', ','),
        String(d.saldo).replace('.', ','),
        formatDiaISO(d.vencimiento),
        d.vencida ? 'Vencida' : d.estado,
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `deudas-${estado}-${moneda}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!lista) return <Cargando alto="h-96" />;

  return (
    <Panel
      titulo="Deudas"
      subtitulo={
        estado === 'saldadas'
          ? `${visibles.length} saldadas`
          : `${visibles.length} · saldo ${formatMonto(totalVisible, moneda)}`
      }
      accion={
        <Button size="sm" variant="outline" onClick={exportar} disabled={!visibles.length}>
          <Download className="mr-1 h-3.5 w-3.5" /> CSV
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1">
          {ESTADOS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEstado(e.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                estado === e.id ? 'bg-[#8b5a6b] text-white' : 'bg-[#fbeef2] text-[#6b4c57] hover:bg-[#f6dfe7]',
                e.id === 'vencidas' && cuenta.vencidas > 0 && estado !== e.id && 'text-red-700',
              )}
            >
              {e.texto}
              <span className={cn('rounded-full px-1.5 text-[10px]', estado === e.id ? 'bg-white/20' : 'bg-white')}>{cuenta[e.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9a7d88]" />
          <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Concepto o acreedor" className="bg-white pl-9" />
        </div>
      </div>

      {visibles.length === 0 ? (
        <Vacio icono={<Wallet className="h-6 w-6" />} titulo="No hay deudas en esta vista" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibles.map((d) => (
            <DeudaCard key={d.id} deuda={d} mostrarAcreedor />
          ))}
        </div>
      )}
    </Panel>
  );
}
