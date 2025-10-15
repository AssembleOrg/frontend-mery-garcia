'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Calendar, User, DollarSign, FileText, Users, Package, CheckCircle } from 'lucide-react';
import { ComandaNew, EstadoDeComandaNew, MetodoPagoNew, TipoDeComandaNew } from '@/services/unidadNegocio.service';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatDate, resolverMetodoPagoPrincipalConMoneda, formatearDetalleMetodosPago } from '@/lib/utils';
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/constants';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { toast } from 'sonner';

interface ModalVerComandaProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaNew | null;
}

export default function ModalVerComanda({ isOpen, onClose, comanda }: ModalVerComandaProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();
  const { actualizarComanda } = useComandaStore();
  const [validando, setValidando] = useState(false);

  if (!isOpen || !comanda) return null;

  // Función para validar la comanda
  const handleValidarComanda = async () => {
    if (!comanda.id) {
      toast.error('No se puede validar la comanda: ID no encontrado');
      return;
    }

    if (comanda.estadoDeComanda === EstadoDeComandaNew.VALIDADO) {
      toast.info('La comanda ya está validada');
      return;
    }

    setValidando(true);
    try {
      await actualizarComanda(comanda.id, {
        estadoDeComanda: EstadoDeComandaNew.VALIDADO
      });
      
      toast.success('Comanda validada exitosamente');
      onClose(); // Cerrar el modal después de validar
    } catch (error) {
      console.error('Error al validar comanda:', error);
      toast.error('Error al validar la comanda');
    } finally {
      setValidando(false);
    }
  };

  // Extract all payment methods from comanda (not from items)
  const allPaymentMethods = (comanda as any).metodosPago || [];

  // Calcular totales
  const totalUSD = comanda.tipoDeComanda === TipoDeComandaNew.EGRESO ? comanda.precioDolar : allPaymentMethods.reduce((acc: number, item: any) =>
    item.moneda === 'USD' ? acc + (item.montoFinal || 0) : acc, 0
  );
  const hasUsd = allPaymentMethods.some(item => item.moneda === 'USD');

  const totalARS = comanda.tipoDeComanda === TipoDeComandaNew.EGRESO ? comanda.precioPesos : allPaymentMethods
    .filter(item => item.moneda === 'ARS') // Solo métodos en ARS
    .reduce((acc: number, item: any) => {
      // Siempre usar montoFinal para incluir descuentos aplicados
      const total = item.montoFinal ?? item.monto ?? 0;
      console.warn('total', total);
      return acc + total;
    }, 0) || 0
  console.warn('totalARS', totalARS);

  // Obtener información de señas utilizadas
  const señaInfo = {
    ars: comanda.usuarioConsumePrepagoARS && comanda.prepagoARS ? comanda.prepagoARS.monto : 0,
    usd: comanda.usuarioConsumePrepagoUSD && comanda.prepagoUSD ? comanda.prepagoUSD.monto : 0,
  };

  // Método de pago principal
  const metodoPrincipal = resolverMetodoPagoPrincipalConMoneda(
    allPaymentMethods.map((m: any) => ({
      tipo: m.tipo,
      monto: m.monto,
      moneda: m.moneda || 'USD',
    })) as MetodoPagoNew[]
  );

  // Agrupar métodos de pago por tipo y moneda (sin mezclar)
  const metodosPagoAgrupados = allPaymentMethods.reduce((acc: any, m: any) => {
    const total = m.montoFinal ?? m.monto ?? 0;
    const moneda = m.moneda || 'USD';
    const tipo = m.tipo;
    const clave = `${tipo}-${moneda}`;
    
    if (!acc[clave]) {
      acc[clave] = { tipo, moneda, total: 0 };
    }
    acc[clave].total += total;
    console.table(acc);
    return acc;
  }, {});

  // Restar señas de los totales USD
  // Object.keys(metodosPagoAgrupados).forEach(clave => {
  //   const metodo = metodosPagoAgrupados[clave];
  //   if (metodo.moneda === 'USD' && señaInfo.usd > 0) {
  //     // Distribuir la seña proporcionalmente entre los métodos USD
  //     const totalUSDOriginal = allPaymentMethods
  //       .filter(m => (m.moneda || 'USD') === 'USD')
  //       .reduce((sum, m) => sum + (m.montoFinal ?? m.monto ?? 0), 0);
      
  //     if (totalUSDOriginal > 0) {
  //       const proporcion = metodo.total / totalUSDOriginal;
  //       const descuentoSeña = señaInfo.usd * proporcion;
  //       metodo.total = Math.max(0, metodo.total - descuentoSeña);
  //     }
  //   }
  //   if (metodo.moneda === 'ARS' && señaInfo.ars > 0) {
  //     // Distribuir la seña proporcionalmente entre los métodos ARS
  //     const totalARSOriginal = allPaymentMethods
  //       .filter(m => (m.moneda || 'USD') === 'ARS')
  //       .reduce((sum, m) => sum + (m.montoFinal ?? m.monto ?? 0), 0);
      
  //     if (totalARSOriginal > 0) {
  //       const proporcion = metodo.total / totalARSOriginal;
  //       const descuentoSeña = señaInfo.ars * proporcion;
  //       metodo.total = Math.max(0, metodo.total - descuentoSeña);
  //     }
  //   }
  // });

  // Formatear detalle de cada método de pago
  const detalleMetodos = Object.values(metodosPagoAgrupados)
    .filter((metodo: any) => metodo.total > 0)
    .map((metodo: any) => {
      const montoFormateado = metodo.moneda === 'USD' 
        ? formatUSD(metodo.total)
        : formatARSFromNative(metodo.total);
      
        console.warn('metodo', metodo, montoFormateado);
      return `${metodo.tipo} ${metodo.moneda}: ${montoFormateado}`;
    }).join(' + ');

  // Trabajadores únicos
  const trabajadores = comanda.items
    .filter(item => item.trabajador)
    .map(item => item.trabajador)
    .filter((trabajador, index, array) =>
      array.findIndex(t => t?.id === trabajador?.id) === index
    );

  // Función para obtener abreviatura del método de pago
  const getPaymentMethodAbbreviation = (tipo: string) => {
    const abbreviations: { [key: string]: string } = {
      'EFECTIVO': 'EFE',
      'TRANSFERENCIA': 'TRF',
      'TARJETA': 'TAR',
      'QR': 'QR',
      'GIFT_CARD': 'GC',
      'PRECIO_LISTA': 'PL',
      'MIXTO': 'MIX'
    };
    return abbreviations[tipo] || tipo;
  };

  // Función para calcular el porcentaje de descuento por método de pago
  const calcularPorcentajeDescuento = (metodoPago: any) => {
    const monto = metodoPago.monto ?? 0;
    const montoFinal = metodoPago.montoFinal ?? 0;
    
    if (monto > 0 && montoFinal < monto) {
      const descuento = monto - montoFinal;
      const porcentaje = (descuento / monto) * 100;
      return Math.round(porcentaje);
    }
    return 0;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#f9bbc4]/20 p-2">
                <FileText className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Detalles de Comanda
                </h2>
                <p className="text-sm text-gray-600">
                  #{comanda.numero} - {comanda.tipoDeComanda === TipoDeComandaNew.INGRESO ? 'Ingreso' : 'Egreso'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Botón Validar Comanda - Solo mostrar si no está validada ni traspasada */}
              {comanda.estadoDeComanda !== EstadoDeComandaNew.VALIDADO && 
               comanda.estadoDeComanda !== EstadoDeComandaNew.TRASPASADA && (
                <Button
                  onClick={handleValidarComanda}
                  disabled={validando}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {validando ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validar Comanda
                    </>
                  )}
                </Button>
              )}
              
              {/* Botón Cerrar */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Información General */}
              <Card className="border border-[#f9bbc4]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-[#8b5a6b]" />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Número</label>
                      <p className="text-lg font-semibold text-[#4a3540]">{comanda.numero}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Estado</label>
                      <Badge
                        className={`mt-1 ${comanda.estadoDeComanda === EstadoDeComandaNew.VALIDADO
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {comanda.estadoDeComanda}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                      <p className="text-sm text-[#4a3540]">{formatDate(new Date(comanda.createdAt))}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipo</label>
                      <p className="text-sm text-[#4a3540]">
                        {comanda.tipoDeComanda === TipoDeComandaNew.INGRESO ? 'Ingreso' : 'Egreso'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente y Personal */}
              <Card className="border border-[#f9bbc4]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-[#8b5a6b]" />
                    Cliente y Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cliente</label>
                    <p className="text-lg font-semibold text-[#4a3540]">{comanda.cliente?.nombre}</p>
                    {comanda.cliente?.email && (
                      <p className="text-sm text-gray-600">{comanda.cliente.email}</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-600">Creado por</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-xs font-semibold text-white">
                        {comanda.creadoPor?.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#4a3540]">
                        {comanda.creadoPor?.nombre}
                      </span>
                    </div>
                  </div>

                  {trabajadores.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-gray-600">Personal Asignado</label>
                        <div className="mt-2 space-y-2">
                          {trabajadores.map((trabajador, index) => (
                            <div key={trabajador?.id || index} className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-xs font-semibold text-white">
                                {trabajador?.nombre?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-[#4a3540]">
                                {trabajador?.nombre}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Items/Servicios */}
              <Card className="border border-[#f9bbc4]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-[#8b5a6b]" />
                    Items ({comanda.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comanda.items?.map((item, index) => (
                      <div key={item.id || index} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1">
                          <p className="font-medium text-[#4a3540]">{item.nombre}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.cantidad} - Precio: {formatUSD(item.precio!)}
                          </p>
                          {/* Show payment methods for this item if available */}
                          {(item as any).metodosPago && (item as any).metodosPago.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Métodos de pago:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(item as any).metodosPago.map((mp: any, mpIndex: number) => {
                                  // Siempre usar montoFinal para incluir descuentos aplicados
                                  const total = mp.montoFinal ?? mp.monto ?? 0;
                                  const descuentoPorcentaje = calcularPorcentajeDescuento(mp);

                                  return (
                                    <div key={mpIndex} className="flex items-center gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {getPaymentMethodAbbreviation(mp.tipo)} - {mp.moneda} - {mp.moneda === 'USD' ? formatUSD(total) : formatARSFromNative(total)}
                                      </Badge>
                                      {descuentoPorcentaje > 0 && (
                                        <Badge className="text-xs bg-green-100 text-green-800 font-bold">
                                          -{descuentoPorcentaje}% 💰
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#4a3540]">
                            {formatUSD(item.precio! * item.cantidad!)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Métodos de Pago y Totales */}
              <Card className="border border-[#f9bbc4]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-[#8b5a6b]" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Método Principal</label>
                    <Badge className="mt-1 bg-blue-100 text-blue-800">
                      💰 {metodoPrincipal}
                    </Badge>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Detalle de Pagos</label>
                    <div className="mt-2 p-2 bg-green-100 border-l-4 border-green-500 rounded-r-md">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">💰</span>
                        <span className="text-xs font-semibold text-green-700">Monto Real Pagado:</span>
                      </div>
                      <p className="text-base font-bold text-green-800">{detalleMetodos}</p>
                      <p className="text-xs text-green-600 mt-1">✅ Incluye descuentos y señas</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Total USD(caja):</span>
                      <span className="font-semibold text-[#4a3540]">{formatUSD(totalUSD)}</span>
                    </div>
                    {/* Seña USD utilizada */}
                    {señaInfo.usd > 0 && (
                      <div className="flex justify-between items-center text-blue-600 ml-4">
                        <span className="text-xs">Seña USD utilizada:</span>
                        <span className="text-xs font-medium">-{formatUSD(señaInfo.usd)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Total ARS(caja):</span>
                      <span className="font-semibold text-[#4a3540]">{formatARSFromNative(totalARS)}</span>
                    </div>
                    {/* Seña ARS utilizada */}
                    {señaInfo.ars > 0 && (
                      <div className="flex justify-between items-center text-blue-600 ml-4">
                        <span className="text-xs">Seña ARS utilizada:</span>
                        <span className="text-xs font-medium">-{formatARSFromNative(señaInfo.ars)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observaciones */}
            {comanda.observaciones && (
              <Card className="mt-6 border border-[#f9bbc4]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-[#8b5a6b]" />
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#4a3540]">{comanda.observaciones}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 