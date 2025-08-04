import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

export const useAuthErrorHandler = () => {
  const logout = useAuthStore((state) => state.logout);

  const handleAuthError = useCallback((error: any) => {
    // Verificar si es un error de autenticación
    const isAuthError = 
      error?.message?.includes('401') || 
      error?.message?.includes('403') ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('forbidden') ||
      error?.message?.includes('token') ||
      error?.message?.includes('authentication') ||
      error?.status === 401 ||
      error?.status === 403 ||
      (error?.response?.status === 401) ||
      (error?.response?.status === 403);

    if (isAuthError) {
      // Limpiar el store de autenticación
      logout();
      
      // Mostrar mensaje al usuario
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      
      // Redirigir al login de manera simple
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
      
      return true; // Indica que se manejó el error
    }

    return false; // No se manejó el error
  }, [logout]);

  return { handleAuthError };
}; 