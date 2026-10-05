'use client';

import { CheckCircle2, CircleDashed, Clock, Loader2, ShieldCheck, ShieldX, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Hoja, LecturaComanda, Lote } from '@/services/validacionComandas.service';
import { formatMonto } from '@/components/contable/ui';

/** Costo aproximado por hoja con Sonnet 5.5 (medido en la prueba: ~US$ 0,02). */
export const COSTO_HOJA_USD = 0.02;

export const usd = (n: number) => `US$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function textoMonto(m: LecturaComanda['montos'][number]): string {
  const donde = { SENA: 'Seña', SALDO: 'Saldo', SENA_PROXIMO: 'Seña próximo', OTROS: 'Otros', OBSERVACIONES: 'Observaciones' }[m.donde];
  const partes = [donde + (m.etiquetaTachada ? ' (tachada)' : '')];
  if (m.metodo) partes.push(m.metodo);
  partes.push(m.monto != null ? formatMonto(m.monto, m.moneda ?? 'ARS') : '(sin monto)');
  return partes.join(' · ');
}

type Visual = { texto: string; clase: string; Icono: typeof CheckCircle2; girar?: boolean };

/** Hoja leída que espera la decisión de una persona. */
export const esPendiente = (h: Hoja) => h.estado === 'LEIDA' && !h.revision && (h.resultado !== 'OK' || h.repetida);

/** Cómo se muestra el estado de una hoja. */
export function visualHoja(h: Hoja): Visual {
  if (h.estado === 'PENDIENTE') return { texto: 'Sin leer', clase: 'bg-gray-100 text-gray-600', Icono: CircleDashed };
  if (h.estado === 'LEYENDO') return { texto: 'Leyendo…', clase: 'bg-sky-50 text-sky-800', Icono: Loader2, girar: true };
  if (h.estado === 'ERROR') return { texto: 'Error al leer', clase: 'bg-red-50 text-red-700', Icono: XCircle };
  if (h.revision === 'APROBADA') return { texto: 'Aprobada', clase: 'bg-emerald-600 text-white', Icono: ShieldCheck };
  if (h.revision === 'CON_ERROR') return { texto: 'Con error', clase: 'bg-red-600 text-white', Icono: ShieldX };
  if (esPendiente(h)) {
    return {
      texto: h.resultado === 'NO_ENCONTRADA' ? 'Pendiente · no está en el sistema' : 'Pendiente de aprobación',
      clase: 'bg-amber-50 text-amber-800',
      Icono: Clock,
    };
  }
  return { texto: 'OK', clase: 'bg-emerald-50 text-emerald-800', Icono: CheckCircle2 };
}

export function Insignia({ v, className }: { v: Visual; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', v.clase, className)}>
      <v.Icono className={cn('h-3 w-3', v.girar && 'animate-spin')} />
      {v.texto}
    </span>
  );
}

export function textoEstadoLote(l: Lote): Visual {
  const r = l.resumen;
  if (l.leyendo) {
    const hechas = r.total - r.sinLeer - r.leyendo;
    return { texto: `Leyendo ${hechas}/${r.total}`, clase: 'bg-sky-50 text-sky-800', Icono: Loader2, girar: true };
  }
  if (r.sinLeer === r.total) return { texto: 'Sin leer', clase: 'bg-gray-100 text-gray-600', Icono: CircleDashed };
  if (r.sinLeer > 0 || r.errores > 0) return { texto: 'Leído en parte', clase: 'bg-gray-100 text-gray-700', Icono: CircleDashed };
  if (r.pendientesAprobacion > 0) {
    return { texto: `${r.pendientesAprobacion} ${r.pendientesAprobacion === 1 ? 'pendiente' : 'pendientes'}`, clase: 'bg-amber-50 text-amber-800', Icono: Clock };
  }
  if (r.conError > 0) return { texto: `${r.conError} con error`, clase: 'bg-red-50 text-red-700', Icono: ShieldX };
  return { texto: 'Todo OK', clase: 'bg-emerald-50 text-emerald-800', Icono: CheckCircle2 };
}
