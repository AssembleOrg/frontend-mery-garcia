import { useEffect, useRef } from 'react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { logger } from '@/lib/utils';

// Función para generar IDs únicos y estables
export const generateUniqueId = (prefix: string, index: number) => {
  // Usar una fecha base fija para que los IDs sean consistentes entre servidor y cliente
  const baseTimestamp = new Date('2025-01-01T00:00:00Z').getTime();
  const uniqueId = `${prefix}-${(baseTimestamp + index * 1000).toString(36)}`;
  return uniqueId;
};

// Función para generar números de comanda únicos separados por tipo
export const generateComandaNumber = (
  tipo: 'ingreso' | 'egreso',
  contador: number
) => {
  const prefix = tipo === 'ingreso' ? '01' : '02';
  const numeroFormateado = contador.toString().padStart(4, '0');
  return `${prefix}-${numeroFormateado}`;
};

// Manejar inicialización sin comandas mock
const initializationState = {
  isInitialized: false,
  isInitializing: false,
  timestamp: 0,
};

export function useInitializeComandaStore() {
  const mountedRef = useRef(false);
  const { limpiarDuplicados, migrarDatosValidacion } = useComandaStore();

  // Mark as mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    // Prevenir race conditions with timestamp
    if (initializationState.isInitializing) return;

    initializationState.isInitializing = true;
    initializationState.timestamp = Date.now();

    const currentTimestamp = initializationState.timestamp;

    // Verificar si sigue siendo la misma inicialización
    if (currentTimestamp !== initializationState.timestamp) {
      initializationState.isInitializing = false;
      return;
    }

    try {
      logger.info('🚀 Inicializando sistema de comandas...');

      // Limpiar duplicados si los hay
      limpiarDuplicados();

      // Migrar datos de validación si es necesario
      migrarDatosValidacion();

      logger.success('✅ Sistema de comandas inicializado correctamente');

      initializationState.isInitialized = true;
    } catch (error) {
      logger.error('❌ Error en inicialización:', error);
    } finally {
      initializationState.isInitializing = false;
    }
  }, [limpiarDuplicados, migrarDatosValidacion]);

  return {
    isInitialized: initializationState.isInitialized,
  };
}
