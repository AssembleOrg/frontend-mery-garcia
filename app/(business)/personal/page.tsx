'use client';

import { useState } from 'react';
import { Users, UserCheck } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PersonalTab from '@/components/personal/PersonalTab';
import ClientesTab from '@/components/clientes/ClientesTab';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Personal' },
];

export default function PersonalPage() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Gestión de Personal y Clientes" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-2xl font-bold text-[#4a3540]">
                  Gestión de Personal y Clientes
                </h1>
                <p className="text-[#6b4c57]">
                  Administra tu equipo de trabajo y base de clientes
                </p>
              </div>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="mb-6 flex justify-center">
                  <TabsList className="grid w-fit grid-cols-2 border border-[#f9bbc4]/30 bg-white/80">
                    <TabsTrigger
                      value="personal"
                      className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="clientes"
                      className="flex items-center gap-2 data-[state=active]:bg-[#f9bbc4] data-[state=active]:text-white"
                    >
                      <UserCheck className="h-4 w-4" />
                      Clientes
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="personal" className="mt-0">
                  <PersonalTab />
                </TabsContent>

                <TabsContent value="clientes" className="mt-0">
                  <ClientesTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
