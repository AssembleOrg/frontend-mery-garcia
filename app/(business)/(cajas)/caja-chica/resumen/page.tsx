'use client';

import { useState } from 'react';
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
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useRecordsStore } from '@/features/records/store/recordsStore';
import Spinner from '@/components/common/Spinner';
import ClientOnly from '@/components/common/ClientOnly';
import SummaryCard from '@/components/common/SummaryCard';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ComandaValidationService } from '@/services/comandaValidation.service';
import { formatUSD } from '@/lib/utils';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Resumen' },
];

export default function ResumenCajaChicaPage() {
  const { validarComandasParaTraspasoParcial, obtenerResumenConMontoParcial } =
    useComandaStore();
  const { registrarTraspaso } = useRecordsStore();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [montoParcial, setMontoParcial] = useState<string>('');
  const [mensaje, setMensaje] = useState<{
    tipo: 'success' | 'info';
    texto: string;
  } | null>(null);

  const resumen = dateRange?.from
    ? obtenerResumenConMontoParcial(
        dateRange.from,
        dateRange.to ?? dateRange.from
      )
    : null;

  const configuracionTraspaso =
    resumen && montoParcial
      ? ComandaValidationService.calcularConfiguracionTraspasoParcial(
          resumen.montoDisponibleParaTraslado,
          parseFloat(montoParcial) || 0
        )
      : null;

  const handleMontoParcialChange = (value: string) => {
    // Solo permitir números y punto decimal
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === '') {
      setMontoParcial(value);
    }
  };

  const handleTrasladar = async () => {
    if (!dateRange?.from || !resumen) return;

    const montoATraslado = montoParcial
      ? parseFloat(montoParcial) || 0
      : resumen.montoDisponibleParaTraslado;

    if (montoATraslado <= 0) {
      toast.error('El monto a trasladar debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      // Validar comandas para traspaso parcial
      const resultado = await validarComandasParaTraspasoParcial(
        dateRange.from,
        dateRange.to ?? dateRange.from,
        montoATraslado
      );

      // Para el registro del traspaso, usar la estructura correcta
      const fechaInicio = dateRange.from.toISOString().split('T')[0];
      const fechaFin = (dateRange.to ?? dateRange.from)
        .toISOString()
        .split('T')[0];

      const esTraspasoParcial =
        montoATraslado < resumen.montoDisponibleParaTraslado;

      // Registrar el traspaso con la estructura correcta de TraspasoInfo
      registrarTraspaso({
        fechaTraspaso: new Date().toISOString(),
        adminQueTraspaso: 'admin-actual', // Reemplazar con el usuario actual
        comandasTraspasadas: resultado.idsValidados,
        montoTotal: resultado.montoTrasladado,
        rangoFechas: {
          desde: fechaInicio,
          hasta: fechaFin,
        },
        observaciones: esTraspasoParcial
          ? `Traspaso parcial de ${resultado.montoTrasladado} (residual: ${resultado.montoResidual})`
          : `Traspaso completo del ${fechaInicio} al ${fechaFin}`,
        // campos para traspaso parcial
        montoParcial: esTraspasoParcial ? resultado.montoTrasladado : undefined,
        montoResidual: esTraspasoParcial ? resultado.montoResidual : undefined,
        esTraspasoParcial,
      });

      const mensajeExito = esTraspasoParcial
        ? `Traspaso parcial realizado exitosamente:
           • ${resultado.idsValidados.length} comandas trasladadas
           • Monto trasladado: ${formatUSD(resultado.montoTrasladado)}
           • Monto residual: ${formatUSD(resultado.montoResidual)}
           • Las comandas trasladadas ahora están en Caja Grande`
        : `Traspaso completo realizado exitosamente:
           • ${resultado.idsValidados.length} comandas trasladadas
           • Monto total: ${formatUSD(resultado.montoTrasladado)}
           • Caja Chica limpiada para el período seleccionado`;

      toast.success(mensajeExito);

      setMensaje({
        tipo: 'success',
        texto: esTraspasoParcial
          ? `Traspaso parcial realizado exitosamente. ${resultado.idsValidados.length} comandas trasladadas a Caja Grande.`
          : `Traspaso completo realizado. Caja Chica limpiada para el período ${fechaInicio} - ${fechaFin}.`,
      });

      // Limpiar formulario y cerrar modal
      setMontoParcial('');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error en traspaso:', error);
      toast.error('Error al realizar el traspaso');
      setMensaje({
        tipo: 'info',
        texto: 'Error al realizar el traspaso. Intente nuevamente.',
      });
    } finally {
      setLoading(false);
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
                          <SummaryCard
                            title="Completadas"
                            value={resumen.totalCompletados}
                            format="number"
                            valueClassName="text-green-700"
                          />
                          <SummaryCard
                            title="Pendientes"
                            value={resumen.totalPendientes}
                            format="number"
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
                          <SummaryCard
                            title="Total Ingresos"
                            value={resumen.totalIngresos}
                            format="currency"
                            dualCurrency={true}
                            isDualValue={true}
                            valueClassName="text-green-700"
                          />
                          <SummaryCard
                            title="Total Egresos"
                            value={resumen.totalEgresos}
                            format="currency"
                            dualCurrency={true}
                            isDualValue={true}
                            valueClassName="text-red-700"
                          />
                          <SummaryCard
                            title="Balance Neto"
                            value={resumen.montoNeto}
                            format="currency"
                            dualCurrency={true}
                            isDualValue={true}
                            valueClassName={
                              resumen.montoNeto >= 0
                                ? 'text-green-700'
                                : 'text-red-700'
                            }
                          />
                        </div>
                      </div>

                      {resumen.montoDisponibleParaTraslado > 0 && (
                        <>
                          <div className="my-6 border-t border-gray-200"></div>
                          <div>
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                              <Calculator className="h-5 w-5 text-purple-600" />
                              Configuración de Traspaso
                            </h3>

                            <div className="space-y-4">
                              <SummaryCard
                                title="Monto Disponible para Traslado"
                                value={resumen.montoDisponibleParaTraslado}
                                format="currency"
                                dualCurrency={true}
                                isDualValue={true}
                                valueClassName="text-blue-700"
                              />

                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="montoParcial"
                                    className="text-sm font-medium"
                                  >
                                    Monto Parcial a Trasladar (opcional)
                                  </Label>
                                  <Input
                                    id="montoParcial"
                                    type="text"
                                    placeholder="Ingrese monto o deje vacío para traslado completo"
                                    value={montoParcial}
                                    onChange={(e) =>
                                      handleMontoParcialChange(e.target.value)
                                    }
                                    className="border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Máximo:{' '}
                                    {new Intl.NumberFormat('es-AR', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(
                                      resumen.montoDisponibleParaTraslado
                                    )}
                                  </p>
                                </div>

                                {configuracionTraspaso && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Vista Previa
                                    </Label>
                                    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                      <div className="flex justify-between text-sm">
                                        <span>Monto a trasladar:</span>
                                        <span className="font-semibold text-green-700">
                                          {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'USD',
                                          }).format(
                                            configuracionTraspaso.montoParcial
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>Residual en Caja 1:</span>
                                        <span className="font-semibold text-orange-600">
                                          {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'USD',
                                          }).format(
                                            configuracionTraspaso.montoResidual
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>Porcentaje:</span>
                                        <span className="font-semibold text-blue-600">
                                          {configuracionTraspaso.porcentajeSeleccionado.toFixed(
                                            1
                                          )}
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      disabled={
                        !dateRange?.from ||
                        loading ||
                        (resumen?.montoDisponibleParaTraslado || 0) <= 0
                      }
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d4869c] sm:w-auto"
                    >
                      {loading ? (
                        <Spinner size={4} />
                      ) : montoParcial ? (
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
              {montoParcial
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
                  <strong>Monto a trasladar:</strong>{' '}
                  <span className="font-semibold text-blue-700">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(
                      montoParcial
                        ? Math.min(
                            parseFloat(montoParcial) || 0,
                            resumen.montoDisponibleParaTraslado
                          )
                        : resumen.montoDisponibleParaTraslado
                    )}
                  </span>
                </span>
              </div>
              {montoParcial &&
                configuracionTraspaso &&
                configuracionTraspaso.montoResidual > 0 && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      <strong>Residual en Caja 1:</strong>{' '}
                      <span className="font-semibold text-orange-700">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(configuracionTraspaso.montoResidual)}
                      </span>
                    </span>
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
              onClick={handleTrasladar}
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
