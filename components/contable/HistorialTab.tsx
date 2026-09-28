'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  FilePlus2,
  FileX2,
  HandCoins,
  History,
  PencilLine,
  Trash2,
  UserPlus,
  UserX,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatDiaISO, formatFechaHora } from '@/lib/utils';
import { contableService, type Movimiento, type TipoMovimiento } from '@/services/contable.service';
import { useContable } from './contexto';
import { Cargando, formatMonto, haceCuanto, Panel, Vacio } from './ui';

const TIPOS: Record<TipoMovimiento, { Icono: LucideIcon; clase: string; grupo: 'deudas' | 'pagos' | 'acreedores' }> = {
  ACREEDOR_CREADO: { Icono: UserPlus, clase: 'bg-[#fbeef2] text-[#8b5a6b]', grupo: 'acreedores' },
  ACREEDOR_EDITADO: { Icono: PencilLine, clase: 'bg-[#fbeef2] text-[#8b5a6b]', grupo: 'acreedores' },
  ACREEDOR_ELIMINADO: { Icono: UserX, clase: 'bg-gray-100 text-gray-600', grupo: 'acreedores' },
  DEUDA_CREADA: { Icono: Wallet, clase: 'bg-[#fbe4ec] text-[#b84d74]', grupo: 'deudas' },
  DEUDA_EDITADA: { Icono: PencilLine, clase: 'bg-[#fbe4ec] text-[#b84d74]', grupo: 'deudas' },
  DEUDA_ELIMINADA: { Icono: Trash2, clase: 'bg-gray-100 text-gray-600', grupo: 'deudas' },
  PAGO_REGISTRADO: { Icono: HandCoins, clase: 'bg-blue-50 text-[#3565b8]', grupo: 'pagos' },
  PAGO_EDITADO: { Icono: PencilLine, clase: 'bg-blue-50 text-[#3565b8]', grupo: 'pagos' },
  PAGO_ELIMINADO: { Icono: Trash2, clase: 'bg-gray-100 text-gray-600', grupo: 'pagos' },
  COMPROBANTE_AGREGADO: { Icono: FilePlus2, clase: 'bg-blue-50 text-[#3565b8]', grupo: 'pagos' },
  COMPROBANTE_ELIMINADO: { Icono: FileX2, clase: 'bg-gray-100 text-gray-600', grupo: 'pagos' },
};

const CAMPOS: Record<string, string> = {
  monto: 'Monto',
  fecha: 'Fecha',
  vencimiento: 'Vencimiento',
  concepto: 'Concepto',
  moneda: 'Moneda',
  metodo: 'Método',
  nota: 'Nota',
  notas: 'Notas',
  nombre: 'Nombre',
  tipo: 'Tipo',
  documento: 'Documento',
  telefono: 'Teléfono',
  email: 'Email',
  acreedorId: 'Acreedor',
};

function valorLegible(campo: string, v: unknown, moneda: Movimiento['moneda']): string {
  if (v === null || v === undefined || v === '') return '—';
  if (campo === 'monto' && moneda) return formatMonto(Number(v), moneda);
  if ((campo === 'fecha' || campo === 'vencimiento') && typeof v === 'string') return formatDiaISO(v);
  if (campo === 'acreedorId') return 'otro acreedor';
  return String(v);
}

