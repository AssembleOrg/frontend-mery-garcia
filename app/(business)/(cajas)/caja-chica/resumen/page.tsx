'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
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

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Resumen' },
];

export default function ResumenCajaChicaPage() {
  const { validarComandasRango, obtenerResumenRango } = useComandaStore();
  const { registrarTraspaso } = useRecordsStore();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: 'success' | 'info';
    texto: string;
  } | null>(null);

  const resumen = dateRange?.from
    ? obtenerResumenRango(dateRange.from, dateRange.to ?? dateRange.from)
    : null;

  const handleTrasladar = async () => {
    if (!dateRange?.from) return;

    setLoading(true);
    try {
      // Pasar objetos Date directamente
      await validarComandasRango(
        dateRange.from,
        dateRange.to ?? dateRange.from
      );

      // Para el registro del traspaso, usar la estructura correcta
      const fechaInicio = dateRange.from.toISOString().split('T')[0];
      const fechaFin = (dateRange.to ?? dateRange.from)
        .toISOString()
        .split('T')[0];

      // Registrar el traspaso con la estructura correcta de TraspasoInfo
      registrarTraspaso({
        fechaTraspaso: new Date().toISOString().split('T')[0],
        adminQueTraspaso: 'admin-actual', // Reemplazar con el usuario actual
        comandasTraspasadas: [], // IDs de comandas trasladadas
        montoTotal: resumen?.montoNeto || 0,
        rangoFechas: {
          desde: fechaInicio,
          hasta: fechaFin,
        },
        observaciones: `Traspaso de comandas validadas del ${fechaInicio} al ${fechaFin}`,
      });

      toast.success('Comandas trasladadas exitosamente a Caja Grande');
      setMensaje({
        tipo: 'success',
        texto: 'Comandas trasladadas exitosamente a Caja Grande',
      });
    } catch {
      toast.error('Error al realizar el traspaso');
      setMensaje({
        tipo: 'info',
        texto: 'Error al realizar el traspaso',
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
                            valueClassName="text-green-700"
                          />
                          <SummaryCard
                            title="Total Egresos"
                            value={resumen.totalEgresos}
                            format="currency"
                            valueClassName="text-red-700"
                          />
                          <SummaryCard
                            title="Balance Neto"
                            value={resumen.montoNeto}
                            format="currency"
                            valueClassName={
                              resumen.montoNeto >= 0
                                ? 'text-green-700'
                                : 'text-red-700'
                            }
                          />
                        </div>
                      </div>
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
                      ) : (
                        'Trasladar comandas completadas'
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
              ¿Estás seguro de que deseas trasladar las comandas completadas a
              Caja Grande?
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
                  <strong>Monto total:</strong>{' '}
                  <span className="font-semibold text-blue-700">
                    {new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(resumen.montoNeto)}
                  </span>
                </span>
              </div>
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
