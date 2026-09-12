'use client';

import { Bell, CheckCheck, MessageCircle, UserRound } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useWhatsappStore } from '@/features/whatsapp/store/whatsappStore';
import { fechaLista } from './formato';

export default function PanelNotificaciones() {
  const { notificaciones, marcarTodasLeidas, marcarLeida, seleccionar } = useWhatsappStore();
  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6b4c57] transition hover:bg-[#f9bbc4]/20"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {sinLeer > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c2637f] px-1 text-[10px] font-semibold text-white">
              {sinLeer > 99 ? '99+' : sinLeer}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] border-[#f9bbc4]/40 p-0">
        <div className="flex items-center justify-between border-b border-[#f9bbc4]/25 px-3 py-2">
          <span className="text-sm font-semibold text-[#4a3540]">Notificaciones</span>
          <button
            type="button"
            onClick={() => void marcarTodasLeidas()}
            disabled={sinLeer === 0}
            className="flex items-center gap-1 text-xs text-[#c2637f] hover:underline disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas leídas
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[#8b5a6b]">Nada por ahora. Se guardan 3 días.</div>
          ) : (
            notificaciones.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.leida) void marcarLeida(n.id);
                  if (n.conversacionId) void seleccionar(n.conversacionId);
                }}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-[#f9bbc4]/15 px-3 py-2.5 text-left transition hover:bg-[#f9bbc4]/10',
                  !n.leida && 'bg-[#f9bbc4]/10',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    n.tipo === 'ESPERANDO' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700',
                  )}
                >
                  {n.tipo === 'ESPERANDO' ? <UserRound className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('truncate text-sm', n.leida ? 'text-[#6b4c57]' : 'font-semibold text-[#4a3540]')}>{n.titulo}</span>
                    <span className="shrink-0 text-[11px] text-[#8b5a6b]">{fechaLista(n.createdAt)}</span>
                  </div>
                  <div className="truncate text-xs text-[#8b5a6b]">{n.cuerpo}</div>
                </div>
                {!n.leida && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c2637f]" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
