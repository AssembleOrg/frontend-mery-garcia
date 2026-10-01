'use client';

import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import Presentismo from '@/components/presentismo/Presentismo';

const breadcrumbItems = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Presentismo' },
];

export default function PresentismoPage() {
  return (
    <ManagerOrAdminOnly permitirPresentismo>
      <MainLayout>
        <div className="min-h-screen bg-[#fffafb]">
          <StandardPageBanner title="Presentismo" />
          <StandardBreadcrumbs items={breadcrumbItems} />
          <div className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8">
            <ClientOnly>
              <Presentismo />
            </ClientOnly>
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
