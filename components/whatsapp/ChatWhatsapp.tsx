'use client';

import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useWhatsappStore } from '@/features/whatsapp/store/whatsappStore';
import { whatsappService, type Notificacion } from '@/services/whatsapp.service';
import { useHasMounted } from '@/hooks/useHasMounted';
import { prepararSonido, sonarAviso } from '@/lib/sonido';
import BotonFlotante from './BotonFlotante';
import ModalChat from './ModalChat';

/**
 * Punto de entrada del WhatsApp en la web: el botón flotante, el modal y la
 * escucha en vivo. Vive en el layout raíz para que la conexión no se corte
 * al cambiar de pantalla. Sólo para admin y encargada.
 */
export default function ChatWhatsapp() {
  const montado = useHasMounted();
  const user = useAuthStore((s) => s.user);
  const autenticado = useAuthStore((s) => s.isAuthenticated);
  const habilitado = montado && autenticado && (user?.rol === 'admin' || user?.rol === 'encargado');

  const {
    abierto,
    setAbierto,
    noLeidosTotal,
    esperando,
    conexion,
    cargarConversaciones,
    cargarNotificaciones,
    refrescarEstado,
    aplicarEvento,
    setStreamConectado,
    setAlNotificar,
    seleccionar,
  } = useWhatsappStore();

  const avisar = useCallback(
    (n: Notificacion) => {
      sonarAviso();
      toast(n.titulo, {
        description: n.cuerpo,
        duration: 6000,
        action: n.conversacionId
          ? {
              label: 'Abrir',
              onClick: () => {
                setAbierto(true);
                void seleccionar(n.conversacionId as string);
              },
            }
          : undefined,
      });
      if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const nav = new Notification(n.titulo, { body: n.cuerpo, tag: n.id });
          nav.onclick = () => {
            window.focus();
            setAbierto(true);
            if (n.conversacionId) void seleccionar(n.conversacionId);
          };
        } catch {
          /* el navegador no dejó */
        }
      }
    },
    [seleccionar, setAbierto],
  );

  useEffect(() => {
    if (!habilitado) return;
    prepararSonido();
    setAlNotificar(avisar);
    void cargarConversaciones();
    void cargarNotificaciones();
    void refrescarEstado();
    const estadoCada = setInterval(() => void refrescarEstado(), 60_000);
    const parar = whatsappService.escucharEventos(aplicarEvento, setStreamConectado);
    return () => {
      parar();
      clearInterval(estadoCada);
      setAlNotificar(null);
    };
  }, [habilitado, avisar, aplicarEvento, cargarConversaciones, cargarNotificaciones, refrescarEstado, setAlNotificar, setStreamConectado]);

  // Pedir permiso de avisos del navegador la primera vez que se abre (gesto de la persona).
  useEffect(() => {
    if (!abierto || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') void Notification.requestPermission();
  }, [abierto]);

  if (!habilitado) return null;

  return (
    <>
      <BotonFlotante noLeidos={noLeidosTotal} esperando={esperando} conexion={conexion} onClick={() => setAbierto(true)} />
      <ModalChat />
    </>
  );
}
