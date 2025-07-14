'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface ManagerOrAdminOnlyProps {
  children: React.ReactNode;
  redirectTo?: string;
  showBackButton?: boolean;
  excludeCaja2?: boolean;
}

export default function ManagerOrAdminOnly({
  children,
  redirectTo = '/dashboard',
  showBackButton = true,
  excludeCaja2 = false,
}: ManagerOrAdminOnlyProps) {
  const { isAdmin, hasRole, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const hasAccess = isAdmin || hasRole('encargado');

  const isEncargadoWithCaja2Restriction =
    excludeCaja2 && hasRole('encargado') && !isAdmin;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (
      !isLoading &&
      isAuthenticated &&
      (!hasAccess || isEncargadoWithCaja2Restriction)
    ) {
    }
  }, [
    isAuthenticated,
    isLoading,
    hasAccess,
    isEncargadoWithCaja2Restriction,
    router,
    redirectTo,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!hasAccess || isEncargadoWithCaja2Restriction) {
    const mensaje = isEncargadoWithCaja2Restriction
      ? 'Los encargados no tienen acceso a Caja Grande. Esta sección es exclusiva para administradores.'
      : 'Solo los administradores y encargados pueden acceder a esta sección.';

    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <ShieldX className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Acceso Denegado
              </h2>
              <p className="text-gray-600">{mensaje}</p>
              {showBackButton && (
                <Button
                  onClick={() => router.push(redirectTo)}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
