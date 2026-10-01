'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Lock, Paperclip, Pencil, PiggyBank, Repeat2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDiaISO } from '@/lib/utils';
import { contableService, mensajeError, type Adelanto } from '@/services/contable.service';
import { useContable } from './contexto';
import { ArchivoIcono, Confirmar } from './dialogos';
import { diasHasta, formatMonto, VentanaEdicion } from './ui';

/**
 * Un adelanto: cuánto se dio, cuánto queda a favor y en qué deudas ya se
 * descontó. Editar/borrar en 24 h (borrar sólo si no se descontó nada);
 * comprobantes, siempre.
 */
export default function AdelantoCard({ adelanto: a }: { adelanto: Adelanto }) {
  const { editarAdelanto, refrescar } = useContable();
  const [borrar, setBorrar] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pct = a.monto > 0 ? Math.min(100, (a.aplicado / a.monto) * 100) : 0;
  const liquidado = a.disponible <= 0;
  const dias = a.fechaEstimada ? diasHasta(a.fechaEstimada) : null;

  const eliminar = async () => {
    setBorrar(false);
    try {
      await contableService.eliminarAdelanto(a.id);
      toast.success('Adelanto borrado');
      refrescar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo borrar'));
    }
  };

  const adjuntar = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setSubiendo(true);
    try {
      await contableService.subirComprobantesAdelanto(a.id, Array.from(lista));
      toast.success('Comprobante adjuntado');
      refrescar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo adjuntar'));
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <article className={cn('rounded-2xl border bg-white p-4', liquidado ? 'border-[#f0dde3]' : 'border-teal-200')}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            liquidado ? 'bg-gray-100 text-gray-500' : 'bg-teal-50 text-teal-700',
          )}
        >
          <PiggyBank className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                liquidado ? 'bg-gray-100 text-gray-600' : 'bg-teal-50 text-teal-800',
              )}
            >
              {liquidado ? 'Descontado' : a.aplicado > 0 ? 'Descontado en parte' : 'A favor'}
            </span>
            {a.editable && <VentanaEdicion hasta={a.editableHasta} />}
            <span className="text-xs text-[#9a7d88]">
              {formatDiaISO(a.fecha)}
              {a.metodo && ` · ${a.metodo}`}
            </span>
          </div>
          <p className="mt-1.5 truncate font-medium text-[#3d2a32]">{a.concepto}</p>
          {a.fechaEstimada && !liquidado && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9a7d88]">
              <CalendarClock className="h-3 w-3" />
              Se liquida aprox. {formatDiaISO(a.fechaEstimada)}
              {dias !== null && (dias < 0 ? ` · hace ${-dias} d` : dias === 0 ? ' · hoy' : ` · en ${dias} d`)}
            </p>
          )}
          {a.nota && <p className="mt-0.5 text-sm text-[#6b4c57]">{a.nota}</p>}
        </div>
        <div className="text-right">
          <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">{liquidado ? 'Adelantado' : 'A favor'}</p>
          <p className={cn('text-lg font-semibold tabular-nums', liquidado ? 'text-[#9a7d88]' : 'text-teal-800')}>
            {formatMonto(liquidado ? a.monto : a.disponible, a.moneda)}
          </p>
          {!liquidado && a.aplicado > 0 && (
            <p className="text-xs text-[#9a7d88] tabular-nums">de {formatMonto(a.monto, a.moneda)}</p>
          )}
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-teal-50" aria-label="Porcentaje descontado">
        <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
      </div>

      {a.aplicaciones.length > 0 && (
        <ul className="mt-3 space-y-1">
          {a.aplicaciones.map((ap) => (
            <li key={ap.pagoId} className="flex items-center gap-2 text-xs text-[#6b4c57]">
              <Repeat2 className="h-3 w-3 shrink-0 text-teal-700" />
              <span className="truncate">
                {formatMonto(ap.monto, a.moneda)} descontados de “{ap.deudaConcepto ?? 'deuda'}” el {formatDiaISO(ap.fecha)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {a.comprobantes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {a.comprobantes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => contableService.abrirComprobante(c).catch((e) => toast.error(mensajeError(e)))}
              className="inline-flex max-w-[200px] items-center gap-1 rounded-md bg-[#fbeef2] px-2 py-0.5 text-xs text-[#5b2139] hover:bg-[#f6dfe7]"
            >
              <ArchivoIcono mime={c.mimeType} className="h-3 w-3 shrink-0" />
              <span className="truncate">{c.nombre}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f7ecef] pt-2">
        <span className="text-[11px] text-[#9a7d88]">
          Cargó {a.creadoPorNombre ?? '—'}
          {!a.editable && (
            <span className="ml-1 inline-flex items-center gap-0.5" title="Pasaron 24 h: monto fijo">
              <Lock className="h-3 w-3" />
            </span>
          )}
        </span>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#6b4c57]"
            title="Adjuntar comprobante"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6b4c57]" title="Editar" onClick={() => editarAdelanto(a)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {a.editable && a.aplicaciones.length === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#6b4c57] hover:text-red-600"
              title="Borrar adelanto"
              onClick={() => setBorrar(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        className="hidden"
        onChange={(e) => {
          adjuntar(e.target.files);
          e.target.value = '';
        }}
      />
      <Confirmar
        abierto={borrar}
        titulo="¿Borrar el adelanto?"
        texto={`Se borra el adelanto de ${formatMonto(a.monto, a.moneda)}. Queda registrado en el historial.`}
        onConfirmar={eliminar}
        onCerrar={() => setBorrar(false)}
      />
    </article>
  );
}
