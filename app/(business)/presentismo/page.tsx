'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Radio, Repeat } from 'lucide-react';
import TabHoy from '@/components/presentismo/TabHoy';
import TabSemana from '@/components/presentismo/TabSemana';
import TabPatron from '@/components/presentismo/TabPatron';

const breadcrumbItems = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Presentismo' },
];

export default function PresentismoPage() {
  const [tab, setTab] = useState('hoy');

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Presentismo" />
          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <ClientOnly>
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-3 border border-[#f9bbc4]/30 bg-white/80 sm:w-fit">
                    <TabsTrigger
                      value="hoy"
                      className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
                    >
                      <Radio className="h-4 w-4" />
                      Hoy
                    </TabsTrigger>
                    <TabsTrigger
                      value="semana"
                      className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Semana
                    </TabsTrigger>
                    <TabsTrigger
                      value="patron"
                      className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
                    >
                      <Repeat className="h-4 w-4" />
                      Horario fijo
                    </TabsTrigger>
                  </TabsList>

                  {/* Cada pestaña se monta sólo cuando se abre: así el stream de
                      eventos de "Hoy" no queda abierto mientras se editan turnos. */}
                  <TabsContent value="hoy" className="mt-0">
                    {tab === 'hoy' && <TabHoy />}
                  </TabsContent>
                  <TabsContent value="semana" className="mt-0">
                    {tab === 'semana' && <TabSemana />}
                  </TabsContent>
                  <TabsContent value="patron" className="mt-0">
                    {tab === 'patron' && <TabPatron />}
                  </TabsContent>
                </Tabs>
              </ClientOnly>
            </div>
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
