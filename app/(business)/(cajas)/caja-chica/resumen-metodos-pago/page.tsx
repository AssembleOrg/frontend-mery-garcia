'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import ClientOnly from '@/components/common/ClientOnly';
import Spinner from '@/components/common/Spinner';
import SummaryCardDual from '@/components/common/SummaryCardDual';
import SummaryCardCount from '@/components/common/SummaryCardCount';
import { CajaResumenService } from '@/services/cajaResumen.service';
import { ResumenCajaDiarioResponse, TipoPago } from '@/types/caja';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Banknote, 
  ArrowRightLeft, 
  FileText, 
  Smartphone,
  Gift,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Resumen por Métodos de Pago' },
];

// Iconos y colores por método de pago
const metodoPagoConfig = {
  [TipoPago.EFECTIVO]: {
    icon: Banknote,
    color: '#10b981',
    bgColor: 'from-green-500/10 to-green-600/5',
    label: 'Efectivo',
  },
  [TipoPago.TARJETA]: {
    icon: CreditCard,
    color: '#3b82f6',
    bgColor: 'from-blue-500/10 to-blue-600/5',
    label: 'Tarjeta',
  },
  [TipoPago.TRANSFERENCIA]: {
    icon: ArrowRightLeft,
    color: '#8b5cf6',
    bgColor: 'from-purple-500/10 to-purple-600/5',
    label: 'Transferencia',
  },
  [TipoPago.CHEQUE]: {
    icon: FileText,
    color: '#f59e0b',
    bgColor: 'from-amber-500/10 to-amber-600/5',
    label: 'Cheque',
  },
  [TipoPago.QR]: {
    icon: Smartphone,
    color: '#ec4899',
    bgColor: 'from-pink-500/10 to-pink-600/5',
    label: 'QR',
  },
  [TipoPago.GIFT_CARD]: {
    icon: Gift,
    color: '#f43f5e',
    bgColor: 'from-rose-500/10 to-rose-600/5',
    label: 'Gift Card',
  },
};

