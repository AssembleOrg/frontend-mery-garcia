'use client';

import { useState, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import Spinner from '@/components/common/Spinner';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Briefcase,
  Package,
  Wallet,
  Calculator,
  Building2,
  ShoppingBag,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { comisionesService, ResumenComisionesDto } from '@/services/comisiones.service';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import ClientOnly from '@/components/common/ClientOnly';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import { Badge } from '@/components/ui/badge';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja 1 - Caja Chica', href: '/caja-chica' },
  { label: 'Comisiones' },
];

export default function ComisionesPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });
  const [valorDolar, setValorDolar] = useState<string>('');
  const [data, setData] = useState<ResumenComisionesDto | null>(null);
  const [cargando, setCargando] = useState(false);
  
  // Estado para modal de recepción
  const [modalRecepcionAbierto, setModalRecepcionAbierto] = useState(false);
  const [comisionMeryGarciaARS, setComisionMeryGarciaARS] = useState(0);
  const [comisionMeryGarciaUSD, setComisionMeryGarciaUSD] = useState(0);
  const [porcentajeRecepcion, setPorcentajeRecepcion] = useState<string>('');

  const { formatARSFromNative } = useCurrencyConverter();

  // Dólares con convención local: "u$s 27.705,20" (el "$" solo es pesos).
  const fmtUSD = useCallback(
    (usd: number): string =>
      `u$s ${usd.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    [],
  );

  // Formatea un par de montos mostrando SIEMPRE ambas monedas (aunque sean
  // 0), para que quede claro qué es pesos y qué es dólares sin ambigüedad.
  // "$ ..." = pesos, "u$s ..." = dólares.
  const fmtMonto = useCallback(
    (ars: number, usd: number): string =>
      `${formatARSFromNative(ars)}   +   ${fmtUSD(usd)}`,
    [formatARSFromNative, fmtUSD],
  );

  const formatDateToString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handleCalcular = useCallback(async () => {
    setCargando(true);
    try {
      const fechaDesde = dateRange.from
        ? formatDateToString(dateRange.from)
        : undefined;
      const fechaHasta = dateRange.to
        ? formatDateToString(dateRange.to)
        : undefined;

      const dolar = valorDolar.trim() !== '' ? parseFloat(valorDolar) : undefined;

      const response = await comisionesService.obtenerComisiones({
        fechaDesde,
        fechaHasta,
        dolar,
      });

      setData(response);
      toast.success('Comisiones calculadas correctamente');
    } catch (error) {
      console.error('Error al cargar comisiones:', error);
      toast.error('Error al cargar las comisiones');
    } finally {
      setCargando(false);
    }
  }, [dateRange, formatDateToString, valorDolar]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setDateRange({ from: today, to: today });
  }, []);

  const formatDateRange = useCallback(() => {
    if (!dateRange.from) return 'Selecciona un rango';
    
    const fromStr = dateRange.from.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return fromStr;
    }

    const toStr = dateRange.to.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return `${fromStr} - ${toStr}`;
  }, [dateRange]);

  const handleAbrirModalRecepcion = useCallback((comisionARS: number, comisionUSD: number) => {
    setComisionMeryGarciaARS(comisionARS);
    setComisionMeryGarciaUSD(comisionUSD);
    setPorcentajeRecepcion('');
    setModalRecepcionAbierto(true);
  }, []);

  const handleCerrarModalRecepcion = useCallback(() => {
    setModalRecepcionAbierto(false);
    setPorcentajeRecepcion('');
  }, []);

  const calcularComisionRecepcion = useCallback((): { ars: number; usd: number } => {
    const porcentaje = parseFloat(porcentajeRecepcion);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      return { ars: 0, usd: 0 };
    }
    return {
      ars: (comisionMeryGarciaARS * porcentaje) / 100,
      usd: (comisionMeryGarciaUSD * porcentaje) / 100,
    };
  }, [comisionMeryGarciaARS, comisionMeryGarciaUSD, porcentajeRecepcion]);

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Comisiones" />
          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />
          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <ClientOnly>
                {/* Controles superiores - Compactos */}
                <Card className="mb-6 border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4">
                      {/* Primera fila: Fecha */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex items-center gap-2 text-sm text-[#6b4c57]">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">{formatDateRange()}</span>
                          </div>
                          <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={handleDateRangeChange}
                          />
                        </div>
                        <Button
                          onClick={handleToday}
                          variant="outline"
                          size="sm"
                          className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
                        >
                          Hoy
                        </Button>
                      </div>

                      {/* Segunda fila: Dólar y Botón Calcular */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex flex-1 items-center gap-2">
                          <DollarSign className="h-4 w-4 text-[#6b4c57]" />
                          <Input
                            type="number"
                            placeholder="Valor dólar (opcional)"
                            value={valorDolar}
                            onChange={(e) => setValorDolar(e.target.value)}
                            className="max-w-xs border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                          />
                          <span className="text-xs text-[#8b5a6b]">
                            Si vacío, usa el valor de cada comanda
                          </span>
                        </div>
                        <Button
                          onClick={handleCalcular}
                          disabled={cargando}
                          className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] hover:from-[#e8b4c6] hover:to-[#d4a7ca] text-white font-semibold shadow-lg"
                        >
                          <Calculator className="mr-2 h-4 w-4" />
                          {cargando ? 'Calculando...' : 'Calcular Comisiones'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {cargando ? (
                  <div className="flex h-64 items-center justify-center">
                    <Spinner />
                  </div>
                ) : data ? (
                  <div className="space-y-6">
                    {/* Resumen compacto - 2 filas en desktop, stack en mobile */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Total Comisiones - Destacado */}
                      <Card className="border-2 border-[#f9bbc4]/50 bg-gradient-to-br from-[#f9bbc4]/10 to-white shadow-lg lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-[#6b4c57]">
                            <Wallet className="h-4 w-4" />
                            Total Comisiones
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-[#4a3540]">
                            {formatARSFromNative(data.totalComisionesARS)}
                          </div>
                          <div className="text-2xl font-bold text-[#6b4c57]">
                            {fmtUSD(data.totalComisionesUSD)}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Bruto Cobrado */}
                      <Card className="border border-[#d4a7ca]/30 bg-white shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-xs font-medium text-[#6b4c57]">
                            <DollarSign className="h-4 w-4" />
                            Bruto Cobrado
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-[#4a3540]">
                            {formatARSFromNative(data.totales.totalARS)}
                          </div>
                          <div className="text-lg font-bold text-[#6b4c57]">
                            {fmtUSD(data.totales.totalUSD)}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Trabajadores */}
                      <Card className="border border-[#d4a7ca]/30 bg-white shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-xs font-medium text-[#6b4c57]">
                            <Users className="h-4 w-4" />
                            Trabajadores
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-[#4a3540]">
                            {data.trabajadores.length}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Totales Generales - Compacto */}
                    <Card className="border-2 border-[#e8b4c6]/30 bg-white/95 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-[#4a3540]">
                          Resumen de Ventas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                          {/* Servicios ARS */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-[#6b4c57]">
                              <Briefcase className="h-3 w-3" />
                              <span>Servicios ARS</span>
                            </div>
                            <div className="text-sm font-semibold text-[#4a3540]">
                              {formatARSFromNative(data.totales.serviciosARS)}
                            </div>
                          </div>

                          {/* Servicios USD */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-[#6b4c57]">
                              <Briefcase className="h-3 w-3" />
                              <span>Servicios USD</span>
                            </div>
                            <div className="text-sm font-semibold text-[#4a3540]">
                              {fmtUSD(data.totales.serviciosUSD)}
                            </div>
                          </div>

                          {/* Productos ARS */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-[#6b4c57]">
                              <Package className="h-3 w-3" />
                              <span>Productos ARS</span>
                            </div>
                            <div className="text-sm font-semibold text-[#4a3540]">
                              {formatARSFromNative(data.totales.productosARS)}
                            </div>
                          </div>

                          {/* Productos USD */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-[#6b4c57]">
                              <Package className="h-3 w-3" />
                              <span>Productos USD</span>
                            </div>
                            <div className="text-sm font-semibold text-[#4a3540]">
                              {fmtUSD(data.totales.productosUSD)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lista de Trabajadores - Compacta */}
                    <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#4a3540]">
                          <TrendingUp className="h-5 w-5" />
                          Comisiones por Trabajador
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {data.trabajadores.map((trabajador) => (
                            <div
                              key={trabajador.trabajadorId}
                              className="rounded-lg border-2 border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-transparent p-4 transition-all hover:shadow-md"
                            >
                              {/* Header del trabajador */}
                              <div className="mb-4 border-b border-[#f9bbc4]/20 pb-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-lg font-semibold text-[#4a3540]">
                                    {trabajador.nombre}
                                  </h3>
                                  <div className="rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] px-4 py-1.5 text-base font-bold text-white shadow-md">
                                    {fmtMonto(trabajador.comisiones.totalARS, trabajador.comisiones.totalUSD)}
                                  </div>
                                </div>
                                {/* Botón de recepción solo para Mery García */}
                                {trabajador.nombre.toLowerCase().includes('mery') && (
                                  <Button
                                    onClick={() => handleAbrirModalRecepcion(trabajador.comisiones.totalARS, trabajador.comisiones.totalUSD)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-[#d4a7ca]/50 text-[#6b4c57] hover:bg-[#d4a7ca]/10 hover:border-[#d4a7ca]"
                                  >
                                    <Percent className="mr-2 h-4 w-4" />
                                    Calcular Comisión Recepción
                                  </Button>
                                )}
                              </div>

                              {/* Grid principal - 2 columnas en desktop */}
                              <div className="grid gap-4 lg:grid-cols-2">
                                {/* Columna izquierda: Servicios y Productos */}
                                <div className="space-y-3">
                                  {/* Una tarjeta por moneda: los pesos del estilismo y los
                                      dólares del cosmetic tattoo no se suman entre sí, así que
                                      tampoco se muestran juntos. Mismo criterio que el
                                      Resumen de Ventas de arriba. */}
                                  <div className="grid grid-cols-2 gap-3">
                                    {/* Servicios ARS */}
                                    <div className="rounded-md bg-[#f9bbc4]/10 p-3">
                                      <div className="flex items-center gap-1 text-xs text-[#8b5a6b] mb-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span>Servicios ARS (30%)</span>
                                      </div>
                                      <div className="font-semibold text-[#4a3540]">
                                        {formatARSFromNative(trabajador.serviciosARS)}
                                      </div>
                                      <div className="text-xs text-[#6b4c57] mt-1">
                                        Com: {formatARSFromNative(trabajador.comisiones.serviciosARS)}
                                      </div>
                                    </div>

                                    {/* Servicios USD */}
                                    <div className="rounded-md bg-[#f9bbc4]/10 p-3">
                                      <div className="flex items-center gap-1 text-xs text-[#8b5a6b] mb-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span>Servicios USD (30%)</span>
                                      </div>
                                      <div className="font-semibold text-[#4a3540]">
                                        {fmtUSD(trabajador.serviciosUSD)}
                                      </div>
                                      <div className="text-xs text-[#6b4c57] mt-1">
                                        Com: {fmtUSD(trabajador.comisiones.serviciosUSD)}
                                      </div>
                                    </div>

                                    {/* Productos ARS */}
                                    <div className="rounded-md bg-[#e8b4c6]/10 p-3">
                                      <div className="flex items-center gap-1 text-xs text-[#8b5a6b] mb-1">
                                        <Package className="h-3 w-3" />
                                        <span>Productos ARS (10%)</span>
                                      </div>
                                      <div className="font-semibold text-[#4a3540]">
                                        {formatARSFromNative(trabajador.productosARS)}
                                      </div>
                                      <div className="text-xs text-[#6b4c57] mt-1">
                                        Com: {formatARSFromNative(trabajador.comisiones.productosARS)}
                                      </div>
                                    </div>

                                    {/* Productos USD */}
                                    <div className="rounded-md bg-[#e8b4c6]/10 p-3">
                                      <div className="flex items-center gap-1 text-xs text-[#8b5a6b] mb-1">
                                        <Package className="h-3 w-3" />
                                        <span>Productos USD (10%)</span>
                                      </div>
                                      <div className="font-semibold text-[#4a3540]">
                                        {fmtUSD(trabajador.productosUSD)}
                                      </div>
                                      <div className="text-xs text-[#6b4c57] mt-1">
                                        Com: {fmtUSD(trabajador.comisiones.productosUSD)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Consultas (solo si tiene) */}
                                  {trabajador.cantidadConsultas > 0 && (
                                    <div className="rounded-md bg-[#d4a7ca]/10 p-3 border border-[#d4a7ca]/30">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="text-xs text-[#8b5a6b]">Consultas</div>
                                          <div className="font-semibold text-[#4a3540]">
                                            {trabajador.cantidadConsultas} consultas
                                          </div>
                                        </div>
                                        <div className="text-sm font-bold text-[#6b4c57]">
                                          {fmtUSD(trabajador.totalConsultas)}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Columna derecha: Unidades de Negocio y Detalles */}
                                <div className="space-y-3">
                                  {/* Unidades de Negocio */}
                                  {Object.keys(trabajador.unidadesNegocio).length > 0 && (
                                    <div className="rounded-md bg-white border border-[#f9bbc4]/20 p-3">
                                      <div className="flex items-center gap-1 text-xs font-medium text-[#6b4c57] mb-2">
                                        <Building2 className="h-3 w-3" />
                                        <span>Unidades de Negocio</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {Object.entries(trabajador.unidadesNegocio).map(([unidad, cantidad]) => (
                                          <Badge
                                            key={unidad}
                                            variant="outline"
                                            className="border-[#f9bbc4]/30 bg-[#f9bbc4]/5 text-[#4a3540]"
                                          >
                                            {unidad}: {cantidad}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Productos/Servicios Detalle */}
                                  {trabajador.productosServicios.length > 0 && (
                                    <div className="rounded-md bg-white border border-[#e8b4c6]/20 p-3">
                                      <div className="flex items-center gap-1 text-xs font-medium text-[#6b4c57] mb-2">
                                        <ShoppingBag className="h-3 w-3" />
                                        <span>Detalle de Ventas</span>
                                      </div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {trabajador.productosServicios.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between text-xs"
                                          >
                                            <span className="text-[#4a3540]">{item.nombre}</span>
                                            <Badge
                                              variant={item.tipo === 'SERVICIO' ? 'default' : 'secondary'}
                                              className="ml-2 text-xs"
                                            >
                                              {item.cantidad}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {data.trabajadores.length === 0 && (
                            <div className="py-8 text-center text-[#8b5a6b]">
                              No hay comisiones para el período seleccionado
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="border-2 border-[#f9bbc4]/30 bg-white/95 shadow-xl">
                    <CardContent className="py-16">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <Calculator className="h-16 w-16 text-[#f9bbc4]/40" />
                        <div>
                          <p className="text-lg font-medium text-[#4a3540]">
                            Selecciona un período y presiona "Calcular Comisiones"
                          </p>
                          <p className="text-sm text-[#8b5a6b] mt-2">
                            Puedes opcionalmente especificar un valor del dólar para recalcular con una cotización diferente
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Modal de Comisión Recepción */}
                <Dialog open={modalRecepcionAbierto} onOpenChange={setModalRecepcionAbierto}>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-[#4a3540]">
                        Calcular Comisión Recepción
                      </DialogTitle>
                      <DialogDescription className="text-[#8b5a6b]">
                        Ingresa el porcentaje que corresponde a recepción de la comisión de Mery García
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      {/* Comisión de Mery García */}
                      <div className="rounded-lg bg-gradient-to-r from-[#f9bbc4]/10 to-[#e8b4c6]/10 p-4 border border-[#f9bbc4]/20">
                        <div className="text-xs text-[#8b5a6b] mb-1">
                          Comisión Total Mery García
                        </div>
                        <div className="text-2xl font-bold text-[#4a3540]">
                          {fmtMonto(comisionMeryGarciaARS, comisionMeryGarciaUSD)}
                        </div>
                      </div>

                      {/* Input de Porcentaje */}
                      <div className="space-y-2">
                        <Label htmlFor="porcentaje" className="text-[#6b4c57] font-medium">
                          Porcentaje para Recepción (0-100)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="porcentaje"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Ej: 15"
                            value={porcentajeRecepcion}
                            onChange={(e) => setPorcentajeRecepcion(e.target.value)}
                            className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                          />
                          <Percent className="h-5 w-5 text-[#8b5a6b]" />
                        </div>
                      </div>

                      {/* Resultado */}
                      {porcentajeRecepcion && (
                        <div className="rounded-lg bg-gradient-to-r from-[#d4a7ca]/20 to-[#e8b4c6]/20 p-4 border-2 border-[#d4a7ca]/40">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-[#8b5a6b] mb-1">
                                Comisión Recepción ({porcentajeRecepcion}%)
                              </div>
                              <div className="text-3xl font-bold text-[#4a3540]">
                                {fmtMonto(calcularComisionRecepcion().ars, calcularComisionRecepcion().usd)}
                              </div>
                            </div>
                            <div className="rounded-full bg-gradient-to-r from-[#d4a7ca] to-[#e8b4c6] p-3">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                          </div>

                          {/* Desglose adicional */}
                          <div className="mt-3 pt-3 border-t border-[#d4a7ca]/30">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#8b5a6b]">Queda para Mery García:</span>
                              <span className="font-semibold text-[#6b4c57]">
                                {fmtMonto(
                                  comisionMeryGarciaARS - calcularComisionRecepcion().ars,
                                  comisionMeryGarciaUSD - calcularComisionRecepcion().usd,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCerrarModalRecepcion}
                        className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
                      >
                        Cerrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </ClientOnly>
            </div>
          </div>
        </div>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}

