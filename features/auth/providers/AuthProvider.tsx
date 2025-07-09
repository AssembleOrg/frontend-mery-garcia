'use client';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthProviderProps {
  children: ReactNode;
}

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/'];

// Componente de loading separado para mejor composición
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

  // ✅ Inicialización explícita una sola vez
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // ✅ Lógica de redirección explícita y clara
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Redirección para usuarios no autenticados
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      return;
    }

    // Redirección para usuarios autenticados en login
    if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // ✅ Componente separado para mejor legibilidad
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
