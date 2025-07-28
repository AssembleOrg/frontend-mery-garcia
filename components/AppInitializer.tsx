'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useConfiguracionStore } from '@/features/configuracion/store/configuracionStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import { useComandasStore } from '@/features/comandas/store/comandasStore';

export default function AppInitializer() {
  const { cargarTipoCambioInicial } = useExchangeRateStore();
  const {  cargarEstadisticas: cargarEstadisticasComandas } = useComandasStore();

  useEffect(() => {
    console.log('AppInitializer - Inicializando datos de la aplicación...');
    const loadData = async () => {
      await cargarTipoCambioInicial();
      // await cargarComandasPaginadas();
    }
    loadData();
    
  }, [cargarTipoCambioInicial, cargarEstadisticasComandas]);

  return null;
}
