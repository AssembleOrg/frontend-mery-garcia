'use client';

import { useEffect } from 'react';
import { invalidateStaleCache, useCacheManager } from '@/lib/cacheManager';

/**
 * Hook para gestión automática de cache
 * Debe usarse en el layout principal o en el componente raíz
 */
export const useAutomaticCacheInvalidation = () => {
  useEffect(() => {
    // Verificar y limpiar cache obsoleto al cargar la app
    invalidateStaleCache();
  }, []);
};

export { useCacheManager };
