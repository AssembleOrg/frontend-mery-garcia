'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ExternalLink, RotateCw, Search, ShieldCheck, ShieldX, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatDiaISO, formatFechaHora } from '@/lib/utils';
import {
  mensajeError,
  validacionComandasService,
  type ComandaSistema,
  type Hoja,
  type LoteDetalle,
} from '@/services/validacionComandas.service';
import ImagenHoja from './ImagenHoja';
import GemeloComanda, { resaltadosDe } from './GemeloComanda';
import { COSTO_HOJA_USD, esPendiente, Insignia, textoMonto, usd, visualHoja } from './formato';

const CAMPO: Record<string, string> = {
  fecha: 'Fecha',
  cliente: 'Clienta',
  servicios: 'Servicios',
  responsables: 'Responsables',
  sena: 'Seña usada',
  cobrado: 'Cobrado',
  anulada: 'Anulada',
};

/** Busca a mano el gemelo de otro número (por si la IA leyó mal el número de la hoja). */
function BuscarGemelo({ inicial }: { inicial: string | null }) {
  const [numero, setNumero] = useState((inicial ?? '').replace(/^01-/, ''));
  const [gemelo, setGemelo] = useState<ComandaSistema | null>(null);
  const [buscando, setBuscando] = useState(false);
  const buscar = async () => {
    const n = numero.replace(/\D/g, '');
    if (!n) return;
    setBuscando(true);
    try {
      setGemelo(await validacionComandasService.gemelo(`01-${parseInt(n, 10)}`));
    } catch (e) {
      setGemelo(null);
      toast.error(mensajeError(e, 'No se encontró'));
    } finally {
      setBuscando(false);
    }
  };
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
        La IA leyó el N° {inicial ?? '(ilegible)'} y no hay ninguna comanda de ingreso con ese número en el sistema. Puede
        faltar cargarla, o el número se leyó mal: buscá el número que ves en la foto.
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[#9a7d88]">01-</span>
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} inputMode="numeric" className="bg-white pl-9" placeholder="11089" />
        </div>
        <Button type="submit" variant="outline" disabled={buscando}>
          <Search className="mr-1 h-4 w-4" /> Ver gemelo
        </Button>
      </form>
      {gemelo && <GemeloComanda sistema={gemelo} />}
    </div>
  );
}