export default function ResumenMetodosPagoPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [data, setData] = useState<ResumenCajaDiarioResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (fecha?: Date) => {
    try {
      setLoading(true);
      setError(null);

      // Formato YYYY-MM-DD
      const fechaString = fecha
        ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
        : undefined;

      const result = await CajaResumenService.getResumenCajaDiario(
        fechaString ? { fecha: fechaString } : undefined
      );
      console.log('result', result);
      setData(result);
      toast.success('Resumen cargado correctamente');
    } catch (err) {
      console.error('Error al obtener resumen de caja:', err);
      setError(err as Error);
      toast.error('Error al cargar el resumen de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRefresh = () => {
    fetchData(selectedDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        <StandardPageBanner title="Resumen por Métodos de Pago" />

        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

        <StandardBreadcrumbs items={breadcrumbItems} />

        <ClientOnly>
            <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="container mx-auto py-6">
                  
                  {/* Header con selector de fecha */}
                  <div className="mb-8">
                    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-lg">
                      <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gradient-to-br from-[#f9bbc4] to-[#e292a3] p-3">
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-[#4a3540]">
                                Seleccionar Fecha
                              </CardTitle>
                              <p className="text-sm text-gray-600">
                                {formatDate(selectedDate)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <DatePicker
                              date={selectedDate}
                              onDateChange={handleDateChange}
                              accentColor="#f9bbc4"
                              className="w-full sm:w-64"
                            />
                            <Button
                              onClick={handleToday}
                              variant="outline"
                              className="border-[#f9bbc4]/50 hover:bg-[#f9bbc4]/10"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Hoy
                            </Button>
                            <Button
                              onClick={handleRefresh}
                              variant="outline"
                              className="border-[#f9bbc4]/50 hover:bg-[#f9bbc4]/10"
                              disabled={loading}
                            >
                              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                              Actualizar
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Loading State */}
                  {loading && (
                    <div className="flex min-h-[400px] items-center justify-center">
                      <Spinner />
                    </div>
                  )}

                  {/* Error State */}
                  {error && !loading && (
                    <Card className="border-2 border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-red-600">
                            Error al cargar los datos: {error.message}
                          </p>
                          <Button
                            onClick={handleRefresh}
                            className="mt-4"
                            variant="outline"
                          >
                            Reintentar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Datos del resumen */}
                  {data && !loading && !error && (
                    <div className="space-y-8">
                      
                      {/* Resumen General */}
                      <div>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#4a3540]">
                          <DollarSign className="h-6 w-6 text-[#f9bbc4]" />
                          Resumen General
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <SummaryCardCount
                            title="Comandas Completadas"
                            count={data.totalCompletados}
                            subtitle="transacciones validadas"
                            valueClassName="text-green-600"
                          />
                          <SummaryCardCount
                            title="Comandas Pendientes"
                            count={data.totalPendientes}
                            subtitle="transacciones pendientes"
                            valueClassName="text-amber-600"
                          />
                          <SummaryCardDual
                            title="Total Ingresos"
                            totalUSD={data.totalIngresosUSD}
                            totalARS={data.totalIngresosARS}
                            showTransactionCount={false}
                            valueClassName="text-green-700"
                          />
                          <SummaryCardDual
                            title="Total Egresos"
                            totalUSD={data.totalEgresosUSD}
                            totalARS={data.totalEgresosARS}
                            showTransactionCount={false}
                            valueClassName="text-red-700"
                          />
                        </div>
                      </div>

                      {/* Monto Neto */}
                      <div>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#4a3540]">
                          {data.montoNetoUSD + data.montoNetoARS >= 0 ? (
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-red-600" />
                          )}
                          Balance Neto
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <SummaryCardDual
                            title="Monto Neto"
                            totalUSD={data.montoNetoUSD}
                            totalARS={data.montoNetoARS}
                            showTransactionCount={false}
                            valueClassName={
                              data.montoNetoUSD + data.montoNetoARS >= 0
                                ? 'text-green-700'
                                : 'text-red-700'
                            }
                          />
                          <SummaryCardDual
                            title="Disponible para Traslado"
                            totalUSD={data.montoDisponibleTrasladoUSD}
                            totalARS={data.montoDisponibleTrasladoARS}
                            showTransactionCount={false}
                            valueClassName="text-blue-700"
                          />
                        </div>
                      </div>

                      {/* Desglose por Método de Pago */}
                      <div>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#4a3540]">
                          <CreditCard className="h-6 w-6 text-[#f9bbc4]" />
                          Desglose por Método de Pago
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(TipoPago).map(([key, tipoPago]) => {
                            const config = metodoPagoConfig[tipoPago];
                            const montos = data.porMetodoPago[tipoPago];
                            const IconComponent = config.icon;
                            
                            // Solo mostrar si hay monto
                            const tieneMovimiento = montos.ARS > 0 || montos.USD > 0;

                            return (
                              <Card
                                key={key}
                                className={`overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                                  tieneMovimiento 
                                    ? 'border-[#f9bbc4]/30 bg-white' 
                                    : 'border-gray-200 bg-gray-50/50 opacity-50'
                                }`}
                              >
                                <CardHeader className={`bg-gradient-to-br ${config.bgColor} pb-3`}>
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="rounded-lg p-2.5"
                                      style={{ backgroundColor: `${config.color}20` }}
                                    >
                                      <IconComponent
                                        className="h-6 w-6"
                                        style={{ color: config.color }}
                                      />
                                    </div>
                                    <CardTitle className="text-lg font-semibold text-[#4a3540]">
                                      {config.label}
                                    </CardTitle>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-600">USD:</span>
                                      <span
                                        className={`text-lg font-bold ${
                                          montos.USD > 0 ? 'text-green-700' : 'text-gray-300'
                                        }`}
                                      >
                                        {formatCurrency(montos.USD, 'USD')}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-600">ARS:</span>
                                      <span
                                        className={`text-lg font-bold ${
                                          montos.ARS > 0 ? 'text-green-700' : 'text-gray-300'
                                        }`}
                                      >
                                        {formatCurrency(montos.ARS, 'ARS')}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tabla Resumen */}
                      <div>
                        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[#4a3540]">
                          <FileText className="h-6 w-6 text-[#f9bbc4]" />
                          Tabla Resumen
                        </h2>
                        <Card className="overflow-hidden border-2 border-[#f9bbc4]/30">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20">
                                <tr>
                                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#4a3540]">
                                    Método de Pago
                                  </th>
                                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#4a3540]">
                                    ARS
                                  </th>
                                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#4a3540]">
                                    USD
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {Object.entries(TipoPago).map(([key, tipoPago], index) => {
                                  const config = metodoPagoConfig[tipoPago];
                                  const montos = data.porMetodoPago[tipoPago];
                                  const IconComponent = config.icon;
                                  
                                  return (
                                    <tr
                                      key={key}
                                      className={`transition-colors hover:bg-[#f9bbc4]/5 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                      }`}
                                    >
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <IconComponent
                                            className="h-5 w-5"
                                            style={{ color: config.color }}
                                          />
                                          <span className="font-medium text-[#4a3540]">
                                            {config.label}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <span
                                          className={`font-semibold ${
                                            montos.ARS > 0 ? 'text-green-700' : 'text-gray-300'
                                          }`}
                                        >
                                          {formatCurrency(montos.ARS, 'ARS')}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <span
                                          className={`font-semibold ${
                                            montos.USD > 0 ? 'text-green-700' : 'text-gray-300'
                                          }`}
                                        >
                                          {formatCurrency(montos.USD, 'USD')}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                {/* Subtotal */}
                                <tr className="bg-[#f9bbc4] border-t-2 border-gray-200">
                                  <td className="px-6 py-3 font-semibold text-[#4a3540]">
                                    Subtotal
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <span className="font-semibold text-green-700">
                                      {formatCurrency(data.totalIngresosARS, 'ARS')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <span className="font-semibold text-green-700">
                                      {formatCurrency(data.totalIngresosUSD, 'USD')}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Egresos */}
                                <tr className="bg-red-50/8">
                                  <td className="px-6 py-3 font-semibold text-[#4a3540]">
                                    Egresos
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <span className="font-semibold text-red-700">
                                      -{formatCurrency(data.totalEgresosARS, 'ARS')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <span className="font-semibold text-red-700">
                                      -{formatCurrency(data.totalEgresosUSD, 'USD')}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Total */}
                                <tr className="bg-[#f9bbc4] border-t-2 border-[#f9bbc4]/20">
                                  <td className="px-6 py-4 font-bold text-[#4a3540]">
                                    Total
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className={`text-lg font-bold ${
                                      (data.totalIngresosARS - data.totalEgresosARS) >= 0 ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {formatCurrency(data.totalIngresosARS - data.totalEgresosARS, 'ARS')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className={`text-lg font-bold ${
                                      (data.totalIngresosUSD - data.totalEgresosUSD) >= 0 ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {formatCurrency(data.totalIngresosUSD - data.totalEgresosUSD, 'USD')}
                                    </span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </Card>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          </ClientOnly>
        </div>
      </MainLayout>
  );
}

