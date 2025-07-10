'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

interface AdminOnlyProps {
  children: React.ReactNode;
  redirectTo?: string;
  showBackButton?: boolean;
}

export default function AdminOnly({
  children,
  redirectTo = '/dashboard',
  showBackButton = true,
}: AdminOnlyProps) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      // Opcional: redirección automática después de 3 segundos
      // setTimeout(() => router.push(redirectTo), 3000);
    }
  }, [isAdmin, isAuthenticated, isLoading, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <ShieldX className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Acceso Denegado
              </h2>
              <p className="text-gray-600">
                Solo los administradores pueden acceder a esta sección.
              </p>
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