/** Detalle de una hoja: el papel al lado de su gemelo digital, y la decisión humana. */
export default function HojaDialog({
  lote,
  hoja,
  onCerrar,
  onMover,
  onActualizado,
}: {
  lote: LoteDetalle;
  hoja: Hoja | null;
  onCerrar: () => void;
  onMover: (delta: number) => void;
  onActualizado: (l: LoteDetalle) => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [marcandoError, setMarcandoError] = useState(false);
  const [nota, setNota] = useState('');

  useEffect(() => {
    setMarcandoError(false);
    setNota('');
  }, [hoja?.id]);

  if (!hoja) return null;
  const L = hoja.lectura;
  const S = hoja.sistema;
  const v = visualHoja(hoja);
  const pendiente = esPendiente(hoja);

  const ejecutar = async (f: () => Promise<LoteDetalle>, ok: string) => {
    setOcupado(true);
    try {
      onActualizado(await f());
      toast.success(ok);
      setMarcandoError(false);
      setNota('');
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const veredicto =
    hoja.revision === 'APROBADA'
      ? { texto: 'Aprobada por una persona', clase: 'border-emerald-300 bg-emerald-50 text-emerald-900' }
      : hoja.revision === 'CON_ERROR'
        ? { texto: 'Marcada con error: hay que corregir la comanda en el sistema', clase: 'border-red-300 bg-red-50 text-red-900' }
        : pendiente
          ? {
              texto:
                hoja.resultado === 'NO_ENCONTRADA'
                  ? 'Pendiente de aprobación: el número no está en el sistema'
                  : `Pendiente de aprobación: la IA ve diferencias en ${(hoja.diferencias ?? []).map((d) => CAMPO[d.campo].toLowerCase()).join(', ')}${hoja.repetida ? ' (y el número se repite en otra hoja)' : ''}`,
              clase: 'border-amber-300 bg-amber-50 text-amber-900',
            }
          : hoja.estado === 'LEIDA'
            ? { texto: 'OK: el papel coincide con el sistema', clase: 'border-emerald-200 bg-emerald-50/70 text-emerald-900' }
            : null;

  return (
    <Dialog open={!!hoja} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[96vh] grid-cols-[minmax(0,1fr)] overflow-y-auto pb-24 sm:max-w-[min(96vw,1320px)] sm:pb-6">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-[#3d2a32]">
            Hoja {hoja.orden} de {lote.totalPaginas}
            {hoja.numeroComanda && <span className="text-[#8b5a6b]">· {hoja.numeroComanda}</span>}
            <Insignia v={v} />
          </DialogTitle>
          <DialogDescription>
            Lote del {formatDiaISO(lote.fecha)}. El papel escaneado junto a su gemelo digital: la comanda tal como está
            cargada en el sistema.
          </DialogDescription>
        </DialogHeader>

        {veredicto && <div className={cn('rounded-xl border px-4 py-2.5 text-sm font-medium', veredicto.clase)}>{veredicto.texto}</div>}

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-[#6b4c57] uppercase">Papel escaneado</h3>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-[#6b4c57] hover:underline"
                onClick={() => validacionComandasService.imagenUrl(hoja.id).then((u) => window.open(u, '_blank'))}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Ver en grande
              </button>
            </div>
            <ImagenHoja paginaId={hoja.id} alt={`Hoja ${hoja.orden}`} className="max-h-[78vh] w-full rounded-md border border-[#e6cfd7]" />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wide text-[#6b4c57] uppercase">Gemelo digital · comanda en el sistema</h3>
            {hoja.estado === 'PENDIENTE' && <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">Esta hoja todavía no se leyó.</p>}
            {hoja.estado === 'ERROR' && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">No se pudo leer: {hoja.error}</p>}
            {hoja.estado === 'LEIDA' && S && <GemeloComanda sistema={S} resaltar={resaltadosDe(hoja)} />}
            {hoja.estado === 'LEIDA' && !S && <BuscarGemelo inicial={hoja.numeroComanda} />}
          </section>
        </div>

        {L && (
          <details className="rounded-xl border border-[#f0dde3] bg-white px-4 py-3 text-sm" open={pendiente}>
            <summary className="cursor-pointer font-medium text-[#3d2a32]">Lo que leyó la IA en el papel</summary>
            <div className="mt-3 space-y-3">
              {(hoja.diferencias ?? []).length > 0 && (
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] tracking-wide text-[#9a7d88] uppercase">
                    <tr>
                      <th className="py-1 pr-3 font-medium">Dato</th>
                      <th className="py-1 pr-3 font-medium">Papel (IA)</th>
                      <th className="py-1 font-medium">Sistema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f7ecef] align-top">
                    {(hoja.diferencias ?? []).map((d) => (
                      <tr key={d.campo}>
                        <td className="py-1.5 pr-3 font-medium whitespace-nowrap text-amber-800">{CAMPO[d.campo]}</td>
                        <td className="py-1.5 pr-3 text-[#3d2a32] [overflow-wrap:anywhere]">{d.papel}</td>
                        <td className="py-1.5 text-[#3d2a32] [overflow-wrap:anywhere]">{d.sistema}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="grid gap-3 text-[13px] text-[#6b4c57] sm:grid-cols-2">
                <div>
                  <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">Servicios marcados</p>
                  {L.servicios.length ? (
                    <ul>
                      {L.servicios.map((s, i) => (
                        <li key={i}>
                          {s.fila}
                          {s.responsable ? ` — ${s.responsable}` : ''}
                          {s.anotacion ? ` ("${s.anotacion}")` : ''}
                        </li>
                      ))}
                      {L.otros.map((o, i) => (
                        <li key={`o${i}`}>Otros: {o}</li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </div>
                <div>
                  <p className="text-[11px] tracking-wide text-[#9a7d88] uppercase">Montos</p>
                  {L.montos.length ? (
                    <ul>
                      {L.montos.map((m, i) => (
                        <li key={i}>{textoMonto(m)}</li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              {L.dudas.length > 0 && (
                <div className="rounded-lg bg-sky-50/70 px-3 py-2 text-xs text-sky-900">
                  <p className="mb-1 font-medium">Lo que la IA no leyó con seguridad:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {L.dudas.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Decisión humana */}
        <div className="flex flex-col gap-3 border-t border-[#f7ecef] pt-3">
          {hoja.revision ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-[#3d2a32]">
                {hoja.revision === 'APROBADA' ? 'Aprobada' : 'Marcada con error'} por <b>{hoja.revisadoPorNombre ?? '—'}</b>
                {hoja.revisadoAt && ` el ${formatFechaHora(hoja.revisadoAt)}`}
                {hoja.revisionNota && <span className="block text-[#6b4c57]">“{hoja.revisionNota}”</span>}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={ocupado}
                onClick={() => ejecutar(() => validacionComandasService.deshacerRevision(hoja.id), 'Revisión deshecha')}
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" /> Deshacer
              </Button>
            </div>
          ) : (
            hoja.estado === 'LEIDA' && (
              <>
                {marcandoError && (
                  <div className="space-y-2">
                    <Textarea
                      autoFocus
                      rows={2}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="¿Qué está mal? Ej.: en el papel es Lifting y se cargó Tinte de pestañas."
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {marcandoError ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setMarcandoError(false)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        disabled={ocupado || !nota.trim()}
                        onClick={() =>
                          ejecutar(() => validacionComandasService.revisar(hoja.id, 'CON_ERROR', nota), 'Marcada con error')
                        }
                      >
                        <ShieldX className="mr-1 h-4 w-4" /> Confirmar error
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setMarcandoError(true)}>
                        <ShieldX className="mr-1 h-4 w-4" /> Marcar error
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={ocupado}
                        onClick={() => ejecutar(() => validacionComandasService.revisar(hoja.id, 'APROBADA'), 'Hoja aprobada')}
                      >
                        <ShieldCheck className="mr-1 h-4 w-4" /> Aprobar
                      </Button>
                    </>
                  )}
                </div>
              </>
            )
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9a7d88]">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={hoja.orden <= 1} onClick={() => onMover(-1)} title="Hoja anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={hoja.orden >= lote.totalPaginas} onClick={() => onMover(1)} title="Hoja siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2">
                {hoja.leidaAt ? `Leída ${formatFechaHora(hoja.leidaAt)}` : 'Sin leer'}
                {hoja.lecturaDeId
                  ? ' · lectura reutilizada (misma foto), sin costo'
                  : hoja.costoUsd > 0 && ` · ${usd(hoja.costoUsd)}`}
              </span>
            </div>
            {lote.iaConfigurada && hoja.estado !== 'LEYENDO' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#6b4c57]"
                disabled={ocupado || lote.leyendo}
                onClick={() => ejecutar(() => validacionComandasService.releer(hoja.id), 'Releyendo la hoja con IA…')}
                title="Vuelve a leer la hoja (borra la revisión de esta hoja)"
              >
                <RotateCw className="mr-1 h-3.5 w-3.5" /> Releer (~{usd(COSTO_HOJA_USD)})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
