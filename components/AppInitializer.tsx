'use client';

import { useEffect } from 'react';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { useAutomaticCacheInvalidation } from '@/hooks/useCacheManager';

export default function AppInitializer() {
  const { cargarTipoCambioInicial } = useExchangeRateStore();
  
  // Invalidar cache automáticamente si hay nueva versión
  useAutomaticCacheInvalidation();

  useEffect(() => {
    console.log('AppInitializer - Inicializando datos de la aplicación...');
    const loadData = async () => {
      await cargarTipoCambioInicial();
    }
    loadData();
    
  }, [cargarTipoCambioInicial]);

  return null;
}
