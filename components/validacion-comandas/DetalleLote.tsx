'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, FileQuestion, RefreshCw, ShieldCheck, ShieldX, Sparkles, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatDiaISO } from '@/lib/utils';
import {
  mensajeError,
  validacionComandasService,
  type ComandaSistema,
  type LoteDetalle,
} from '@/services/validacionComandas.service';
import { Cargando, Panel } from '@/components/contable/ui';
import ImagenHoja from './ImagenHoja';
import HojaDialog from './HojaDialog';
import GemeloComanda from './GemeloComanda';
import { COSTO_HOJA_USD, esPendiente, Insignia, textoEstadoLote, usd, visualHoja } from './formato';

const FILTROS = [
  { id: 'todas', texto: 'Todas' },
  { id: 'pendientes', texto: 'Pendientes de aprobación' },
  { id: 'ok', texto: 'OK' },
  { id: 'aprobadas', texto: 'Aprobadas' },
  { id: 'conError', texto: 'Con error' },
  { id: 'sinLeer', texto: 'Sin leer' },
] as const;
type Filtro = (typeof FILTROS)[number]['id'];

const CAMPO_CORTO: Record<string, string> = {
  fecha: 'fecha',
  cliente: 'clienta',
  servicios: 'servicios',
  responsables: 'responsable',
  sena: 'seña',
  cobrado: 'cobrado',
  anulada: 'anulada',
};

