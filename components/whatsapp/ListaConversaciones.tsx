'use client';

import { useMemo } from 'react';
import { Bot, CalendarDays, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useWhatsappStore } from '@/features/whatsapp/store/whatsappStore';
import type { Conversacion, FiltroEstado } from '@/services/whatsapp.service';
import { ESTADO_TEXTO, etiquetaDia, fechaLista, resumenMensaje } from './formato';

const FILTROS: Array<{ key: FiltroEstado; label: string }> = [
  { key: 'ABIERTAS', label: 'Abiertas' },
  { key: 'ESPERANDO', label: 'Esperando' },
  { key: 'ATENDIDA', label: 'En atención' },
  { key: 'BOT', label: 'Con el bot' },
  { key: 'CERRADA', label: 'Cerradas' },
];

function iniciales(texto: string): string {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '·';
}

export default function ListaConversaciones() {
  const {
    conversaciones,
    filtro,
    q,
    dia,
    cargandoLista,
    total,
    esperando,
    seleccionadaId,
    setFiltro,
    setQ,
    setDia,
    seleccionar,
    cargarConversaciones,
  } = useWhatsappStore();

  const grupos = useMemo(() => {
    const porDia = new Map<string, Conversacion[]>();
    for (const c of conversaciones) {
      const clave = c.ultimoMensajeAt ? etiquetaDia(c.ultimoMensajeAt) : 'Sin actividad';
      porDia.set(clave, [...(porDia.get(clave) ?? []), c]);
    }
    return [...porDia.entries()];
  }, [conversaciones]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-[#f9bbc4]/25 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[#8b5a6b]/60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="h-9 border-[#f9bbc4]/40 bg-white pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex flex-1 items-center">
            <CalendarDays className="pointer-events-none absolute left-2.5 h-4 w-4 text-[#8b5a6b]/60" />
            <input
              type="date"
              value={dia ?? ''}
              onChange={(e) => setDia(e.target.value || null)}
              className="h-8 w-full rounded-md border border-[#f9bbc4]/40 bg-white pl-8 pr-2 text-xs text-[#6b4c57]"
            />
          </label>
          {dia && (
            <button type="button" onClick={() => setDia(null)} className="rounded-full p-1 text-[#8b5a6b] hover:bg-[#f9bbc4]/20" aria-label="Quitar fecha">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFiltro(f.key)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                filtro === f.key
                  ? 'bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-sm'
                  : 'bg-[#f9bbc4]/15 text-[#6b4c57] hover:bg-[#f9bbc4]/30',
              )}
            >
              {f.label}
              {f.key === 'ESPERANDO' && esperando > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{esperando}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cargandoLista && conversaciones.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[#d4a7ca]" />
          </div>
        ) : conversaciones.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#8b5a6b]">
            {filtro === 'ABIERTAS' ? 'No hay charlas abiertas. Todo al día.' : 'No hay charlas con este filtro.'}
          </div>
        ) : (
          grupos.map(([etiqueta, lista]) => (
            <div key={etiqueta}>
              <div className="sticky top-0 z-10 bg-[#fdf6f7]/95 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#8b5a6b] uppercase backdrop-blur">
                {etiqueta}
              </div>
              {lista.map((c) => {
                const activa = c.id === seleccionadaId;
                const estado = ESTADO_TEXTO[c.estado];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void seleccionar(c.id)}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-[#f9bbc4]/15 px-3 py-2.5 text-left transition',
                      activa ? 'bg-[#f9bbc4]/25' : 'hover:bg-[#f9bbc4]/10',
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f9bbc4] to-[#d4a7ca] text-sm font-semibold text-white">
                        {c.estado === 'BOT' ? <Bot className="h-5 w-5" /> : iniciales(c.contacto.etiqueta)}
                      </div>
                      <span className={cn('absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white', estado.punto)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('truncate text-sm', c.noLeidos > 0 ? 'font-semibold text-[#4a3540]' : 'font-medium text-[#6b4c57]')}>
                          {c.contacto.etiqueta}
                        </span>
                        <span className="shrink-0 text-[11px] text-[#8b5a6b]">{fechaLista(c.ultimoMensajeAt)}</span>
                      </div>
                      {c.contacto.cliente && c.contacto.telefono && (
                        <div className="truncate text-[11px] text-[#8b5a6b]">{c.contacto.telefono}</div>
                      )}
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn('truncate text-xs', c.noLeidos > 0 ? 'text-[#4a3540]' : 'text-[#8b5a6b]')}>
                          {resumenMensaje(c.ultimoMensaje)}
                        </span>
                        {c.noLeidos > 0 && (
                          <span className="shrink-0 rounded-full bg-[#c2637f] px-1.5 py-[1px] text-[10px] font-semibold text-white">
                            {c.noLeidos}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
        {conversaciones.length < total && (
          <button
            type="button"
            onClick={() => void cargarConversaciones(true)}
            disabled={cargandoLista}
            className="w-full py-3 text-center text-xs font-medium text-[#c2637f] hover:bg-[#f9bbc4]/10"
          >
            {cargandoLista ? 'Cargando…' : `Ver más (${total - conversaciones.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
