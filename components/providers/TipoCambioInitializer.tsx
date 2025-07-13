'use client';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import { useEffect } from 'react';

export function TipoCambioInitializer() {
  const { cargarTipoCambioInicial } = useDatosReferencia();

  useEffect(() => {
    cargarTipoCambioInicial();
  }, [cargarTipoCambioInicial]);

  return null;
}
