'use client';
import { ReactNode, useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renderiza sus hijos únicamente después de que el componente se ha montado
 * en el navegador. Sirve para evitar errores de hidratación y reemplaza el
 * patrón repetitivo `isClient` + `useEffect`.
 */
export default function ClientOnly({
  children,
  fallback = null,
}: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;

  return <>{children}</>;
}
