'use client';

import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import AdminOnly from '@/components/auth/AdminOnly';
import SummaryCard from '@/components/common/SummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useRecordsStore } from '@/features/records/store/recordsStore';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Grande' },
];

export default function CajaGrandePage() {
  const { comandas } = useComandaStore();
  const { traspasos } = useRecordsStore();

  const comandasValidadas = comandas.filter(
    (c) => c.estadoValidacion === 'validado'
  );

  // Calcular resumen de Caja Grande
  const resumenCaja = {
    totalComandas: comandasValidadas.length,
    totalIngresos: comandasValidadas
      .filter((c) => c.tipo === 'ingreso')
      .reduce((sum, c) => sum + c.totalFinal, 0),
    totalEgresos: comandasValidadas
      .filter((c) => c.tipo === 'egreso')
      .reduce((sum, c) => sum + c.totalFinal, 0),
    saldoNeto: 0,
    ultimoTraspaso: traspasos[0]?.fechaTraspaso || null,
  };

  resumenCaja.saldoNeto = resumenCaja.totalIngresos - resumenCaja.totalEgresos;

  return (
    <ManagerOrAdminOnly excludeCaja2={true}>
      <MainLayout>
        <AdminOnly>
          <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
            <StandardPageBanner title="Caja Grande" />
            <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
            <StandardBreadcrumbs items={breadcrumbItems} />

            <ClientOnly>
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <SummaryCard
                      title="Balance Actual"
                      value={resumenCaja.saldoNeto}
                      format="currency"
                      valueClassName="text-[#4a3540]"
                    />
                    <SummaryCard
                      title="Ingresos del Día"
                      value={resumenCaja.totalIngresos}
                      format="currency"
                      valueClassName="text-green-700"
                    />
                    <SummaryCard
                      title="Egresos del Día"
                      value={resumenCaja.totalEgresos}
                      format="currency"
                      valueClassName="text-red-700"
                    />
                  </div>

                  <Card className="border border-[#f9bbc4]/30 bg-white/90">
                    <CardHeader>
                      <CardTitle>Gestión de Caja Grande</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-600">
                          Comandas validadas: {resumenCaja.totalComandas}
                        </p>
                        {resumenCaja.ultimoTraspaso && (
                          <p className="text-sm text-gray-500">
                            Último traspaso:{' '}
                            {new Date(
                              resumenCaja.ultimoTraspaso
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ClientOnly>
          </div>
        </AdminOnly>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
