'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import { MovimientoCreateNew, EstadoDeComandaNew } from '@/services/unidadNegocio.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMovimientosStore } from '@/features/movimientos/store/movimientosStore';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Resumen' },
];

export default function CajaChicaResumenPage() {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();
  const { user } = useAuth();
  const { crearMovimiento } = useMovimientosStore();
  const { cargarComandasPaginadas } = useComandaStore();
  // Initialize dateRange with current month dates
  const getCurrentMonthRange = (): DateRange => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: firstDay, to: lastDay };
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(getCurrentMonthRange());
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [montoParcialUSD, setMontoParcialUSD] = useState<string>('');
  const [montoParcialARS, setMontoParcialARS] = useState<string>('');
  const [mensaje, setMensaje] = useState<{
    tipo: 'success' | 'warning';
    texto: string;
  } | null>(null);

  const [loadingResumen, setLoadingResumen] = useState(false);

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
    arsEfectivo: number;
    usdEfectivo: number;
    comandasValidadasIds: string[];
  } | null>(null);

  const { getResumen } = useComandaStore();

  useEffect(() => {
    if (showConfirmModal) {
      if (resumen?.montoDisponibleTrasladoUSD! < parseInputToNumber(montoParcialUSD)) {
        toast.error(
          'El monto Residual en USD no puede ser mayor al efectivo disponible para traslado'
        );
        setShowConfirmModal(false);
      } else if (
        resumen?.montoDisponibleTrasladoARS! < parseInputToNumber(montoParcialARS)
      ) {
        toast.error(
          'El monto Residual en ARS no puede ser mayor al efectivo disponible para traslado'
        );
        setShowConfirmModal(false);
      } else {
        setShowConfirmModal(true);
      }
    }
  }, [showConfirmModal]);


  useEffect(() => {
    setLoadingResumen(true);
    if (dateRange?.from && dateRange?.to && !loadingResumen) {
      const fetchResumen = async () => {
        const resumen = await getResumen(
          dateRange?.from?.toISOString() || '',
          dateRange?.to?.toISOString() || ''
        );
        setResumen(resumen);
      };
      fetchResumen();
    } else if (!dateRange?.from && !dateRange?.to && !loadingResumen) {
      const fetchResumen = async () => {
        const resumen = await getResumen('', '');
        setResumen(resumen);
      };
      fetchResumen();
    }
    setLoadingResumen(false);
  }, [dateRange]);

  const handleMontoParcialUSDChange = (value: string) => {
    // Permitir dígitos, separadores de miles (.) y decimal (',')
    const regex = /^[0-9.,]*$/;
    // Evitar más de una coma decimal
    const commaCount = (value.match(/,/g) || []).length;
    if ((regex.test(value) || value === '') && commaCount <= 1) {
      setMontoParcialUSD(value);
    }
  };

  const handleMontoParcialARSChange = (value: string) => {
    // Permitir dígitos, separadores de miles (.) y decimal (',')
    const regex = /^[0-9.,]*$/;
    const commaCount = (value.match(/,/g) || []).length;
    if ((regex.test(value) || value === '') && commaCount <= 1) {
      setMontoParcialARS(value);
    }
  };

  // Refs para manejar caret al formatear en vivo
  const usdInputRef = useRef<HTMLInputElement | null>(null);
  const arsInputRef = useRef<HTMLInputElement | null>(null);

  // Live formatter: mantiene caret por cantidad de dígitos a la izquierda
  const stripDots = (s: string) => s.replace(/\./g, '');
  const keepOnlyDigitsAndComma = (s: string) => s.replace(/[^0-9,]/g, '');
  const countDigitsBeforePos = (s: string, pos: number) => {
    let count = 0;
    for (let i = 0; i < Math.min(pos, s.length); i++) {
      if (/[0-9]/.test(s[i])) count++;
    }
    return count;
  };

  const findPosFromDigitsCount = (formatted: string, digitsCount: number) => {
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9]/.test(formatted[i])) count++;
      if (count === digitsCount) return i + 1;
    }
    return formatted.length;
  };

  const liveFormatNumericString = (raw: string) => {
    if (!raw) return '';
    // eliminar todo menos dígitos y coma
    const cleaned = keepOnlyDigitsAndComma(raw);
    const parts = cleaned.split(',');
    const intPart = parts[0] || '';
    const fracPart = parts[1] || '';
    // formatear miles en la parte entera
    const reversed = intPart.split('').reverse().join('');
    const chunks: string[] = [];
    for (let i = 0; i < reversed.length; i += 3) {
      chunks.push(reversed.slice(i, i + 3));
    }
    const intWithDots = chunks
      .map((c) => c.split('').reverse().join(''))
      .reverse()
      .join('.');
    return fracPart !== '' ? `${intWithDots},${fracPart}` : intWithDots;
  };

  const handleMontoParcialUSDLiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // caret antes de formatear
    const caret = e.target.selectionStart || 0;
    // contar dígitos a la izquierda en la versión sin dots
    const digitsBefore = countDigitsBeforePos(stripDots(raw), caret);
    const formatted = liveFormatNumericString(raw);
    setMontoParcialUSD(formatted);
    // set caret después de render
    requestAnimationFrame(() => {
      const pos = findPosFromDigitsCount(formatted, digitsBefore);
      usdInputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleMontoParcialARSLiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart || 0;
    const digitsBefore = countDigitsBeforePos(stripDots(raw), caret);
    const formatted = liveFormatNumericString(raw);
    setMontoParcialARS(formatted);
    requestAnimationFrame(() => {
      const pos = findPosFromDigitsCount(formatted, digitsBefore);
      arsInputRef.current?.setSelectionRange(pos, pos);
    });
  };

  // Helper: convierta el string de input (puede tener '.' miles y ',' decimal)
  // a Number. Ej: "1.234.567,89" -> 1234567.89
  const parseInputToNumber = (val?: string | null) => {
    if (!val) return 0;
    const normalized = val.replace(/\./g, '').replace(/,/g, '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  };

  // Helper: formatea para mostrar en input usando separador de miles '.' y decimal ','
  const formatForDisplay = (val?: string | number) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? val : parseInputToNumber(String(val));
    // Determinar cantidad de decimales presentes en el string original si viene como string
    let fractionDigits = 0;
    if (typeof val === 'string' && val.includes(',')) {
      const parts = val.split(',');
      fractionDigits = parts[1]?.length || 0;
    } else {
      // por defecto mostrar 2 decimales cuando sea número con decimales
      const hasDecimal = Math.abs(num % 1) > 0;
      fractionDigits = hasDecimal ? 2 : 0;
    }
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: Math.max(2, fractionDigits),
    }).format(num);
  };

  const unformatForEdit = (val?: string) => {
    if (!val) return '';
    // quitar separadores de miles para edición, conservar comma decimal
    return val.replace(/\./g, '');
  };

  const handleTrasladar = async () => {
    setLoading(true);
    try {
      console.table(resumen);
      const movimiento: MovimientoCreateNew = {
        montoARS: montoParcialARS ? resumen?.montoDisponibleTrasladoARS! - parseInputToNumber(montoParcialARS) : resumen?.montoDisponibleTrasladoARS!,
        montoUSD: montoParcialUSD ? resumen?.montoDisponibleTrasladoUSD! - parseInputToNumber(montoParcialUSD) : resumen?.montoDisponibleTrasladoUSD!,
        residualARS: montoParcialARS ? parseInputToNumber(montoParcialARS) : 0,
        residualUSD: montoParcialUSD ? parseInputToNumber(montoParcialUSD) : 0,
        efectivoARS: resumen?.arsEfectivo! - (montoParcialARS ? parseInputToNumber(montoParcialARS) : 0),
        efectivoUSD: resumen?.usdEfectivo! - (montoParcialUSD ? parseInputToNumber(montoParcialUSD) : 0),
        comandasValidadasIds: resumen?.comandasValidadasIds,
        personalId: user?.id,
      };
      
      console.table(movimiento);
      await crearMovimiento(movimiento);
      
      // Limpiar los campos de monto parcial
      setMontoParcialARS('');
      setMontoParcialUSD('');
      
      // Cerrar modal antes del refresh
      setShowConfirmModal(false);
      
      // Recargar todos los datos necesarios
      await Promise.all([
        // 1. Recargar el resumen
        getResumen(dateRange?.from?.toISOString() || '', dateRange?.to?.toISOString() || '').then(setResumen),
        
        // 2. Recargar comandas validadas (para caja chica)
        cargarComandasPaginadas({
          page: 1,
          limit: 100,
          orderBy: 'createdAt',
          order: 'DESC',
          estadoDeComanda: EstadoDeComandaNew.VALIDADO,
          // Agregar filtro de fecha si es necesario
          fechaDesde: dateRange?.from?.toISOString(),
          fechaHasta: dateRange?.to?.toISOString(),
        }),
        
        // 3. Recargar comandas pendientes (para actualizar el contador)
        cargarComandasPaginadas({
          page: 1,
          limit: 100,
          orderBy: 'createdAt',
          order: 'DESC',
          estadoDeComanda: EstadoDeComandaNew.PENDIENTE,
          fechaDesde: dateRange?.from?.toISOString(),
          fechaHasta: dateRange?.to?.toISOString(),
        }),
      ]);
      
      toast.success('Traspaso realizado correctamente');
      
    } catch (error) {
      console.error(error);
      toast.error('Error al trasladar monto');
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
                          <SummaryCardCount
                            title="Validadas (incluye egresos)"
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
                            title="Total Ingresos (Incluye Señas y Residual)"
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
                            title="Balance Neto (Incluye Señas y Residual)"
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
                                  Monto Residual USD (opcional)
                                </Label>
                                <Input
                                  id="montoParcialUSD"
                                  type="text"
                                  placeholder="Ingrese monto USD"
                                  value={montoParcialUSD}
                                  ref={usdInputRef}
                                  onChange={handleMontoParcialUSDLiveChange}
                                  onBlur={() =>
                                    setMontoParcialUSD(formatForDisplay(montoParcialUSD))
                                  }
                                  onFocus={() =>
                                    setMontoParcialUSD(unformatForEdit(montoParcialUSD))
                                  }
                                  className="border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
                                />
                                <p className="text-xs text-gray-500">
                                  Máximo: {formatUSD(resumen.usdEfectivo || 0)} USD
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor="montoParcialARS"
                                  className="text-sm font-medium"
                                >
                                  Monto Residual ARS (opcional)
                                </Label>
                                <Input
                                  id="montoParcialARS"
                                  type="text"
                                  placeholder="Ingrese monto ARS"
                                  value={montoParcialARS}
                                  ref={arsInputRef}
                                  onChange={handleMontoParcialARSLiveChange}
                                  onBlur={() =>
                                    setMontoParcialARS(formatForDisplay(montoParcialARS))
                                  }
                                  onFocus={() =>
                                    setMontoParcialARS(unformatForEdit(montoParcialARS))
                                  }
                                  className="border-[#f9bbc4]/30 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
                                />
                                <p className="text-xs text-gray-500">
                                  Máximo: {formatARSFromNative(resumen.arsEfectivo || 0)} ARS
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
                      disabled={
                        typeof resumen === 'undefined' ||
                        loadingResumen ||
                        resumen?.totalCompletados === 0
                      }
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d4869c] sm:w-auto"
                    >
                      {loading ? (
                        <Spinner size={4} />
                      ) : montoParcialUSD || montoParcialARS ? (
                        'Trasladar Monto Parcial'
                      ) : (
                        'Trasladar Comandas Validadas'
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
                        ? resumen.montoDisponibleTrasladoUSD - parseInputToNumber(montoParcialUSD)
                        : resumen.montoDisponibleTrasladoUSD) ?? 0
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
                        ? resumen.montoDisponibleTrasladoARS - parseInputToNumber(montoParcialARS)
                        : resumen.montoDisponibleTrasladoARS) ?? 0
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
                        montoParcialUSD ? parseInputToNumber(montoParcialUSD) : 0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      ARS:
                    </span>
                    <span className="text-sm font-semibold text-orange-700">
                      {formatARSFromNative(
                        montoParcialARS ? parseInputToNumber(montoParcialARS) : 0
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
