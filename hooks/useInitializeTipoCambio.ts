import { useEffect, useRef } from 'react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { getManualRate } from '@/services/exchangeRate.service';
import { logger } from '@/lib/utils';

export function useInitializeTipoCambio() {
  const mountedRef = useRef(false);
  const { actualizarTipoCambio } = useComandaStore();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || isInitializedRef.current) return;

    const initializeTipoCambio = async () => {
      try {
        logger.info('🔄 Cargando tipo de cambio inicial desde backend...');

        const manualRate = await getManualRate();

        if (manualRate && manualRate.venta) {
          actualizarTipoCambio({
            valorCompra: manualRate.compra || 0,
            valorVenta: manualRate.venta,
            fecha: new Date(manualRate.fechaActualizacion),
            fuente: manualRate.casa || 'Manual',
            modoManual: true,
          });

          logger.success('✅ Tipo de cambio cargado:', manualRate.venta);
        } else {
          logger.info('ℹ️ No se encontró valor manual previo');
        }
      } catch (error) {
        logger.error('❌ Error cargando tipo de cambio inicial:', error);
      } finally {
        isInitializedRef.current = true;
      }
    };

    initializeTipoCambio();
  }, [actualizarTipoCambio]);

  return {
    isInitialized: isInitializedRef.current,
  };
}
