'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import SummaryCardDual from '@/components/common/SummaryCardDual';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Grande' },
];

export default function CajaGrandePage() {
  const { comandas } = useComandaStore();
  const { traspasos } = useRecordsStore();
  const { formatUSD, formatARS, formatARSFromNative } = useCurrencyConverter();

  // Estado para modal de movimientos manuales
  const [showModalMovimiento, setShowModalMovimiento] = useState(false);

  // Estado para filtro de fechas
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Hook para transacciones con funcionalidad de exportación
  const { exportToCSV, exportToPDF } = useTransactions({
    type: 'all',
    dateRange: dateRange || {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    },
    validatedOnly: true,
  });

  // Hooks para estadísticas de caja-grande (solo comandas validadas)
  const { statistics: ingresoStats } = useTransactions({
    type: 'ingreso',
    validatedOnly: true,
  });

  const { statistics: egresoStats } = useTransactions({
    type: 'egreso',
    validatedOnly: true,
  });

  const { statistics: allStats } = useTransactions({
    type: 'all',
    validatedOnly: true,
  });

  // Filtrar comandas validadas con lógica específica para caja-grande
  const comandasValidadas = comandas.filter((c) => {
    if (c.estadoValidacion !== 'validado') return false;

    // Filtro especial para movimientos manuales
    if (c.cliente.nombre === 'Movimiento Manual') {
      const metadata = c.metadata;
      if (!metadata) return false;

      // Solo mostrar en caja-grande:
      // 1. Ingresos/egresos directos a/desde caja-grande
      if (
        (c.tipo === 'ingreso' &&
          metadata.cajaDestino === 'caja_2' &&
          metadata.cajaOrigen === 'caja_2') ||
        (c.tipo === 'egreso' &&
          metadata.cajaOrigen === 'caja_2' &&
          metadata.cajaDestino === 'caja_2')
      ) {
        return true;
      }

      // 2. Transferencias desde caja-chica hacia caja-grande (solo ingresos)
      if (
        c.tipo === 'ingreso' &&
        metadata.cajaOrigen === 'caja_1' &&
        metadata.cajaDestino === 'caja_2'
      ) {
        return true;
      }

      // Excluir transferencias desde caja-grande hacia caja-chica
      return false;
    }

    // Transacciones normales (no manuales) se incluyen siempre
    return true;
  });

  // Calcular resumen basado en comandas filtradas específicamente para caja-grande
  const resumenCaja = useMemo(() => {
    const ingresos = comandasValidadas.filter((c) => c.tipo === 'ingreso');
    const egresos = comandasValidadas.filter((c) => c.tipo === 'egreso');

    const calcularTotalesPorMonedaConResiduales = (
      comandas: typeof comandasValidadas
    ) => {
      const totales = { totalUSD: 0, totalARS: 0 };
      const traspasosCalculados = new Set<string>();

      comandas.forEach((comanda) => {
        // Para movimientos manuales, usar el monto completo
        if (comanda.cliente.nombre === 'Movimiento Manual') {
          comanda.metodosPago.forEach((metodo) => {
            if (metodo.moneda === 'USD') {
              totales.totalUSD += metodo.monto;
            } else if (metodo.moneda === 'ARS') {
              totales.totalARS += metodo.monto;
            }
          });
          return;
        }

        // Para comandas de traspasos, usar el monto transferido directo
        const traspasoDeComanda = traspasos.find((t) =>
          t.comandasTraspasadas.includes(comanda.id)
        );

        if (
          traspasoDeComanda &&
          !traspasosCalculados.has(traspasoDeComanda.fechaTraspaso)
        ) {
          // Marcar este traspaso como calculado para evitar duplicados
          traspasosCalculados.add(traspasoDeComanda.fechaTraspaso);

          if (traspasoDeComanda.esTraspasoParcial) {
            // Si es traspaso parcial, usar montoParcial (monto real transferido)
            totales.totalUSD += traspasoDeComanda.montoParcialUSD || 0;
            totales.totalARS += traspasoDeComanda.montoParcialARS || 0;
          } else {
            // Si es traspaso completo, usar montoTotal
            totales.totalUSD += traspasoDeComanda.montoTotalUSD || 0;
            totales.totalARS += traspasoDeComanda.montoTotalARS || 0;
          }
        }
      });

      return totales;
    };

    const ingresosTotal = calcularTotalesPorMonedaConResiduales(ingresos);
    const egresosTotal = calcularTotalesPorMonedaConResiduales(egresos);

    return {
      totalIngresosUSD: ingresosTotal.totalUSD,
      totalIngresosARS: ingresosTotal.totalARS,
      totalEgresosUSD: egresosTotal.totalUSD,
      totalEgresosARS: egresosTotal.totalARS,
      cantidadComandas: comandasValidadas.length,
      saldoNetoUSD: ingresosTotal.totalUSD - egresosTotal.totalUSD,
      saldoNetoARS: ingresosTotal.totalARS - egresosTotal.totalARS,
    };
  }, [comandasValidadas, traspasos]);

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
                const key = `${metodo.tipo}_${metodo.moneda}`;
                acc[key] = (acc[key] || 0) + metodo.monto;
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
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        <StandardPageBanner title="Caja Grande" />

        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

        <ManagerOrAdminOnly>
          <ClientOnly>
            <StandardBreadcrumbs items={breadcrumbItems} />

            <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="container mx-auto py-6">
                  {/* Resumen de Caja */}
                  <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCardDual
                      title="Total Ingresos"
                      totalUSD={resumenCaja.totalIngresosUSD}
                      totalARS={resumenCaja.totalIngresosARS}
                      showTransactionCount={false}
                      valueClassName="text-green-700"
                    />
                    <SummaryCardDual
                      title="Total Egresos"
                      totalUSD={resumenCaja.totalEgresosUSD}
                      totalARS={resumenCaja.totalEgresosARS}
                      showTransactionCount={false}
                      valueClassName="text-red-700"
                    />
                    <SummaryCardDual
                      title="Saldo Neto"
                      totalUSD={resumenCaja.saldoNetoUSD}
                      totalARS={resumenCaja.saldoNetoARS}
                      showTransactionCount={false}
                      valueClassName={
                        resumenCaja.saldoNetoUSD + resumenCaja.saldoNetoARS >= 0
                          ? 'text-green-700'
                          : 'text-red-700'
                      }
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
                                <p className="text-sm text-gray-600">
                                  Comandas
                                </p>
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
                            <div>
                              <p className="mb-2 text-sm text-gray-600">
                                Monto Total
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>USD:</span>
                                  <span className="font-medium text-green-600">
                                    {formatUSD(
                                      ultimoTraspaso.montoTotalUSD || 0
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>ARS:</span>
                                  <span className="font-medium text-green-600">
                                    {formatARSFromNative(
                                      ultimoTraspaso.montoTotalARS || 0
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Residual (solo si es traspaso parcial) */}
                            {ultimoTraspaso.esTraspasoParcial &&
                              ((ultimoTraspaso.montoResidualUSD || 0) > 0 ||
                                (ultimoTraspaso.montoResidualARS || 0) > 0) && (
                                <div>
                                  <p className="mb-2 text-sm text-gray-600">
                                    Residual en Caja Chica
                                  </p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>USD:</span>
                                      <span className="font-medium text-orange-600">
                                        {formatUSD(
                                          ultimoTraspaso.montoResidualUSD || 0
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>ARS:</span>
                                      <span className="font-medium text-orange-600">
                                        {formatARSFromNative(
                                          ultimoTraspaso.montoResidualARS || 0
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    ⚠️ Monto que quedó en Caja Chica del
                                    traspaso parcial
                                  </p>
                                </div>
                              )}

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
                                  ).map(([metodoMoneda, monto]) => {
                                    const [metodo, moneda] =
                                      metodoMoneda.split('_');
                                    const metodoNombre =
                                      {
                                        efectivo: 'Efectivo',
                                        tarjeta: 'Tarjeta',
                                        transferencia: 'Transferencia',
                                        giftcard: 'Gift Card',
                                        qr: 'QR',
                                        mixto: 'Mixto',
                                        precio_lista: 'Precio de Lista',
                                      }[metodo] || metodo;

                                    return (
                                      <div
                                        key={metodoMoneda}
                                        className="flex justify-between text-sm"
                                      >
                                        <span className="capitalize">
                                          {metodoNombre} {moneda}:
                                        </span>
                                        <span className="font-medium">
                                          {moneda === 'USD'
                                            ? formatUSD(monto)
                                            : formatARSFromNative(monto)}
                                        </span>
                                      </div>
                                    );
                                  })}
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
                          {/* Filtro de fechas para exportación */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              📅 Período para exportar
                            </p>
                            <DateRangePicker
                              dateRange={dateRange}
                              onDateRangeChange={setDateRange}
                              placeholder="Seleccionar período"
                              accentColor="#f9bbc4"
                            />
                          </div>

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
          }}
        />
      </div>
    </MainLayout>
  );
}
