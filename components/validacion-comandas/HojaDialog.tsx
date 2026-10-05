'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatDiaISO } from '@/lib/utils';
import {
  mensajeError,
  validacionComandasService,
  type CampoDiferencia,
  type Hoja,
  type LoteDetalle,
} from '@/services/validacionComandas.service';
import { formatMonto } from '@/components/contable/ui';
import ImagenHoja from './ImagenHoja';
import { COSTO_HOJA_USD, Insignia, textoMonto, usd, visualHoja } from './formato';

function Fila({
  titulo,
  papel,
  sistema,
  diferente,
  nota,
}: {
  titulo: string;
  papel: React.ReactNode;
  sistema: React.ReactNode;
  diferente: boolean;
  nota?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-3', diferente ? 'border-amber-200 bg-amber-50/50' : 'border-[#f0dde3] bg-white')}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#6b4c57] uppercase">
        {diferente ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
        {titulo}
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-[11px] text-[#9a7d88]">Papel (leído por IA)</p>
          <div className="text-[#3d2a32]">{papel}</div>
        </div>
        <div>
          <p className="text-[11px] text-[#9a7d88]">Sistema</p>
          <div className="text-[#3d2a32]">{sistema}</div>
        </div>
      </div>
      {nota && <p className="mt-1.5 text-xs text-[#9a7d88]">{nota}</p>}
    </div>
  );
}

const lista = (xs: string[]) =>
  xs.length ? (
    <ul className="space-y-0.5">
      {xs.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  ) : (
    <span className="text-[#9a7d88]">—</span>
  );

/** Detalle de una hoja: la imagen del papel y, al lado, cada dato contra el sistema. */
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
  const [releyendo, setReleyendo] = useState(false);
  if (!hoja) return null;
  const L = hoja.lectura;
  const S = hoja.sistema;
  const difs = new Set<CampoDiferencia>((hoja.diferencias ?? []).map((d) => d.campo));
  const det = (c: CampoDiferencia) => hoja.diferencias?.find((d) => d.campo === c);
  const v = visualHoja(hoja);

  const releer = async () => {
    setReleyendo(true);
    try {
      onActualizado(await validacionComandasService.releer(hoja.id));
      toast.success('Releyendo la hoja con IA…');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo releer'));
    } finally {
      setReleyendo(false);
    }
  };

  const cobrosPapel = (L?.montos ?? []).filter((m) => m.donde !== 'SENA' || m.etiquetaTachada).map(textoMonto);
  const senasPapel = (L?.montos ?? []).filter((m) => m.donde === 'SENA' && !m.etiquetaTachada).map(textoMonto);

  return (
    <Dialog open={!!hoja} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-[#3d2a32]">
            Hoja {hoja.orden} de {lote.totalPaginas}
            {hoja.numeroComanda && <span className="text-[#8b5a6b]">· {hoja.numeroComanda}</span>}
            <Insignia v={v} />
            {hoja.repetida && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Número repetido en el lote</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Lote del {formatDiaISO(lote.fecha)}. La IA leyó el papel sin ver el sistema; la comparación es con reglas fijas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-2">
            <ImagenHoja paginaId={hoja.id} alt={`Hoja ${hoja.orden}`} className="max-h-[72vh] w-full rounded-xl border border-[#f0dde3]" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={hoja.orden <= 1} onClick={() => onMover(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={hoja.orden >= lote.totalPaginas} onClick={() => onMover(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#6b4c57]"
                onClick={() => validacionComandasService.imagenUrl(hoja.id).then((u) => window.open(u, '_blank'))}
              >
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Ver en grande
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {hoja.estado === 'ERROR' && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">No se pudo leer: {hoja.error}</p>
            )}
            {hoja.estado === 'PENDIENTE' && (
              <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">Esta hoja todavía no se leyó.</p>
            )}
            {L && (
              <>
                {hoja.resultado === 'NO_ENCONTRADA' && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                    La IA leyó el N° {L.numero ?? '(ilegible)'} y no hay ninguna comanda de ingreso con ese número. Puede ser
                    una comanda sin cargar o un número mal leído: mirá la imagen.
                  </p>
                )}
                <Fila
                  titulo="Número y fecha"
                  papel={
                    <>
                      N° {L.numero ?? '—'}
                      <span className="block text-xs text-[#9a7d88]">Fecha escrita: {L.fecha ? formatDiaISO(L.fecha) : '—'} (sólo informativa)</span>
                    </>
                  }
                  sistema={
                    S ? (
                      <>
                        {S.numero}
                        <span className="block text-xs text-[#9a7d88]">Cargada el {formatDiaISO(S.fecha)} · {S.estado}</span>
                      </>
                    ) : (
                      '—'
                    )
                  }
                  diferente={difs.has('fecha') || hoja.resultado === 'NO_ENCONTRADA'}
                  nota={difs.has('fecha') ? `La comanda está cargada con otra fecha que el lote (${formatDiaISO(lote.fecha)}).` : undefined}
                />
                <Fila titulo="Clienta" papel={L.cliente ?? '—'} sistema={S?.cliente ?? '—'} diferente={difs.has('cliente')} />
                {(L.anulada || difs.has('anulada')) && (
                  <Fila
                    titulo="Anulada"
                    papel="El papel dice que se anuló / no vino"
                    sistema={S?.observaciones || S?.estado || '—'}
                    diferente={difs.has('anulada')}
                  />
                )}
                <Fila
                  titulo="Servicios y responsables"
                  papel={lista([
                    ...L.servicios.map(
                      (s) => `${s.fila}${s.responsable ? ` — ${s.responsable}` : ''}${s.anotacion ? ` ("${s.anotacion}")` : ''}`,
                    ),
                    ...L.otros.map((o) => `Otros: ${o}`),
                  ])}
                  sistema={lista((S?.items ?? []).map((i) => `${i.nombre}${i.trabajador ? ` — ${i.trabajador}` : ''}`))}
                  diferente={difs.has('servicios') || difs.has('responsables')}
                  nota={
                    difs.has('responsables') && !difs.has('servicios')
                      ? `Los servicios coinciden, pero no quién los hizo (${det('responsables')?.papel} / ${det('responsables')?.sistema}).`
                      : undefined
                  }
                />
                <Fila
                  titulo="Seña usada"
                  papel={lista(senasPapel)}
                  sistema={lista((S?.senas ?? []).map((s) => formatMonto(s.monto, s.moneda === 'USD' ? 'USD' : 'ARS')))}
                  diferente={difs.has('sena')}
                />
                <Fila
                  titulo="Cobrado"
                  papel={lista(cobrosPapel)}
                  sistema={lista(
                    (S?.pagos ?? [])
                      .filter((p) => !(p.tipo === 'GIFT_CARD' && p.monto <= 1))
                      .map((p) => `${p.tipo.replace('_', ' ').toLowerCase()} · ${formatMonto(p.monto, p.moneda === 'USD' ? 'USD' : 'ARS')}`),
                  )}
                  diferente={difs.has('cobrado')}
                  nota={difs.has('cobrado') ? `Total papel ${det('cobrado')?.papel} / sistema ${det('cobrado')?.sistema}.` : undefined}
                />
                {L.observaciones && (
                  <p className="rounded-xl bg-[#fdf6f8] px-3 py-2 text-sm text-[#6b4c57]">
                    <span className="font-medium">Observaciones del papel:</span> {L.observaciones}
                  </p>
                )}
                {L.dudas.length > 0 && (
                  <div className="rounded-xl bg-sky-50/60 px-3 py-2 text-xs text-sky-900">
                    <p className="mb-1 font-medium">Lo que la IA no leyó con seguridad:</p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      {L.dudas.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f7ecef] pt-3 text-xs text-[#9a7d88]">
              <span>
                {hoja.leidaAt ? `Leída ${new Date(hoja.leidaAt).toLocaleString('es-AR')}` : 'Sin leer'}
                {hoja.costoUsd > 0 && ` · ${usd(hoja.costoUsd)}`}
              </span>
              {lote.iaConfigurada && (
                <Button variant="outline" size="sm" disabled={releyendo || lote.leyendo} onClick={releer}>
                  <RotateCw className="mr-1 h-3.5 w-3.5" /> Releer esta hoja (~{usd(COSTO_HOJA_USD)})
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
