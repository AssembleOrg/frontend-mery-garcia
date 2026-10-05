'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileQuestion, HelpCircle, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, formatDiaISO } from '@/lib/utils';
import { mensajeError, validacionComandasService, type Hoja, type LoteDetalle } from '@/services/validacionComandas.service';
import { Panel } from '@/components/contable/ui';
import ImagenHoja from './ImagenHoja';
import HojaDialog from './HojaDialog';
import { COSTO_HOJA_USD, Insignia, textoEstadoLote, usd, visualHoja } from './formato';

const FILTROS = [
  { id: 'todas', texto: 'Todas' },
  { id: 'revisar', texto: 'Revisar' },
  { id: 'ok', texto: 'Coinciden' },
  { id: 'sinLeer', texto: 'Sin leer / error' },
] as const;
type Filtro = (typeof FILTROS)[number]['id'];

const esRevisar = (h: Hoja) => h.estado === 'LEIDA' && (h.resultado !== 'OK' || h.repetida);

export default function DetalleLote({
  lote,
  onActualizado,
  onEliminado,
}: {
  lote: LoteDetalle;
  onActualizado: (l: LoteDetalle) => void;
  onEliminado: () => void;
}) {
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [abierta, setAbierta] = useState<number | null>(null);
  const [confirmarLectura, setConfirmarLectura] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const r = lote.resumen;
  const porLeer = r.pendientes + r.errores;

  const visibles = useMemo(
    () =>
      lote.paginas.filter((h) =>
        filtro === 'revisar'
          ? esRevisar(h)
          : filtro === 'ok'
            ? h.estado === 'LEIDA' && h.resultado === 'OK' && !h.repetida
            : filtro === 'sinLeer'
              ? h.estado !== 'LEIDA'
              : true,
      ),
    [lote.paginas, filtro],
  );

  const accion = async (f: () => Promise<LoteDetalle | void>, ok: string) => {
    setOcupado(true);
    try {
      const l = await f();
      if (l) onActualizado(l);
      toast.success(ok);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const hojaAbierta = abierta !== null ? lote.paginas.find((h) => h.orden === abierta) ?? null : null;

  return (
    <div className="space-y-5">
      <Panel
        titulo={
          <span className="flex flex-wrap items-center gap-2">
            Comandas del {formatDiaISO(lote.fecha)} <Insignia v={textoEstadoLote(lote)} />
          </span>
        }
        subtitulo={`${lote.nombreArchivo} · subido por ${lote.creadoPorNombre ?? '—'}${lote.costoUsd > 0 ? ` · costo IA ${usd(lote.costoUsd)}` : ''}`}
        accion={
          <div className="flex flex-wrap justify-end gap-2">
            {porLeer > 0 && (
              <Button
                size="sm"
                className="bg-[#8b5a6b] text-white hover:bg-[#744a5a]"
                disabled={ocupado || lote.leyendo || !lote.iaConfigurada}
                title={lote.iaConfigurada ? undefined : 'Falta ANTHROPIC_API_KEY en el servidor'}
                onClick={() => setConfirmarLectura(true)}
              >
                <Sparkles className="mr-1 h-4 w-4" /> Leer con IA ({porLeer})
              </Button>
            )}
            {r.ok + r.revisar + r.noEncontradas > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado || lote.leyendo}
                title="Vuelve a comparar lo ya leído contra el sistema (por si corregiste comandas). No usa IA."
                onClick={() => accion(() => validacionComandasService.recomparar(lote.id), 'Comparación actualizada')}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Volver a comparar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              disabled={ocupado || lote.leyendo}
              onClick={() => setConfirmarBorrado(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      >
        {!lote.iaConfigurada && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            La lectura con IA no está configurada en el servidor (falta ANTHROPIC_API_KEY).
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { t: 'Coinciden', n: r.ok, Icono: CheckCircle2, c: 'text-emerald-700 bg-emerald-50' },
            { t: 'Revisar', n: r.revisar, Icono: AlertTriangle, c: 'text-amber-800 bg-amber-50' },
            { t: 'No están en el sistema', n: r.noEncontradas, Icono: HelpCircle, c: 'text-red-700 bg-red-50' },
            { t: 'Cargadas sin papel', n: lote.faltantes.length, Icono: FileQuestion, c: 'text-[#8b5a6b] bg-[#fbeef2]' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-[#f0dde3] bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">{x.t}</p>
                <span className={cn('rounded-lg p-1', x.c)}>
                  <x.Icono className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#3d2a32] tabular-nums">{x.n}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        titulo="Hojas"
        subtitulo="Tocá una hoja para ver el papel al lado del sistema."
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
        {visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#9a7d88]">No hay hojas en esta vista.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibles.map((h) => {
              const v = visualHoja(h);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setAbierta(h.orden)}
                  className={cn(
                    'group overflow-hidden rounded-xl border bg-white text-left transition-shadow hover:shadow-[0_8px_24px_-14px_rgba(139,90,107,0.45)]',
                    esRevisar(h) ? 'border-amber-200' : 'border-[#f0dde3]',
                  )}
                >
                  <ImagenHoja paginaId={h.id} alt={`Hoja ${h.orden}`} className="aspect-[3/4] w-full border-b border-[#f7ecef]" />
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-xs font-semibold whitespace-nowrap text-[#3d2a32]">
                      {h.numeroComanda ?? `Hoja ${h.orden}`}
                      <span className="ml-1 font-normal text-[#9a7d88]">· hoja {h.orden}</span>
                    </p>
                    <Insignia v={v} />
                    <p className="truncate text-xs text-[#6b4c57]">{h.lectura?.cliente ?? (h.estado === 'LEIDA' ? '—' : ' ')}</p>
                    {h.diferencias && h.diferencias.length > 0 && (
                      <p className="truncate text-[11px] text-amber-800">
                        {h.diferencias.map((d) => ({ fecha: 'fecha', cliente: 'clienta', servicios: 'servicios', responsables: 'responsable', sena: 'seña', cobrado: 'cobrado', anulada: 'anulada' })[d.campo]).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Panel>

      {lote.faltantes.length > 0 && (
        <Panel
          titulo="Cargadas en el sistema sin papel"
          subtitulo={`Comandas de ingreso del ${formatDiaISO(lote.fecha)} que no aparecen en ninguna hoja del lote.`}
          cuerpoClassName="p-2"
        >
          <ul className="divide-y divide-[#f7ecef]">
            {lote.faltantes.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium text-[#3d2a32]">{f.numero}</span>
                <span className="flex-1 truncate text-[#6b4c57]">{f.cliente ?? '—'}</span>
                <span className="text-xs text-[#9a7d88]">{f.estado}</span>
              </li>
            ))}
          </ul>
          {r.pendientes > 0 && (
            <p className="px-3 pb-2 text-xs text-[#9a7d88]">Hasta leer todas las hojas, esta lista incluye las que todavía no se leyeron.</p>
          )}
        </Panel>
      )}

      <HojaDialog
        lote={lote}
        hoja={hojaAbierta}
        onCerrar={() => setAbierta(null)}
        onMover={(d) => setAbierta((o) => (o === null ? o : Math.min(lote.totalPaginas, Math.max(1, o + d))))}
        onActualizado={onActualizado}
      />

      <AlertDialog open={confirmarLectura} onOpenChange={setConfirmarLectura}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Leer {porLeer} {porLeer === 1 ? 'hoja' : 'hojas'} con IA?</AlertDialogTitle>
            <AlertDialogDescription>
              Costo aproximado {usd(porLeer * COSTO_HOJA_USD)}. La IA lee cada hoja y se compara contra el sistema. No se
              modifica ninguna comanda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#8b5a6b] text-white hover:bg-[#744a5a]"
              onClick={() => accion(() => validacionComandasService.leer(lote.id), 'Lectura iniciada')}
            >
              Leer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarBorrado} onOpenChange={setConfirmarBorrado}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar el lote?</AlertDialogTitle>
            <AlertDialogDescription>Se borran las hojas y las lecturas de este lote. Las comandas del sistema no se tocan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() =>
                accion(async () => {
                  await validacionComandasService.eliminar(lote.id);
                  onEliminado();
                }, 'Lote borrado')
              }
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
