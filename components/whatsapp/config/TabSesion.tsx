'use client';

import { useEffect, useState } from 'react';
import { Loader2, LogOut, QrCode, RefreshCw, RotateCcw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
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
import { whatsappService, type EstadoSesion } from '@/services/whatsapp.service';

export default function TabSesion() {
  const [estado, setEstado] = useState<EstadoSesion | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmarCierre, setConfirmarCierre] = useState(false);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const e = await whatsappService.sesion();
        if (activo) setEstado(e);
      } catch {
        /* se reintenta */
      }
    };
    void cargar();
    // Mientras no está vinculado, el QR se renueva cada ~20 s: se relee seguido.
    const cada = setInterval(cargar, 4000);
    return () => {
      activo = false;
      clearInterval(cada);
    };
  }, []);

  const accion = async (a: 'refrescar' | 'reiniciar' | 'cerrar', ok: string) => {
    setOcupado(a);
    try {
      await whatsappService.sesionAccion(a);
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo');
    } finally {
      setOcupado(null);
    }
  };

  if (!estado) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#d4a7ca]" />
      </div>
    );
  }

  const vinculado = estado.loggedIn;
  const conectado = estado.connected && estado.loggedIn;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#f9bbc4]/30 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${conectado ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="font-medium text-[#4a3540]">
              {!estado.configurado
                ? 'El servidor no tiene configurado el WhatsApp'
                : !estado.alcanzable
                  ? 'No se llega al servicio de WhatsApp'
                  : conectado
                    ? 'Número vinculado y conectado'
                    : vinculado
                      ? 'Vinculado, reconectando…'
                      : 'Sin vincular'}
            </div>
            <div className="text-xs text-[#8b5a6b]">
              {conectado
                ? 'El bot recibe y manda mensajes desde el número vinculado.'
                : vinculado
                  ? 'Si tarda más de un minuto, reiniciá el servicio.'
                  : 'Escaneá el código desde WhatsApp > Dispositivos vinculados > Vincular un dispositivo.'}
            </div>
          </div>
        </div>

        {!vinculado && estado.alcanzable && (
          <div className="mt-5 flex flex-col items-center gap-3">
            {estado.qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${estado.qr}`} alt="Código QR para vincular" className="h-64 w-64 rounded-lg border border-[#f9bbc4]/40 bg-white p-2" />
            ) : (
              <div className="flex h-64 w-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#f9bbc4]/50 text-[#8b5a6b]">
                <QrCode className="h-8 w-8 opacity-50" />
                <span className="text-xs">{estado.pairingExpired ? 'El código venció' : 'Generando código…'}</span>
              </div>
            )}
            {estado.pairingExpired && !estado.pairingAutoRefresh && (
              <Button onClick={() => accion('refrescar', 'Generando un código nuevo')} disabled={ocupado !== null} className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white">
                {ocupado === 'refrescar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Generar código nuevo
              </Button>
            )}
            {estado.pairingExpired && estado.pairingAutoRefresh && <span className="text-xs text-[#8b5a6b]">Renovando el código…</span>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => accion('reiniciar', 'Reiniciando el servicio')} disabled={ocupado !== null || !estado.alcanzable}>
          {ocupado === 'reiniciar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          Reiniciar servicio
        </Button>
        <Button variant="outline" onClick={() => setConfirmarCierre(true)} disabled={ocupado !== null || !vinculado} className="text-rose-600">
          <LogOut className="mr-2 h-4 w-4" /> Desvincular número
        </Button>
      </div>

      <AlertDialog open={confirmarCierre} onOpenChange={setConfirmarCierre}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular el número</AlertDialogTitle>
            <AlertDialogDescription>
              El bot deja de recibir y mandar mensajes hasta que se vuelva a escanear un código. Las charlas guardadas no se pierden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => accion('cerrar', 'Número desvinculado')} className="bg-rose-600 text-white hover:bg-rose-700">
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
