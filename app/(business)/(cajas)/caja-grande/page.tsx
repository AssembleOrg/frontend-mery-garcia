'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import AdminOnly from '@/components/auth/AdminOnly';
import SummaryCard from '@/components/common/SummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientOnly from '@/components/common/ClientOnly';

import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useRecordsStore } from '@/features/records/store/recordsStore';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Grande' },
];

export default function CajaGrandePage() {
  const { user, isAdmin, isAuthenticated } = useAuth();

  //DEBUG
  console.log('🔍 DEBUG Caja Grande:');
  console.log('- isAuthenticated:', isAuthenticated);
  console.log('- user:', user);
  console.log('- user.rol:', user?.rol);
  console.log('- isAdmin:', isAdmin);
  console.log('- localStorage user:', localStorage.getItem('user'));

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
    <MainLayout>
      <AdminOnly>
        <div className="space-y-6">
          <StandardPageBanner title="Caja Grande" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <ClientOnly>
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

            <Card>
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
                  {/* Aquí irán las funcionalidades específicas de Caja Grande */}
                </div>
              </CardContent>
            </Card>
          </ClientOnly>
        </div>
      </AdminOnly>
    </MainLayout>
  );
}
