'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import SummaryCardDual from '@/components/common/SummaryCardDual';
import SummaryCardCount from '@/components/common/SummaryCardCount';
import ResumenCajaGrande from '@/components/cajas/ResumenCajaGrande';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { useRecordsStore } from '@/features/records/store/recordsStore';
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
import {
  ComandaNew,
  EstadoDeComandaNew,
  TipoDeComandaNew,
  MovimientoNew
} from '@/services/unidadNegocio.service';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { movimientoService } from '@/services/movimiento.service';
import { useMovimientosStore } from '@/features/movimientos';
import ModalMovimientosManual from '@/components/cajas/ModalMovimientosManual';
import { useAuthStore } from '@/features/auth/store/authStore';
import ModalVerMovimientos from '@/components/cajas/ModalVerMovimientos';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Grande' },
];

// Interfaz para el resumen de métodos de pago
interface ResumenMetodosPago {
  [key: string]: number;
}

// Interfaz para el resumen de caja
interface ResumenCaja {
  totalIngresosUSD: number;
  totalIngresosARS: number;
  totalEgresosUSD: number;
  totalEgresosARS: number;
  cantidadComandas: number;
  saldoNetoUSD: number;
  saldoNetoARS: number;
}


export default function CajaGrandePage() {
  const {
    obtenerMovimientosPaginados,
    movimientosPaginados,
    exportarMovimientosCSV,
    exportarMovimientosPDF,
  } = useMovimientosStore()
  const { formatUSD, formatARS, formatARSFromNative } = useCurrencyConverter();

  const {
    user
  } = useAuthStore();

  // Estado para modal de movimientos manuales
  const [showModalMovimiento, setShowModalMovimiento] = useState(false);
  // Estado para modal de ver movimientos
  const [showModalVerMovimientos, setShowModalVerMovimientos] = useState(false);

  // Estado para filtro de fechas
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [ultimoTraspaso, setUltimoTraspaso] = useState<MovimientoNew | undefined>();

  // Cargar comandas traspasadas al montar el componente
  useEffect(() => {
    obtenerMovimientosPaginados({
      fechaDesde: dateRange?.from?.toISOString() || '',
      fechaHasta: dateRange?.to?.toISOString() || '',
    });
  }, [obtenerMovimientosPaginados, dateRange]);

  // Obtener comandas desde el store
  const comandas: ComandaNew[] = [];

  // Filtrar comandas traspasadas con lógica específica para caja-grande
  const comandasValidadas = useMemo(() => {
    return comandas.filter((c: ComandaNew) => {
      if (c.estadoDeComanda !== EstadoDeComandaNew.VALIDADO) return false;

      // Filtro especial para movimientos manuales
      if (c.cliente?.nombre === 'Movimiento Manual') {
        // Aquí puedes agregar lógica específica para movimientos manuales
        // basada en metadatos u otros campos
        return true;
      }

      // Transacciones normales (no manuales) se incluyen siempre
      return true;
    });
  }, [comandas]);

  // Hook para transacciones con funcionalidad de exportación
  const resumenCajaNew: {
    totalArs: number;
    totalUsd: number;
    residualArs: number;
    residualUsd: number;
    saldoNetoARS: number;
    saldoNetoUSD: number;
    egresosArs: number;
    egresosUsd: number;
  } = useMemo(() => {
    const totalArs = movimientosPaginados.data.reduce((acc, mov) => {
      if (mov.esIngreso) {
        return acc + (Number(mov.montoARS) || 0);
      }
      return acc;
    }, 0);
    const totalUsd = movimientosPaginados.data.reduce((acc, mov) => {
      if (mov.esIngreso) {
        return acc + (Number(mov.montoUSD) || 0);
      }
      return acc;
    }, 0);
    const residualArs = movimientosPaginados.data.reduce((acc, mov) => {
      if (mov.esIngreso) {
        return acc + (Number(mov.residualARS) || 0);
      }
      return acc;
    }, 0);
    const residualUsd = movimientosPaginados.data.reduce((acc, mov) => {
      if (mov.esIngreso) {
        return acc + (Number(mov.residualUSD) || 0);
      }
      return acc;
    }, 0);

    const egresosArs = movimientosPaginados.data.reduce((acc, mov) => {
      if (!mov.esIngreso) {
        return acc + (Number(mov.montoARS) || 0);
      }
      return acc;
    }, 0);

    const egresosUsd = movimientosPaginados.data.reduce((acc, mov) => {
      if (!mov.esIngreso) {
        return acc + (Number(mov.montoUSD) || 0);
      }
      return acc;
    }, 0);


    const saldoNetoARS = totalArs - residualArs - egresosArs;
    const saldoNetoUSD = totalUsd - residualUsd - egresosUsd;

    return {
      totalArs,
      totalUsd,
      residualArs,
      residualUsd,
      saldoNetoARS,
      saldoNetoUSD,
      egresosArs,
      egresosUsd
    };
  }, [movimientosPaginados]);

  useEffect(() => {
    const ultimoTraspaso = movimientosPaginados.data.length > 0 ? movimientosPaginados.data[0] : {
      id: '',
      montoARS: 0,
      montoUSD: 0,
      residualARS: 0,
      residualUSD: 0,
      comentario: '',
      esIngreso: false,
      personalId: '',
      comandasValidadasIds: [''],
      comandas: [],
    };
    setUltimoTraspaso(ultimoTraspaso as MovimientoNew);
  }, [movimientosPaginados]);

  const manejarGuardarMovimiento = async (movimiento: {
    tipo: 'ingreso' | 'egreso';
    montoUSD: number;
    montoARS: number;
    comentario: string;
  }) => {
    try {
      // Crear el objeto de movimiento según tu estructura de datos
      const nuevoMovimiento = {
        montoUSD: movimiento.montoUSD,
        montoARS: movimiento.montoARS,
        residualUSD: 0, // Para movimientos manuales normalmente no hay residual
        residualARS: 0,
        esIngreso: movimiento.tipo === 'ingreso',
        comentario: movimiento.comentario,
        personalId: user?.id,
        comandasValidadasIds: [], // Array vacío para movimientos manuales
        // Agregar otros campos requeridos según tu DTO
      };

      // Llamar al servicio para crear el movimiento
      await movimientoService.crearMovimiento(nuevoMovimiento);

      // Recargar los datos
      await obtenerMovimientosPaginados({
        fechaDesde: dateRange?.from?.toISOString() || '',
        fechaHasta: dateRange?.to?.toISOString() || '',
      });

      console.log('Movimiento registrado exitosamente');
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      throw error; // Re-lanzar el error para que el modal lo maneje
    }
  };

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
                      title="Total Movimiento"
                      totalUSD={resumenCajaNew.totalUsd}
                      totalARS={resumenCajaNew.totalArs}
                      showTransactionCount={false}
                      valueClassName="text-green-700"
                    />
                    <SummaryCardDual
                      title="Total Residual Caja 1"
                      totalUSD={resumenCajaNew.residualUsd}
                      totalARS={resumenCajaNew.residualArs}
                      showTransactionCount={false}
                      valueClassName="text-red-700"
                    />
                    <SummaryCardDual
                      title="Egresos"
                      totalUSD={resumenCajaNew.egresosUsd}
                      totalARS={resumenCajaNew.egresosArs}
                      showTransactionCount={false}
                      valueClassName="text-red-500"
                    />
                    <SummaryCardDual
                      title="Saldo Neto"
                      totalUSD={resumenCajaNew.saldoNetoUSD}
                      totalARS={resumenCajaNew.saldoNetoARS}
                      showTransactionCount={false}
                      // valueClassName={
                      //   resumenCajaNew.saldoNetoUSD + resumenCajaNew.saldoNetoARS >= 0
                      //     ? 'text-green-700'
                      //     : 'text-red-700'
                      // }
                    />
                    <SummaryCardCount
                      title="Cantidad de Movimientos"
                      count={movimientosPaginados.data.length}
                    />
                  </div>

                  {/* Gestión de Caja Grande */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Información del último traspaso */}
                    <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
                          <Calendar className="h-5 w-5" />
                          Último Movimiento
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
                                  {formatDate(ultimoTraspaso.createdAt)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Tipo</p>
                                <p className={`font-medium ${
                                  ultimoTraspaso.esIngreso 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {ultimoTraspaso.esIngreso ? '💰 Ingreso' : '💸 Egreso'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Comandas</p>
                                <p className="font-medium">
                                  {ultimoTraspaso?.comandas?.length || 0}
                                </p>
                              </div>
                            </div>

                            {/* Montos */}
                            <div>
                              <p className="mb-2 text-sm text-gray-600">
                                Monto Total
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>USD:</span>
                                  <span className={`font-medium ${
                                    ultimoTraspaso.esIngreso 
                                      ? 'text-green-600' 
                                      : 'text-red-600'
                                  }`}>
                                    {formatUSD(ultimoTraspaso.montoUSD)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>ARS:</span>
                                  <span className={`font-medium ${
                                    ultimoTraspaso.esIngreso 
                                      ? 'text-green-600' 
                                      : 'text-red-600'
                                  }`}>
                                    {formatARSFromNative(ultimoTraspaso.montoARS)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Residual (solo si es traspaso parcial) */}
                            {(ultimoTraspaso?.residualARS || ultimoTraspaso?.residualUSD) &&
                              ((ultimoTraspaso?.residualUSD || 0) > 0 || (ultimoTraspaso?.residualARS || 0) > 0) && (
                                <div>
                                  <p className="mb-2 text-sm text-gray-600">Residual en Caja Chica</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>USD:</span>
                                      <span className="font-medium text-orange-600">
                                        {formatUSD(ultimoTraspaso?.residualUSD || 0)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>ARS:</span>
                                      <span className="font-medium text-orange-600">
                                        {formatARSFromNative(ultimoTraspaso?.residualARS || 0)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    ⚠️ Monto que quedó en Caja Chica del traspaso parcial
                                  </p>
                                </div>
                              )}

                            {/* Administrador */}
                            <div>
                              <p className="text-sm text-gray-600">
                                Realizado por
                              </p>
                              <p className="font-medium">
                                {ultimoTraspaso.personal?.nombre}
                              </p>
                            </div>

                            {/* Observaciones */}
                            {ultimoTraspaso.comentario && (
                              <div>
                                <p className="text-sm text-gray-600">
                                  Observaciones
                                </p>
                                <p className="text-sm">
                                  {ultimoTraspaso.comentario}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-gray-500">
                            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                            <p>No se han realizado movimientos</p>
                            <p className="text-sm">
                              Los movimientos aparecerán aquí una vez realizados
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
                                onClick={exportarMovimientosCSV}
                                className="flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                CSV
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={exportarMovimientosPDF}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                PDF
                              </Button>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="space-y-3">
                            <Button 
                              onClick={() => setShowModalVerMovimientos(true)}
                              className="w-full justify-between bg-[#6b4c57] text-white hover:bg-[#5a3f4a]"
                            >
                              <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Ver Movimientos
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
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
                </div>
              </div>
            </div>
          </ClientOnly>
        </ManagerOrAdminOnly>

        {/* Modal de Movimientos Manuales */}
        <ModalMovimientosManual
          abierto={showModalMovimiento}
          onCerrar={() => setShowModalMovimiento(false)}
          onGuardar={manejarGuardarMovimiento}
        />

        {/* Modal de Ver Movimientos */}
        <ModalVerMovimientos
          isOpen={showModalVerMovimientos}
          onClose={() => setShowModalVerMovimientos(false)}
          movimientos={movimientosPaginados.data}
          onExportCSV={exportarMovimientosCSV}
          onExportPDF={exportarMovimientosPDF}
          title="Movimientos de la Caja Grande"
        />
      </div>
    </MainLayout>
  );
}
