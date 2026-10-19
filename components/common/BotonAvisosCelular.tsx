'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Share } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { activarPush, desactivarPush, estadoPush, type EstadoPush } from '@/lib/push';

/**
 * Activar / desactivar las notificaciones push en este dispositivo. En
 * iPhone explica que primero hay que agregar la web a la pantalla de inicio.
 */
export default function BotonAvisosCelular({ className }: { className?: string }) {
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    estadoPush().then(setEstado).catch(() => setEstado('no-soportado'));
  }, []);

  if (estado === null || estado === 'no-soportado' || estado === 'apagado') return null;

  if (estado === 'requiere-instalar') {
    return (
      <div className={`rounded-lg border border-[#f9bbc4]/40 bg-white/95 p-3 text-sm text-[#6b4c57] ${className ?? ''}`}>
        <p className="flex items-center gap-2 font-medium text-[#4a3540]">
          <BellRing className="h-4 w-4" /> Avisos en el celular
        </p>
        <p className="mt-1">
          Para recibir avisos en el iPhone, tocá <Share className="inline h-4 w-4 align-text-bottom" />{' '}
          <span className="font-medium">Compartir</span> y después{' '}
          <span className="font-medium">&quot;Agregar a inicio&quot;</span>. Abrí la app desde ese ícono y activalos acá.
        </p>
      </div>
    );
  }

  if (estado === 'bloqueado') {
    return (
      <p className={`rounded-lg border border-[#f9bbc4]/40 bg-white/95 p-3 text-xs text-[#6b4c57] ${className ?? ''}`}>
        Los avisos están bloqueados en este navegador. Habilitalos desde los ajustes del navegador.
      </p>
    );
  }

  const activo = estado === 'activo';
  const alternar = async () => {
    setTrabajando(true);
    try {
      const nuevo = activo ? await desactivarPush() : await activarPush();
      setEstado(nuevo);
      if (nuevo === 'activo') toast.success('Listo: vas a recibir avisos en este dispositivo');
      else if (nuevo === 'bloqueado') toast.error('No se dieron permisos para avisos');
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron activar los avisos');
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={alternar}
      disabled={trabajando}
      className={`h-10 border-[#f9bbc4]/50 bg-white/95 text-[#6b4c57] ${className ?? ''}`}
    >
      {activo ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
      {activo ? 'Desactivar avisos en este dispositivo' : 'Activar avisos en este dispositivo'}
    </Button>
  );
}
