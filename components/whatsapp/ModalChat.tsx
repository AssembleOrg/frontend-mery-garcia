'use client';

import Link from 'next/link';
import { MessageCircle, Settings, Wifi, WifiOff } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useWhatsappStore } from '@/features/whatsapp/store/whatsappStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ListaConversaciones from './ListaConversaciones';
import HiloConversacion from './HiloConversacion';
import PanelNotificaciones from './PanelNotificaciones';

export default function ModalChat() {
  const { abierto, setAbierto, conexion, streamConectado, esperando } = useWhatsappStore();
  const { isAdmin } = useAuth();

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent
        showCloseButton
        className="flex h-[92vh] w-[96vw] max-w-[1400px] flex-col gap-0 overflow-hidden rounded-2xl border-2 border-[#f9bbc4]/40 p-0 sm:max-w-[1400px]"
      >
        <div className="flex items-center gap-3 border-b border-[#f9bbc4]/25 bg-gradient-to-r from-white via-[#f9bbc4]/10 to-white px-4 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-[#4a3540]">WhatsApp</DialogTitle>
            <div className="flex items-center gap-2 text-[11px] text-[#8b5a6b]">
              <span className={cn('flex items-center gap-1', conexion === 'conectado' ? 'text-emerald-700' : conexion === 'desconectado' ? 'text-rose-600' : '')}>
                {conexion === 'conectado' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {conexion === 'conectado' ? 'Número conectado' : conexion === 'desconectado' ? 'Número desconectado' : 'Estado desconocido'}
              </span>
              <span className="text-[#8b5a6b]/50">·</span>
              <span className={streamConectado ? 'text-emerald-700' : 'text-amber-600'}>{streamConectado ? 'En vivo' : 'Reconectando…'}</span>
              {esperando > 0 && (
                <>
                  <span className="text-[#8b5a6b]/50">·</span>
                  <span className="font-medium text-amber-700">
                    {esperando} {esperando === 1 ? 'charla espera' : 'charlas esperan'} una persona
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="ml-auto mr-8 flex items-center gap-1">
            <PanelNotificaciones />
            {isAdmin && (
              <Link
                href="/configuracion/whatsapp"
                onClick={() => setAbierto(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#6b4c57] transition hover:bg-[#f9bbc4]/20"
                aria-label="Configuración del WhatsApp"
                title="Configuración"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[340px_1fr]">
          <div className="min-h-0 border-r border-[#f9bbc4]/25 bg-[#fdf6f7]">
            <ListaConversaciones />
          </div>
          <div className="min-h-0 bg-white">
            <HiloConversacion />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