export function ItemHistorial({ m, compacto = false }: { m: Movimiento; compacto?: boolean }) {
  const { verAcreedor } = useContable();
  const t = TIPOS[m.tipo] ?? TIPOS.DEUDA_EDITADA;
  const eliminado = m.tipo.endsWith('ELIMINADO') || m.tipo.endsWith('ELIMINADA');
  const cambios =
    m.detalle && (m.tipo.endsWith('EDITADO') || m.tipo.endsWith('EDITADA'))
      ? Object.entries(m.detalle as Record<string, { antes: unknown; despues: unknown }>)
      : [];

  return (
    <li className={cn('group relative flex gap-3 rounded-xl px-2', compacto ? 'py-2' : 'py-3')}>
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', t.clase)}>
        <t.Icono className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={cn('text-sm text-[#3d2a32]', eliminado && 'text-[#6b4c57]')}>
            {m.acreedorId && !compacto ? (
              <button type="button" className="text-left hover:underline" onClick={() => verAcreedor(m.acreedorId!)}>
                {m.descripcion}
              </button>
            ) : (
              m.descripcion
            )}
          </p>
          {m.monto !== null && m.moneda && (
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                eliminado ? 'text-[#9a7d88] line-through' : t.grupo === 'pagos' ? 'text-[#3565b8]' : 'text-[#3d2a32]',
              )}
            >
              {t.grupo === 'pagos' && !eliminado ? '− ' : ''}
              {formatMonto(m.monto, m.moneda)}
            </span>
          )}
        </div>
        {cambios.length > 0 && !compacto && (
          <ul className="mt-1.5 space-y-0.5 rounded-lg bg-[#fdf6f8] px-3 py-2 text-xs">
            {cambios.map(([campo, c]) => (
              <li key={campo} className="text-[#6b4c57]">
                <span className="font-medium">{CAMPOS[campo] ?? campo}:</span>{' '}
                <span className="text-[#9a7d88] line-through">{valorLegible(campo, c?.antes, m.moneda)}</span>
                {' → '}
                <span className="text-[#3d2a32]">{valorLegible(campo, c?.despues, m.moneda)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-0.5 text-xs text-[#9a7d88]" title={formatFechaHora(m.createdAt)}>
          {m.usuarioNombre ?? 'Sistema'} · {compacto ? haceCuanto(m.createdAt) : formatFechaHora(m.createdAt)}
        </p>
      </div>
    </li>
  );
}

const FILTROS = [
  { id: 'todo', texto: 'Todo' },
  { id: 'deudas', texto: 'Deudas' },
  { id: 'pagos', texto: 'Pagos y comprobantes' },
  { id: 'acreedores', texto: 'Acreedores' },
] as const;

/** Registro completo e inmutable: incluye lo editado y lo borrado. */
export default function HistorialTab({ acreedorId }: { acreedorId?: string }) {
  const { version } = useContable();
  const [lista, setLista] = useState<Movimiento[] | null>(null);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('todo');

  useEffect(() => {
    contableService
      .historial({ acreedorId, limite: 500 })
      .then(setLista)
      .catch(() => toast.error('No se pudo cargar el historial'));
  }, [version, acreedorId]);

  // Agrupado por día para leerlo como un libro diario.
  const porDia = useMemo(() => {
    const grupos = new Map<string, Movimiento[]>();
    for (const m of lista ?? []) {
      if (filtro !== 'todo' && TIPOS[m.tipo]?.grupo !== filtro) continue;
      const dia = new Date(m.createdAt).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
      grupos.set(dia, [...(grupos.get(dia) ?? []), m]);
    }
    return [...grupos.entries()];
  }, [lista, filtro]);

  if (!lista) return <Cargando alto="h-96" />;

  return (
    <Panel
      titulo="Historial"
      subtitulo="Todo lo que se cargó, editó o borró, con quién y cuándo"
      accion={
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs',
                filtro === f.id ? 'bg-[#8b5a6b] text-white' : 'bg-[#fbeef2] text-[#6b4c57] hover:bg-[#f6dfe7]',
              )}
            >
              {f.texto}
            </button>
          ))}
        </div>
      }
    >
      {porDia.length ? (
        <div className="space-y-5">
          {porDia.map(([dia, items]) => (
            <div key={dia}>
              <p className="sticky top-0 z-[1] mb-1 bg-white/90 py-1 text-xs font-semibold tracking-wide text-[#8b5a6b] uppercase backdrop-blur">
                {formatDiaISO(dia)}
              </p>
              <ul className="border-l border-[#f0dde3] pl-2">
                {items.map((m) => (
                  <ItemHistorial key={m.id} m={m} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <Vacio icono={<History className="h-6 w-6" />} titulo="Sin movimientos" />
      )}
    </Panel>
  );
}
