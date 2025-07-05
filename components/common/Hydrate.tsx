'use client';

import ClientOnly from './ClientOnly';
import { ReactNode } from 'react';

/**
 * Alias de `ClientOnly` para semántica de hidratación segura.
 * Permite envolver secciones de UI que dependan exclusivamente de datos
 * generados en el cliente o de stores como Zustand.
 *
 * Ejemplo de uso:
 * ```tsx
 * <Hydrate>
 *   <MyDynamicComponent />
 * </Hydrate>
 * ```
 */
export default function Hydrate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <ClientOnly fallback={fallback}>{children}</ClientOnly>;
}
