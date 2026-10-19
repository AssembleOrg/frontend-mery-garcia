'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useHasMounted } from '@/hooks/useHasMounted';
import { avisosService } from '@/services/avisos.service';
import { prepararSonido, sonarAviso } from '@/lib/sonido';

/**
 * Escucha en vivo los avisos dirigidos a quien tiene la sesión (hoy: al
 * empleado cuando le aprueban o rechazan un pedido). El equipo recibe los
 * suyos por el canal del WhatsApp (ChatWhatsapp).
 */
export default function AvisosPersonales() {
  const montado = useHasMounted();
  const autenticado = useAuthStore((s) => s.isAuthenticated);
  const rol = useAuthStore((s) => s.user?.rol);
  const router = useRouter();
  const habilitado = montado && autenticado && rol === 'empleado';

  useEffect(() => {
    if (!habilitado) return;
    prepararSonido();
    return avisosService.escuchar((n) => {
      sonarAviso();
      window.dispatchEvent(new CustomEvent('mery:notificacion', { detail: n }));
      toast(n.titulo, {
        description: n.cuerpo,
        duration: 8000,
        action: n.enlace ? { label: 'Ver', onClick: () => router.push(n.enlace as string) } : undefined,
      });
    });
  }, [habilitado, router]);

  return null;
}
