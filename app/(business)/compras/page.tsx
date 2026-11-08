'use client';

import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ClientOnly from '@/components/common/ClientOnly';
import AdminOnly from '@/components/auth/AdminOnly';
import Compras from '@/components/compras/Compras';

const breadcrumbItems = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Compras' },
];

export default function ComprasPage() {
  return (
    <AdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Compras" />
          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
              <ClientOnly>
                <Compras />
              </ClientOnly>
            </div>
          </div>
        </div>
      </MainLayout>
    </AdminOnly>
  );
}
