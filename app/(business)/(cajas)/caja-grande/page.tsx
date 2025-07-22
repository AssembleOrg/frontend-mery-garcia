'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import SummaryCard from '@/components/common/SummaryCard';
import SummaryCardCount from '@/components/common/SummaryCardCount';
import ResumenCajaGrande from '@/components/cajas/ResumenCajaGrande';
import ModalMovimientoSimple from '@/components/cajas/ModalMovimientoSimple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useRecordsStore } from '@/features/records/store/recordsStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatDate } from '@/lib/utils';
import {
  BarChart3,
  ArrowRight,
  Shield,
  Eye,
  Calendar,
  Download,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Grande' },
];

export default function CajaGrandePage() {
  const { comandas } = useComandaStore();
  const { traspasos } = useRecordsStore();
  const { formatUSD } = useCurrencyConverter();

  // Estado para modal de movimientos manuales
  const [showModalMovimiento, setShowModalMovimiento] = useState(false);

  // Hook para transacciones con funcionalidad de exportación
  const { exportToCSV, exportToPDF } = useTransactions({
    type: 'all',
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    },
  });

  const comandasValidadas = comandas.filter(
    (c) => c.estadoValidacion === 'validado'
  );

  const resumenCaja = {
    totalIngresos: comandasValidadas
      .filter((c) => c.tipo === 'ingreso')
      .reduce((sum, c) => sum + c.totalFinal, 0),
    totalEgresos: comandasValidadas
      .filter((c) => c.tipo === 'egreso')
      .reduce((sum, c) => sum + c.totalFinal, 0),
    saldoNeto: comandasValidadas.reduce((sum, c) => {
      return c.tipo === 'ingreso' ? sum + c.totalFinal : sum - c.totalFinal;
    }, 0),
    cantidadComandas: comandasValidadas.length,
  };

  const ultimoTraspaso = traspasos[0];

  // Calcular resumen de métodos de pago del último traspaso
  const resumenMetodosPagoUltimoTraspaso = ultimoTraspaso
    ? (() => {
        const comandasDelTraspaso = comandasValidadas.filter((c) =>
          ultimoTraspaso.comandasTraspasadas.includes(c.id)
        );

        const resumen = comandasDelTraspaso.reduce(
          (acc, comanda) => {
            if (comanda.metodosPago) {
              comanda.metodosPago.forEach((metodo) => {
                acc[metodo.tipo] = (acc[metodo.tipo] || 0) + metodo.monto;
              });
            }
            return acc;
          },
          {} as Record<string, number>
        );

        return resumen;
      })()
    : {};

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#fef7f0] to-[#fdf2f8]">
        <StandardPageBanner title="Caja Grande" />

        <ManagerOrAdminOnly>
          <ClientOnly>
            <div className="container mx-auto px-4 py-6">
              <div className="mx-auto max-w-7xl">
                <StandardBreadcrumbs items={breadcrumbItems} />

                {/* Resumen de Caja */}
                <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard
                    title="Total Ingresos"
                    totalUSD={resumenCaja.totalIngresos}
                  />
                  <SummaryCard
                    title="Total Egresos"
                    totalUSD={resumenCaja.totalEgresos}
                  />
                  <SummaryCard
                    title="Saldo Neto"
                    totalUSD={resumenCaja.saldoNeto}
                  />
                  <SummaryCardCount
                    title="Comandas Validadas"
                    count={resumenCaja.cantidadComandas}
                  />
                </div>

                {/* Gestión de Caja Grande */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Información del último traspaso */}
                  <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
                        <Calendar className="h-5 w-5" />
                        Último Traspaso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {ultimoTraspaso ? (
                        <div className="space-y-4">
                          {/* Información básica */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Fecha</p>
                              <p className="font-medium">
                                {formatDate(ultimoTraspaso.fechaTraspaso)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Comandas</p>
                              <p className="font-medium">
                                {ultimoTraspaso.comandasTraspasadas.length}
                              </p>
                            </div>
                          </div>

                          {/* Rango de fechas */}
                          <div>
                            <p className="text-sm text-gray-600">
                              Rango de fechas
                            </p>
                            <p className="font-medium">
                              {formatDate(ultimoTraspaso.rangoFechas.desde)} -{' '}
                              {formatDate(ultimoTraspaso.rangoFechas.hasta)}
                            </p>
                          </div>

                          {/* Montos */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Monto Total
                              </p>
                              <p className="font-medium text-green-600">
                                {formatUSD(ultimoTraspaso.montoTotal)}
                              </p>
                            </div>
                            {ultimoTraspaso.esTraspasoParcial &&
                              ultimoTraspaso.montoParcial && (
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Monto Parcial
                                  </p>
                                  <p className="font-medium text-blue-600">
                                    {formatUSD(ultimoTraspaso.montoParcial)}
                                  </p>
                                </div>
                              )}
                          </div>

                          {/* Métodos de pago */}
                          {Object.keys(resumenMetodosPagoUltimoTraspaso)
                            .length > 0 && (
                            <div>
                              <p className="mb-2 text-sm text-gray-600">
                                Métodos de pago
                              </p>
                              <div className="space-y-1">
                                {Object.entries(
                                  resumenMetodosPagoUltimoTraspaso
                                ).map(([metodo, monto]) => (
                                  <div
                                    key={metodo}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="capitalize">
                                      {metodo}:
                                    </span>
                                    <span className="font-medium">
                                      {formatUSD(monto)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Administrador */}
                          <div>
                            <p className="text-sm text-gray-600">
                              Realizado por
                            </p>
                            <p className="font-medium">
                              {ultimoTraspaso.adminQueTraspaso}
                            </p>
                          </div>

                          {/* Observaciones */}
                          {ultimoTraspaso.observaciones && (
                            <div>
                              <p className="text-sm text-gray-600">
                                Observaciones
                              </p>
                              <p className="text-sm">
                                {ultimoTraspaso.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                          <p>No se han realizado traspasos</p>
                          <p className="text-sm">
                            Los traspasos aparecerán aquí una vez realizados
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Acciones rápidas */}
                  <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
                        <BarChart3 className="h-5 w-5" />
                        Gestión de Caja Grande
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Movimientos Manuales */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            💰 Movimientos Manuales
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowModalMovimiento(true)}
                            className="flex w-full items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            ✨ Gestionar Movimientos
                          </Button>
                        </div>

                        {/* Controles de Exportación */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            Exportar Datos
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportToCSV}
                              className="flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportToPDF}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3">
                          <Link href="/caja-grande/comandas">
                            <Button className="w-full justify-between bg-[#6b4c57] text-white hover:bg-[#5a3f4a]">
                              <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Ver Comandas Validadas
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href="/caja-grande/auditoria">
                            <Button className="mt-2 w-full justify-between bg-[#8b5a6b] text-white hover:bg-[#7a4f5e]">
                              <span className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Auditoría del Sistema
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Resumen Detallado de Caja Grande */}
                <div className="mt-8">
                  <ResumenCajaGrande
                    comandasValidadas={comandasValidadas}
                    traspasos={traspasos}
                  />
                </div>
              </div>
            </div>
          </ClientOnly>
        </ManagerOrAdminOnly>

        {/* Modal de Movimientos Manuales */}
        <ModalMovimientoSimple
          abierto={showModalMovimiento}
          onCerrar={() => setShowModalMovimiento(false)}
          cajaActual="caja_2"
          onExito={() => {
            // Aquí podrías refrescar datos si es necesario
            console.log('Movimiento registrado exitosamente');
          }}
        />
      </div>
    </MainLayout>
  );
}
