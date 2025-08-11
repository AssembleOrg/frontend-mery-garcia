'use client';

import { toast } from 'sonner';

// Versión actual del cache de la aplicación
const CURRENT_CACHE_VERSION = '2.0.0';

// Lista de todos los stores que pueden tener cache
const STORES_TO_MANAGE = [
  'clientes-store',
  'auth-storage',
  'records-store',
  'movimientos-store',
  'comandas-store',
  'productos-store',
  'unidad-negocio-store'
];

/**
 * Invalida automáticamente el cache si la versión de la app ha cambiado
 */
export const invalidateStaleCache = () => {
  if (typeof window === 'undefined') return;

  try {
    const storedVersion = localStorage.getItem('app-cache-version');
    
    if (storedVersion !== CURRENT_CACHE_VERSION) {
      
      // Limpiar todos los stores
      STORES_TO_MANAGE.forEach(storeName => {
        localStorage.removeItem(storeName);
      });
      
      // Actualizar la versión almacenada
      localStorage.setItem('app-cache-version', CURRENT_CACHE_VERSION);
      
      
      // Mostrar notificación en desarrollo
      if (process.env.NODE_ENV === 'development') {
        toast.success(`Cache actualizado a v${CURRENT_CACHE_VERSION}`);
      }
    }
  } catch (error) {
    console.error('❌ Error al invalidar cache:', error);
  }
};

/**
 * Limpia manualmente todo el cache de la aplicación
 */
export const clearAllCache = () => {
  if (typeof window === 'undefined') return;

  try {
    
    STORES_TO_MANAGE.forEach(storeName => {
      localStorage.removeItem(storeName);
    });
    
    // Limpiar también la versión para forzar una re-inicialización
    localStorage.removeItem('app-cache-version');
    
    toast.success('🧹 Cache limpiado correctamente');
    
    // Recargar después de un delay para mostrar el toast
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error al limpiar cache:', error);
    toast.error('Error al limpiar cache');
  }
};

/**
 * Limpia el cache de un store específico
 */
export const clearStoreCache = (storeName: string) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(storeName);
    toast.success(`Cache de ${storeName} limpiado`);
  } catch (error) {
    console.error(`❌ Error al limpiar cache del store ${storeName}:`, error);
    toast.error(`Error al limpiar cache de ${storeName}`);
  }
};

/**
 * Obtiene información sobre el estado del cache
 */
export const getCacheInfo = () => {
  if (typeof window === 'undefined') return null;

  try {
    const currentVersion = localStorage.getItem('app-cache-version') || 'no-version';
    const storeInfo = STORES_TO_MANAGE.map(storeName => {
      const hasCache = localStorage.getItem(storeName) !== null;
      return { storeName, hasCache };
    });

    return {
      currentVersion,
      expectedVersion: CURRENT_CACHE_VERSION,
      isUpToDate: currentVersion === CURRENT_CACHE_VERSION,
      stores: storeInfo
    };
  } catch (error) {
    console.error('❌ Error al obtener info del cache:', error);
    return null;
  }
};

/**
 * Hook para usar en el layout principal de la app
 */
export const useCacheManager = () => {
  return {
    clearAllCache,
    clearStoreCache,
    getCacheInfo,
    invalidateStaleCache,
  };
};