/** Gemelo de una comanda cargada que no tiene hoja de papel en el lote. */
function GemeloSinPapel({ numero, onCerrar }: { numero: string | null; onCerrar: () => void }) {
  const [gemelo, setGemelo] = useState<ComandaSistema | null>(null);
  useEffect(() => {
    if (!numero) return;
    let vivo = true;
    setGemelo(null);
    validacionComandasService
      .gemelo(numero)
      .then((g) => vivo && setGemelo(g))
      .catch((e) => toast.error(mensajeError(e, 'No se pudo cargar la comanda')));
    return () => {
      vivo = false;
    };
  }, [numero]);
  return (
    <Dialog open={!!numero} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[94vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-[#3d2a32]">Comanda {numero} · sin papel</DialogTitle>
          <DialogDescription>Está cargada en el sistema con la fecha del lote, pero no aparece en ninguna hoja.</DialogDescription>
        </DialogHeader>
        {gemelo ? <GemeloComanda sistema={gemelo} /> : <Cargando alto="h-96" />}
      </DialogContent>
    </Dialog>
  );
}

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
  const [sinPapel, setSinPapel] = useState<string | null>(null);
  const [confirmarLectura, setConfirmarLectura] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const r = lote.resumen;
  const porLeer = r.sinLeer + r.errores;
  /** Las fotos ya leídas en otro lote reutilizan esa lectura: no se cobran. */
  const aCobrar = Math.max(0, porLeer - lote.reutilizables);
  const reutilizadas = lote.paginas.filter((h) => h.lecturaDeId).length;
  const leidas = r.ok + r.pendientesAprobacion + r.aprobadas + r.conError;

  const visibles = useMemo(
    () =>
      lote.paginas.filter((h) => {
        switch (filtro) {
          case 'pendientes':
            return esPendiente(h);
          case 'ok':
            return h.estado === 'LEIDA' && !h.revision && !esPendiente(h);
          case 'aprobadas':
            return h.revision === 'APROBADA';
          case 'conError':
            return h.revision === 'CON_ERROR';
          case 'sinLeer':
            return h.estado !== 'LEIDA';
          default:
            return true;
        }
      }),
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

  const hojaAbierta = abierta !== null ? (lote.paginas.find((h) => h.orden === abierta) ?? null) : null;

  return (
    <div className="space-y-5">
      <Panel
        titulo={
          <span className="flex flex-wrap items-center gap-2">
            Comandas del {formatDiaISO(lote.fecha)} <Insignia v={textoEstadoLote(lote)} />
          </span>
        }
        subtitulo={`${lote.nombreArchivo} · subido por ${lote.creadoPorNombre ?? '—'}${lote.costoUsd > 0 ? ` · costo IA ${usd(lote.costoUsd)}` : ''}${reutilizadas ? ` · ${reutilizadas} ${reutilizadas === 1 ? 'hoja reutilizada' : 'hojas reutilizadas'} sin costo` : ''}`}
        accion={
          <div className="flex flex-wrap justify-end gap-2">
            {porLeer > 0 && (
              <Button
                size="sm"
                className="bg-[#8b5a6b] text-white hover:bg-[#744a5a]"
                disabled={ocupado || lote.leyendo || (!lote.iaConfigurada && aCobrar > 0)}
                title={lote.iaConfigurada || aCobrar === 0 ? undefined : 'Falta ANTHROPIC_API_KEY en el servidor'}
                onClick={() => setConfirmarLectura(true)}
              >
                <Sparkles className="mr-1 h-4 w-4" /> Leer con IA ({porLeer})
              </Button>
            )}
            {leidas > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado || lote.leyendo}
                title="Vuelve a comparar contra el sistema (por si corregiste comandas). No usa IA. Si una comparación cambia, su revisión se borra."
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
              title="Borrar lote"
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { t: 'OK', n: r.ok, Icono: CheckCircle2, c: 'text-emerald-700 bg-emerald-50', f: 'ok' as Filtro },
            { t: 'Pendientes de aprobación', n: r.pendientesAprobacion, Icono: Clock, c: 'text-amber-800 bg-amber-50', f: 'pendientes' as Filtro },
            { t: 'Aprobadas', n: r.aprobadas, Icono: ShieldCheck, c: 'text-emerald-800 bg-emerald-100', f: 'aprobadas' as Filtro },
            { t: 'Con error', n: r.conError, Icono: ShieldX, c: 'text-red-700 bg-red-50', f: 'conError' as Filtro },
            { t: 'Cargadas sin papel', n: lote.faltantes.length, Icono: FileQuestion, c: 'text-[#8b5a6b] bg-[#fbeef2]', f: null },
          ].map((x) => (
            <button
              key={x.t}
              type="button"
              disabled={!x.f}
              onClick={() => x.f && setFiltro(x.f)}
              className={cn(
                'rounded-xl border bg-white p-3 text-left transition-colors enabled:hover:border-[#d9b8c4]',
                x.f && filtro === x.f ? 'border-[#8b5a6b]' : 'border-[#f0dde3]',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] leading-tight tracking-wide text-[#9a7d88] uppercase">{x.t}</p>
                <span className={cn('rounded-lg p-1', x.c)}>
                  <x.Icono className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#3d2a32] tabular-nums">{x.n}</p>
            </button>
          ))}
        </div>
        {leidas > 0 && r.pendientesAprobacion === 0 && porLeer === 0 && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            No queda nada pendiente de aprobación en este lote.
          </p>
        )}
      </Panel>

      <Panel
        titulo="Hojas"
        subtitulo="Tocá una hoja para ver el papel al lado de su gemelo digital y aprobarla."
        accion={
          <div className="flex flex-wrap justify-end gap-1">
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
                    esPendiente(h) ? 'border-amber-200' : h.revision === 'CON_ERROR' ? 'border-red-200' : 'border-[#f0dde3]',
                  )}
                >
                  <ImagenHoja paginaId={h.id} alt={`Hoja ${h.orden}`} className="aspect-[3/4] w-full border-b border-[#f7ecef]" />
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-xs font-semibold whitespace-nowrap text-[#3d2a32]">
                      {h.numeroComanda ?? `Hoja ${h.orden}`}
                      <span className="ml-1 font-normal text-[#9a7d88]">· hoja {h.orden}</span>
                    </p>
                    <Insignia v={v} />
                    <p className="truncate text-xs text-[#6b4c57]">{h.sistema?.cliente ?? h.lectura?.cliente ?? (h.estado === 'LEIDA' ? '—' : ' ')}</p>
                    {esPendiente(h) && h.diferencias && h.diferencias.length > 0 && (
                      <p className="truncate text-[11px] text-amber-800">{h.diferencias.map((d) => CAMPO_CORTO[d.campo]).join(' · ')}</p>
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
          subtitulo={`Comandas de ingreso del ${formatDiaISO(lote.fecha)} que no aparecen en ninguna hoja. Tocá una para ver su gemelo.`}
          cuerpoClassName="p-2"
        >
          <ul className="divide-y divide-[#f7ecef]">
            {lote.faltantes.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setSinPapel(f.numero)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fdf6f8]"
                >
                  <span className="font-medium text-[#3d2a32]">{f.numero}</span>
                  <span className="flex-1 truncate text-[#6b4c57]">{f.cliente ?? '—'}</span>
                  <span className="text-xs text-[#9a7d88]">{f.estado}</span>
                </button>
              </li>
            ))}
          </ul>
          {r.sinLeer > 0 && (
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
      <GemeloSinPapel numero={sinPapel} onCerrar={() => setSinPapel(null)} />

      <AlertDialog open={confirmarLectura} onOpenChange={setConfirmarLectura}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Leer {porLeer} {porLeer === 1 ? 'hoja' : 'hojas'} con IA?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {aCobrar > 0 ? `Costo aproximado ${usd(aCobrar * COSTO_HOJA_USD)}.` : 'Sin costo.'}
              {lote.reutilizables > 0 &&
                ` ${lote.reutilizables === 1 ? 'Una hoja ya se leyó' : `${lote.reutilizables} hojas ya se leyeron`} antes (misma foto): se reutiliza esa lectura sin pagar de nuevo.`}{' '}
              {aCobrar > 0 ? 'La IA lee cada hoja y se compara contra el sistema.' : 'Se compara cada hoja contra el sistema.'} No
              se modifica ninguna comanda.
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
            <AlertDialogDescription>
              Se borran las hojas, las lecturas y las revisiones de este lote. Las comandas del sistema no se tocan.
            </AlertDialogDescription>
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
