'use client';
import { useEffect } from 'react';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';

export function TipoCambioInitializer() {
  const { cargarTipoCambioInicial } = useDatosReferencia();

  useEffect(() => {
    cargarTipoCambioInicial();
  }, [cargarTipoCambioInicial]);

  return null;
}
