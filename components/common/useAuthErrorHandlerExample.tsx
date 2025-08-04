'use client';

import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';

// Ejemplo de cómo usar el hook en componentes
export const useAuthErrorHandlerExample = () => {
  const { handleAuthError } = useAuthErrorHandler();

  const handleApiCall = async () => {
    try {
      // Hacer llamada a la API
      const response = await fetch('/api/some-endpoint');
      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }
      // Procesar respuesta...
    } catch (error) {
      // Intentar manejar como error de autenticación
      const wasAuthError = handleAuthError(error as Error);
      
      if (!wasAuthError) {
        // Si no es un error de auth, manejar como error normal
        console.error('Error no relacionado con autenticación:', error);
      }
    }
  };

  return { handleApiCall };
}; 