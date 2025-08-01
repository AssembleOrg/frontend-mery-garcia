'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  Calculator,
  Percent,
} from 'lucide-react';
import { useRecordsStore } from '@/features/records/store/recordsStore';
import Spinner from '@/components/common/Spinner';
import ClientOnly from '@/components/common/ClientOnly';
import SummaryCardDual from '@/components/common/SummaryCardDual';
import SummaryCardCount from '@/components/common/SummaryCardCount';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatARSNative } from '@/lib/utils';
import useComandaStore from '@/features/comandas/store/comandaStore';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Resumen' },
];

export default function CajaChicaResumenPage() {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [montoParcialUSD, setMontoParcialUSD] = useState<string>('');
  const [montoParcialARS, setMontoParcialARS] = useState<string>('');
  const [mensaje, setMensaje] = useState<{
    tipo: 'success' | 'warning';
    texto: string;
  } | null>(null);

  const [resumen, setResumen] = useState<{
    totalCompletados: number;
    totalPendientes: number;
    montoNetoUSD: number;
    montoNetoARS: number;
    montoDisponibleTrasladoUSD: number;
    montoDisponibleTrasladoARS: number;
    totalIngresosUSD: number;
    totalIngresosARS: number;
    totalEgresosUSD: number;
    totalEgresosARS: number;
  } | null>(null);

  const {getResumen} = useComandaStore()

  useEffect(() => {
    const fetchResumen = async () => {
      const resumen = await getResumen();
      setResumen(resumen);
    };
    fetchResumen();
  }, [getResumen]);

  const handleMontoParcialUSDChange = (value: string) => {
    // Solo permitir números y punto decimal
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setMontoParcialUSD(value);
    }
  };

  const handleMontoParcialARSChange = (value: string) => {
    // Solo permitir números y punto decimal
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setMontoParcialARS(value);
    }
  };

 
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        <StandardPageBanner title="Resumen Caja 1" />
        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
        <ClientOnly>
          <StandardBreadcrumbs items={breadcrumbItems} />
          <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
              <Card className="border border-[#f9bbc4]/30 bg-white/90">
                <CardHeader>
                  <CardTitle>Seleccionar rango de fechas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    accentColor="#f9bbc4"
                  />
                  {resumen && (
                    <div className="space-y-6">
                      {/* Estados de Comandas */}
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Estado de Comandas
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <SummaryCardCount
                            title="Validadas"
                            count={resumen.totalCompletados}
                            icon="✅"
                            valueClassName="text-green-700"
                          />
                          <SummaryCardCount
                            title="Pendientes"
                            count={resumen.totalPendientes}
                            icon="⏳"
                            valueClassName="text-yellow-600"
                          />
                        </div>
                      </div>

                      {/* Separador visual */}
                      <div className="my-6 border-t border-gray-200"></div>

                      {/* Resumen Financiero */}
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                          <ArrowRight className="h-5 w-5 text-blue-600" />
                          Resumen Financiero
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <SummaryCardDual
                            title="Total Ingresos"
                            totalUSD={resumen.totalIngresosUSD || 0}
                            totalARS={resumen.totalIngresosARS || 0}
                            showTransactionCount={false}
                            valueClassName="text-green-700"
                          />
                          <SummaryCardDual
                            title="Total Egresos"
                            totalUSD={resumen.totalEgresosUSD || 0}
                            totalARS={resumen.totalEgresosARS || 0}
                            showTransactionCount={false}
                            valueClassName="text-red-700"
                          />
                          <SummaryCardDual
                            title="Balance Neto"
                            totalUSD={resumen.montoNetoUSD || 0}
                            totalARS={resumen.montoNetoARS || 0}
                            showTransactionCount={false}
                            valueClassName={
                              (resumen.montoNetoUSD || 0) +
                                (resumen.montoNetoARS || 0) >=
                              0
                                ? 'text-green-700'
                                : 'text-red-700'
                            }
                          />
                        </div>
                      </div>

                      {/* Mostrar configuración de traspaso siempre que haya un resumen */}
                      <>
                        <div className="my-6 border-t border-gray-200"></div>
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Calculator className="h-5 w-5 text-purple-600" />
                            Configuración de Traspaso
                          </h3>

                          <div className="space-y-4">
                            <SummaryCardDual
                              title="Monto Disponible para Traslado"
                              totalUSD={resumen.montoDisponibleTrasladoUSD || 0}
                              totalARS={resumen.montoDisponibleTrasladoARS || 0}
                              showTransactionCount={false}
                              valueClassName="text-blue-700"
                            />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="montoParcialUSD"
                                  className="text-sm font-medium"
                                >
                                  Monto Parcial USD (opcional)
                                </Label>
                                <Input
                                  id="montoParcialUSD"
                                  type="text"
                                  placeholder="Ingrese monto USD"
                                  value={montoParcialUSD}
                                  onChange={(e) =>
                                    handleMontoParcialUSDChange(e.target.value)
                                  }
                                  className="border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
                                />
                                <p className="text-xs text-gray-500">
                                  Máximo: $
                                  {(
                                    resumen.montoDisponibleTrasladoUSD || 0
                                  ).toFixed(2)}{' '}
                                  USD
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor="montoParcialARS"
                                  className="text-sm font-medium"
                                >
                                  Monto Parcial ARS (opcional)
                                </Label>
                                <Input
                                  id="montoParcialARS"
                                  type="text"
                                  placeholder="Ingrese monto ARS"
                                  value={montoParcialARS}
                                  onChange={(e) =>
                                    handleMontoParcialARSChange(e.target.value)
                                  }
                                  className="border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
                                />
                                <p className="text-xs text-gray-500">
                                  Máximo: $
                                  {(
                                    resumen.montoDisponibleTrasladoARS || 0
                                  ).toFixed(2)}{' '}
                                  ARS
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      disabled={!dateRange?.from || loading}
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d4869c] sm:w-auto"
                    >
                      {loading ? (
                        <Spinner size={4} />
                      ) : montoParcialUSD || montoParcialARS ? (
                        'Trasladar Monto Parcial'
                      ) : (
                        'Trasladar Comandas Completadas'
                      )}
                    </Button>
                  </div>

                  {mensaje && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                      {mensaje.tipo === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>{mensaje.texto}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </ClientOnly>
      </div>

      {/* Modal de confirmación */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Traspaso</DialogTitle>
            <DialogDescription>
              {montoParcialUSD || montoParcialARS
                ? '¿Estás seguro de que deseas realizar este traspaso parcial?'
                : '¿Estás seguro de que deseas trasladar las comandas completadas a Caja Grande?'}
            </DialogDescription>
          </DialogHeader>

          {resumen && (
            <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  <strong>Comandas a trasladar:</strong>{' '}
                  <span className="font-semibold text-green-700">
                    {resumen.totalCompletados} completadas
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  <strong>Comandas que permanecerán:</strong>{' '}
                  <span className="font-semibold text-orange-600">
                    {resumen.totalPendientes} pendientes
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>Monto a trasladar:</strong>
                </span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    USD:
                  </span>
                  <span className="text-sm font-semibold text-blue-700">
                    {formatUSD(
                      (montoParcialUSD
                        ? parseFloat(montoParcialUSD)
                        : resumen.montoDisponibleTrasladoUSD) || 0
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    ARS:
                  </span>
                  <span className="text-sm font-semibold text-blue-700">
                    {formatARSFromNative(
                      (montoParcialARS
                        ? parseFloat(montoParcialARS)
                        : resumen.montoDisponibleTrasladoARS) || 0
                    )}
                  </span>
                </div>
              </div>
              {(montoParcialUSD || montoParcialARS) && (
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">
                    <strong>Residual en Caja Chica:</strong>
                  </span>
                </div>
              )}
              {(montoParcialUSD || montoParcialARS) && (
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      USD:
                    </span>
                    <span className="text-sm font-semibold text-orange-700">
                      {formatUSD(
                        (resumen.montoDisponibleTrasladoUSD || 0) -
                          (parseFloat(montoParcialUSD) || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      ARS:
                    </span>
                    <span className="text-sm font-semibold text-orange-700">
                      {formatARSFromNative(
                        (resumen.montoDisponibleTrasladoARS || 0) -
                          (parseFloat(montoParcialARS) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="border-gray-300 text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              // onClick={handleTrasladar}
              disabled={loading}
              className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white transition-all duration-200 hover:from-[#e292a3] hover:to-[#d4869c] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Spinner size={4} /> : 'Confirmar Traspaso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
