'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHasMounted } from '@/hooks/useHasMounted';
import TabRespuestas from '@/components/whatsapp/config/TabRespuestas';
import TabBot from '@/components/whatsapp/config/TabBot';
import TabSesion from '@/components/whatsapp/config/TabSesion';

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Configuración', href: '/configuracion' },
  { label: 'WhatsApp' },
];

/** Configuración del bot de WhatsApp. Sólo admin: no aparece en los menús. */
export default function ConfiguracionWhatsappPage() {
  const montado = useHasMounted();
  const { isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (montado && isAuthenticated && !isAdmin) router.replace('/dashboard');
  }, [montado, isAuthenticated, isAdmin, router]);

  if (!montado || !isAdmin) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
        <StandardPageBanner title="WhatsApp" />
        <StandardBreadcrumbs items={breadcrumbItems} />

        <div className="mx-auto max-w-5xl px-4 py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="bg-white p-6">
              <Tabs defaultValue="respuestas">
                <TabsList className="mb-6">
                  <TabsTrigger value="respuestas">Respuestas del bot</TabsTrigger>
                  <TabsTrigger value="bot">Bot y horario</TabsTrigger>
                  <TabsTrigger value="sesion">Conexión</TabsTrigger>
                </TabsList>
                <TabsContent value="respuestas">
                  <TabRespuestas />
                </TabsContent>
                <TabsContent value="bot">
                  <TabBot />
                </TabsContent>
                <TabsContent value="sesion">
                  <TabSesion />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
