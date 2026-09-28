'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';

interface AuthProviderProps {
  children: ReactNode;
}
const PUBLIC_ROUTES = ['/'];

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#f9bbc4]"></div>
      <p className="text-gray-600">Cargando...</p>
    </div>
  </div>
);

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading, initializeAuth, soloPresentismo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { handleAuthError } = useAuthErrorHandler();

  // Hasta que initializeAuth no restauró la sesión, isAuthenticated vale false
  // aunque haya token: redirigir antes mandaba toda URL directa (p. ej.
  // /contable, que no tiene acceso desde el dashboard) al login y de ahí al
  // dashboard.
  const [sesionLista, setSesionLista] = useState(false);

  useEffect(() => {
    initializeAuth();
    setSesionLista(true);
  }, [initializeAuth]);

  // Manejador global de errores para autenticación
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      if (error && handleAuthError(error)) {
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error && handleAuthError(error)) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleAuthError]);

  useEffect(() => {
    if (isLoading || !sesionLista) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Redirección para usuarios no autenticados en rutas protegidas
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/');
      return;
    }

    // Redirección para usuarios autenticados desde la página de login
    if (isAuthenticated && pathname === '/') {
      router.push(soloPresentismo ? '/presentismo' : '/dashboard');
      return;
    }

    // Quien sólo tiene presentismo no sale de ahí: cualquier otra ruta
    // (dashboard, cajas, clientes…) lo devuelve. El backend igual rechaza
    // sus llamadas al resto; esto es para que no vea pantallas rotas.
    if (isAuthenticated && soloPresentismo && !pathname.startsWith('/presentismo')) {
      router.replace('/presentismo');
    }
  }, [isAuthenticated, isLoading, sesionLista, pathname, router, soloPresentismo]);

  if (isLoading || !sesionLista) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && pathname === '/') {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && soloPresentismo && !pathname.startsWith('/presentismo')) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
