'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowUpDown, Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { contableService, type AcreedorResumen } from '@/services/contable.service';
import { useContable } from './contexto';
import { BarraAvance, Cargando, formatMonto, haceCuanto, IconoAcreedor, Panel, Vacio } from './ui';

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Orden = 'saldo' | 'nombre' | 'reciente';

export default function AcreedoresTab() {
  const { moneda, version, verAcreedor, nuevoAcreedor } = useContable();
  const [lista, setLista] = useState<AcreedorResumen[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<Orden>('saldo');
  const [soloConSaldo, setSoloConSaldo] = useState(false);

  useEffect(() => {
    contableService
      .acreedores()
      .then(setLista)
      .catch(() => toast.error('No se pudieron cargar los acreedores'));
  }, [version]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const otra = moneda === 'ARS' ? 'USD' : 'ARS';
    return (lista ?? [])
      .filter((a) => !q || normalizar(a.nombre).includes(q) || normalizar(a.documento ?? '').includes(q))
      .filter((a) => !soloConSaldo || a.totales.ARS.saldo > 0 || a.totales.USD.saldo > 0)
      .sort((a, b) => {
        if (orden === 'nombre') return a.nombre.localeCompare(b.nombre);
        if (orden === 'reciente') return b.ultimoMovimiento.localeCompare(a.ultimoMovimiento);
        return b.totales[moneda].saldo - a.totales[moneda].saldo || b.totales[otra].saldo - a.totales[otra].saldo;
      });
  }, [lista, busqueda, orden, soloConSaldo, moneda]);

  if (!lista) return <Cargando alto="h-96" />;

  return (
    <Panel
      titulo="Acreedores"
      subtitulo={`${lista.length} ${lista.length === 1 ? 'persona o empresa' : 'personas y empresas'}`}
      accion={
        <Button size="sm" className="bg-[#8b5a6b] text-white hover:bg-[#744a5a]" onClick={() => nuevoAcreedor()}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9a7d88]" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o CUIT"
            className="bg-white pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoloConSaldo((v) => !v)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs',
              soloConSaldo ? 'border-[#8b5a6b] bg-[#fbeef2] text-[#5b2139]' : 'border-[#f0dde3] text-[#6b4c57]',
            )}
          >
            Sólo con saldo
          </button>
          <label className="flex items-center gap-1 text-xs text-[#6b4c57]">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="rounded-md border border-[#f0dde3] bg-white px-2 py-1.5 text-xs"
              aria-label="Ordenar"
            >
              <option value="saldo">Mayor saldo</option>
              <option value="reciente">Último movimiento</option>
              <option value="nombre">Nombre</option>
            </select>
          </label>
        </div>
      </div>

      {visibles.length === 0 ? (
        <Vacio
          icono={<Users className="h-6 w-6" />}
          titulo={lista.length ? 'Nadie coincide con la búsqueda' : 'Todavía no hay acreedores'}
          texto={lista.length ? undefined : 'Agregá a las personas o empresas a las que el negocio les debe.'}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((a) => {
            const t = a.totales[moneda];
            const otra = moneda === 'ARS' ? 'USD' : 'ARS';
            const tOtra = a.totales[otra];
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => verAcreedor(a.id)}
                className="group flex flex-col rounded-2xl border border-[#f0dde3] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#e2c3cf] hover:shadow-[0_10px_28px_-16px_rgba(139,90,107,0.45)] focus-visible:ring-2 focus-visible:ring-[#d4a7ca] focus-visible:outline-none"
              >
                <div className="flex items-start gap-3">
                  <IconoAcreedor tipo={a.tipo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#3d2a32] group-hover:text-[#8b5a6b]">{a.nombre}</p>
                    <p className="truncate text-xs text-[#9a7d88]">
                      {a.documento ?? (a.tipo === 'EMPRESA' ? 'Empresa' : 'Persona')} · {haceCuanto(a.ultimoMovimiento)}
                    </p>
                  </div>
                  {a.deudasVencidas > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" /> {a.deudasVencidas} vencida{a.deudasVencidas > 1 && 's'}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">Se le debe</p>
                    <p className={cn('text-xl font-semibold tabular-nums', t.saldo > 0 ? 'text-[#3d2a32]' : 'text-[#c5aab4]')}>
                      {formatMonto(t.saldo, moneda)}
                    </p>
                    {tOtra.saldo > 0 && (
                      <p className="text-xs text-[#6b4c57] tabular-nums">+ {formatMonto(tOtra.saldo, otra)}</p>
                    )}
                  </div>
                  <p className="text-right text-xs text-[#9a7d88]">
                    {a.deudasAbiertas} abierta{a.deudasAbiertas !== 1 && 's'}
                    <br />
                    {a.cantidadDeudas} en total
                  </p>
                </div>
                {t.deuda > 0 && (
                  <div className="mt-3">
                    <BarraAvance pagado={t.pagado} total={t.deuda} />
                    <p className="mt-1 text-[11px] text-[#9a7d88]">
                      {Math.round((t.pagado / t.deuda) * 100)}% pagado de {formatMonto(t.deuda, moneda)}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
