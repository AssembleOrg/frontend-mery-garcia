import { useEffect } from 'react';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';

export function useTipoCambioInitializer() {
  const { cargarTipoCambioInicial, inicializado } = useExchangeRate();

  useEffect(() => {
    if (!inicializado) {
      // Ejecutar de forma independiente, sin afectar la autenticación
      cargarTipoCambioInicial().catch((error) => {
        console.warn('No se pudo cargar tipo de cambio:', error);
        // No propagar el error - usar valores por defecto
      });
    }
  }, [cargarTipoCambioInicial, inicializado]);
}
