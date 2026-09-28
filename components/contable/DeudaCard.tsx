'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, ChevronDown, HandCoins, Lock, MoreHorizontal, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDiaISO } from '@/lib/utils';
import { contableService, mensajeError, type Deuda, type Pago } from '@/services/contable.service';
import { useContable } from './contexto';
import { ArchivoIcono, Confirmar } from './dialogos';
import { BarraAvance, diasHasta, EstadoBadge, formatMonto, VentanaEdicion } from './ui';

type Borrado = { tipo: 'deuda' } | { tipo: 'pago'; pago: Pago } | null;

/**
 * Una deuda con su avance y sus pagos. Editar/borrar pagos sólo en las
 * primeras 24 h (el backend lo vuelve a controlar); adjuntar comprobantes,
 * siempre.
 */
export default function DeudaCard({
  deuda,
  mostrarAcreedor = false,
  abiertaInicial = false,
}: {
  deuda: Deuda;
  mostrarAcreedor?: boolean;
  abiertaInicial?: boolean;
}) {
  const { pagar, editarDeuda, editarPago, refrescar, verAcreedor } = useContable();
  const [abierta, setAbierta] = useState(abiertaInicial);
  const [borrar, setBorrar] = useState<Borrado>(null);
  const [subiendoA, setSubiendoA] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pagoParaAdjuntar = useRef<string | null>(null);

  const confirmarBorrado = async () => {
    const b = borrar;
    setBorrar(null);
    if (!b) return;
    try {
      if (b.tipo === 'deuda') await contableService.eliminarDeuda(deuda.id);
      else await contableService.eliminarPago(b.pago.id);
      toast.success(b.tipo === 'deuda' ? 'Deuda borrada' : 'Pago borrado: el monto vuelve al saldo');
      refrescar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo borrar'));
    }
  };

  const adjuntar = async (lista: FileList | null) => {
    const pagoId = pagoParaAdjuntar.current;
    if (!lista?.length || !pagoId) return;
    setSubiendoA(pagoId);
    try {
      await contableService.subirComprobantes(pagoId, Array.from(lista));
      toast.success('Comprobante adjuntado');
      refrescar();
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo adjuntar'));
    } finally {
      setSubiendoA(null);
    }
  };

  const dias = deuda.vencimiento ? diasHasta(deuda.vencimiento) : null;

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white transition-shadow',
        deuda.vencida ? 'border-red-200' : 'border-[#f0dde3]',
        abierta && 'shadow-[0_8px_24px_-14px_rgba(139,90,107,0.35)]',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => setAbierta((a) => !a)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={abierta}
        >
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge deuda={deuda} />
            {deuda.editable && <VentanaEdicion hasta={deuda.editableHasta} />}
            <span className="text-xs text-[#9a7d88]">{formatDiaISO(deuda.fecha)}</span>
          </div>
          <p className="mt-1.5 truncate font-medium text-[#3d2a32]">{deuda.concepto}</p>
          {mostrarAcreedor && deuda.acreedor && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                verAcreedor(deuda.acreedorId);
              }}
              onKeyDown={(e) => e.key === 'Enter' && verAcreedor(deuda.acreedorId)}
              className="text-sm text-[#8b5a6b] hover:underline"
            >
              {deuda.acreedor.nombre}
            </span>
          )}
          {deuda.vencimiento && deuda.saldo > 0 && (
            <p className={cn('mt-0.5 flex items-center gap-1 text-xs', deuda.vencida ? 'font-medium text-red-700' : 'text-[#9a7d88]')}>
              <CalendarClock className="h-3 w-3" />
              Vence {formatDiaISO(deuda.vencimiento)}
              {dias !== null && (dias < 0 ? ` · hace ${-dias} d` : dias <= 7 ? ` · en ${dias} d` : '')}
            </p>
          )}
        </button>

        <div className="text-right">
          <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">{deuda.saldo > 0 ? 'Saldo' : 'Total'}</p>
          <p className="text-lg font-semibold text-[#3d2a32] tabular-nums">
            {formatMonto(deuda.saldo > 0 ? deuda.saldo : deuda.monto, deuda.moneda)}
          </p>
          {deuda.saldo > 0 && deuda.pagado > 0 && (
            <p className="text-xs text-[#9a7d88] tabular-nums">de {formatMonto(deuda.monto, deuda.moneda)}</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {deuda.saldo > 0 && (
            <Button size="sm" className="h-8 bg-[#8b5a6b] px-3 text-white hover:bg-[#744a5a]" onClick={() => pagar(deuda)}>
              <HandCoins className="mr-1 h-3.5 w-3.5" /> Pagar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6b4c57]" aria-label="Más acciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={() => editarDeuda(deuda)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!deuda.editable || deuda.pagos.length > 0}
                className="text-red-600"
                onClick={() => setBorrar({ tipo: 'deuda' })}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Borrar
              </DropdownMenuItem>
              {(!deuda.editable || deuda.pagos.length > 0) && (
                <p className="max-w-[220px] px-2 pb-1.5 text-[11px] text-[#9a7d88]">
                  {!deuda.editable ? 'Sólo se borra en las primeras 24 h.' : 'Tiene pagos: borrá primero los pagos.'}
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 pb-3">
        <BarraAvance pagado={deuda.pagado} total={deuda.monto} />
        <button
          type="button"
          onClick={() => setAbierta((a) => !a)}
          className="mt-2 flex w-full items-center justify-between text-xs text-[#6b4c57] hover:text-[#3d2a32]"
        >
          <span>
            {deuda.pagos.length === 0
              ? 'Sin pagos todavía'
              : `${deuda.pagos.length} ${deuda.pagos.length === 1 ? 'pago' : 'pagos'} · ${formatMonto(deuda.pagado, deuda.moneda)} pagado`}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', abierta && 'rotate-180')} />
        </button>
      </div>

      {abierta && (
        <div className="border-t border-[#f7ecef] bg-[#fefbfc] px-4 py-3">
          {deuda.notas && <p className="mb-3 rounded-lg bg-white px-3 py-2 text-sm text-[#6b4c57]">{deuda.notas}</p>}
          {deuda.pagos.length === 0 ? (
            <p className="py-2 text-sm text-[#9a7d88]">Todavía no se registraron pagos.</p>
          ) : (
            <ol className="space-y-2">
              {deuda.pagos.map((p) => (
                <li key={p.id} className="rounded-xl border border-[#f4e6ea] bg-white px-3 py-2.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#3565b8]">
                      <HandCoins className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-[#3d2a32] tabular-nums">{formatMonto(p.monto, deuda.moneda)}</span>
                        <span className="text-xs text-[#9a7d88]">
                          {formatDiaISO(p.fecha)}
                          {p.metodo && ` · ${p.metodo}`}
                        </span>
                        {p.editable ? (
                          <VentanaEdicion hasta={p.editableHasta} />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#9a7d88]" title="Pasaron 24 h: queda fijo">
                            <Lock className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      {p.nota && <p className="mt-0.5 text-sm text-[#6b4c57]">{p.nota}</p>}
                      {p.comprobantes.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {p.comprobantes.map((c) => (
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
                      <p className="mt-1 text-[11px] text-[#9a7d88]">Cargó {p.creadoPorNombre ?? '—'}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#6b4c57]"
                        title="Adjuntar comprobante"
                        disabled={subiendoA === p.id}
                        onClick={() => {
                          pagoParaAdjuntar.current = p.id;
                          inputRef.current?.click();
                        }}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </Button>
                      {p.editable && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#6b4c57]" title="Editar pago" onClick={() => editarPago(p, deuda)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#6b4c57] hover:text-red-600"
                            title="Borrar pago"
                            onClick={() => setBorrar({ tipo: 'pago', pago: p })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-[11px] text-[#9a7d88]">
            Cargada por {deuda.creadoPorNombre ?? '—'} · los pagos se pueden editar o borrar durante 24 h.
          </p>
        </div>
      )}

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
        abierto={!!borrar}
        titulo={borrar?.tipo === 'deuda' ? '¿Borrar la deuda?' : '¿Borrar el pago?'}
        texto={
          borrar?.tipo === 'pago'
            ? `Se borra el pago de ${formatMonto(borrar.pago.monto, deuda.moneda)} y el monto vuelve al saldo. Queda registrado en el historial.`
            : `Se borra "${deuda.concepto}". Queda registrado en el historial.`
        }
        onConfirmar={confirmarBorrado}
        onCerrar={() => setBorrar(null)}
      />
    </article>
  );
}
