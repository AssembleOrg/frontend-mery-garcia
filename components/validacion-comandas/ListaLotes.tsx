'use client';

import { FileStack } from 'lucide-react';
import { cn, formatDiaISO } from '@/lib/utils';
import type { Lote } from '@/services/validacionComandas.service';
import { Panel, Vacio } from '@/components/contable/ui';
import { Insignia, textoEstadoLote, usd } from './formato';

export default function ListaLotes({
  lotes,
  seleccionado,
  onElegir,
}: {
  lotes: Lote[];
  seleccionado: string | null;
  onElegir: (id: string) => void;
}) {
  return (
    <Panel titulo="Lotes" subtitulo={`${lotes.length} ${lotes.length === 1 ? 'lote' : 'lotes'}`} cuerpoClassName="p-2">
      {lotes.length === 0 ? (
        <Vacio icono={<FileStack className="h-6 w-6" />} titulo="Todavía no hay lotes" texto="Subí el PDF de las comandas de un día." />
      ) : (
        <ul className="space-y-1">
          {lotes.map((l) => {
            const r = l.resumen;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onElegir(l.id)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-left transition-colors',
                    seleccionado === l.id ? 'border-[#8b5a6b] bg-[#fbeef2]' : 'border-transparent hover:bg-[#fdf6f8]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#3d2a32]">{formatDiaISO(l.fecha)}</span>
                    <Insignia v={textoEstadoLote(l)} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#9a7d88]">{l.nombreArchivo}</p>
                  <p className="mt-1 text-xs text-[#6b4c57] tabular-nums">
                    {r.total} hojas
                    {r.ok + r.revisar + r.noEncontradas > 0 && (
                      <>
                        {' · '}
                        <span className="text-emerald-700">{r.ok} OK</span>
                        {' · '}
                        <span className="text-amber-700">{r.revisar + r.noEncontradas} revisar</span>
                      </>
                    )}
                    {l.costoUsd > 0 && ` · ${usd(l.costoUsd)}`}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
