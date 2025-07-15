import { useEffect, useRef } from 'react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';
import { logger } from '@/lib/utils';

// Estado global de inicialización para prevenir race conditions
const initializationState = {
  isInitializing: false,
  isInitialized: false,
  timestamp: 0,
};

export function useAppInitializer() {
  const mountedRef = useRef(false);
  const { comandas, limpiarDuplicados, migrarDatosValidacion } =
    useComandaStore();
  const { cargarTipoCambioInicial, inicializado: tipoCambioInicializado } =
    useExchangeRate();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    // Prevenir race conditions con timestamp
    if (initializationState.isInitializing) return;

    const currentTimestamp = Date.now();
    if (
      initializationState.isInitialized &&
      currentTimestamp - initializationState.timestamp < 5000
    ) {
      return;
    }

    initializationState.isInitializing = true;
    initializationState.timestamp = currentTimestamp;

    const initializeApp = async () => {
      try {
        logger.info('🚀 Iniciando aplicación...');

        if (!tipoCambioInicializado) {
          await cargarTipoCambioInicial().catch((error) => {
            logger.warning('No se pudo cargar tipo de cambio:', error);
            // No propagar el error - usar valores por defecto
          });
        }

        // 2. Procesar comandas si existen
        if (comandas.length > 0) {
          limpiarDuplicados();
          migrarDatosValidacion();
        }

        initializationState.isInitialized = true;
        logger.success('✅ Aplicación inicializada correctamente');
      } catch (error) {
        logger.error('❌ Error al inicializar aplicación:', error);
      } finally {
        initializationState.isInitializing = false;
      }
    };

    initializeApp();
  }, [
    comandas,
    cargarTipoCambioInicial,
    tipoCambioInicializado,
    limpiarDuplicados,
    migrarDatosValidacion,
  ]);

  return {
    isInitialized: initializationState.isInitialized,
    isInitializing: initializationState.isInitializing,
  };
}
