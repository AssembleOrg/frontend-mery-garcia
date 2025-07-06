import { useEffect } from 'react';

/**
 * Hook para bloquear/desbloquear el scroll del body cuando un modal está abierto
 * Evita duplicación de código en múltiples modales
 */
export const useModalScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;

      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restaurar scroll cuando se cierre
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
};
