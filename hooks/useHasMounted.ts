import { useEffect, useState } from 'react';

/**
 * Pequeño helper para saber si el componente ya se montó en el cliente.
 * Útil para evitar desajustes de hidratación cuando algo depende de APIs del browser.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
