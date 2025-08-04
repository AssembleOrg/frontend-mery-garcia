import { useCallback } from 'react';
import { toast } from 'sonner';

export const useErrorHandler = () => {
  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
    
    // Determinar el mensaje de error
    let message = 'Ha ocurrido un error inesperado';
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    // Mostrar toast de error
    toast.error(message);
  }, []);

  return { handleError };
}; 