'use client';

import { useInitializeTipoCambio } from '@/hooks/useInitializeTipoCambio';

interface TipoCambioProviderProps {
  children: React.ReactNode;
}

export function TipoCambioProvider({ children }: TipoCambioProviderProps) {
  useInitializeTipoCambio();

  return <>{children}</>;
}
