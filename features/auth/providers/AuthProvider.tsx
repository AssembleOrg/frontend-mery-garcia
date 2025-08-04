'use client';
import { ReactNode, useEffect } from 'react';
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
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { handleAuthError } = useAuthErrorHandler();

  useEffect(() => {
    initializeAuth();
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
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Redirección para usuarios no autenticados en rutas protegidas
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/');
      return;
    }

    // Redirección para usuarios autenticados desde la página de login
    if (isAuthenticated && pathname === '/') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && pathname === '/') {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
