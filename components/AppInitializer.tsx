'use client';

import { useEffect } from 'react';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';

export default function AppInitializer() {
  const { cargarTipoCambioInicial } = useExchangeRateStore();

  useEffect(() => {
    console.log('AppInitializer - Inicializando datos de la aplicación...');
    const loadData = async () => {
      await cargarTipoCambioInicial();
    }
    loadData();
    
  }, [cargarTipoCambioInicial]);

  return null;
}
