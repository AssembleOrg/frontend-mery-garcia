'use client';

import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import ClientesTab from '@/components/clientes/ClientesTab';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Clientes' },
];

export default function ClientesPage() {
  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Gestión de Clientes" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-2xl font-bold text-[#4a3540]">
                  Lista de Clientes
                </h1>
                <p className="text-[#6b4c57]">
                  Gestiona tu base de clientes y sus señas
                </p>
              </div>

              {/* Usar el componente ClientesTab que ya tiene toda la lógica */}
              <ClientesTab />
            </div>
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
