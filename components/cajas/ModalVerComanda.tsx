'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Calendar, User, DollarSign, FileText, Users, Package } from 'lucide-react';
import { ComandaNew, EstadoDeComandaNew, MetodoPagoNew, TipoDeComandaNew } from '@/services/unidadNegocio.service';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatDate, resolverMetodoPagoPrincipalConMoneda, formatearDetalleMetodosPago } from '@/lib/utils';
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/constants';

interface ModalVerComandaProps {
  isOpen: boolean;
  onClose: () => void;
  comanda: ComandaNew | null;
}

export default function ModalVerComanda({ isOpen, onClose, comanda }: ModalVerComandaProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();

  if (!isOpen || !comanda) return null;

  // Extract all payment methods from all items
  const allPaymentMethods = comanda.items?.flatMap(item => (item as any).metodosPago || []) || [];

  // Calcular totales
  const totalUSD = allPaymentMethods.reduce((acc: number, item: any) => 
    item.moneda === 'USD' ? acc + (item.montoFinal || 0) : acc, 0
  );
  const hasUsd = allPaymentMethods.some(item => item.moneda === 'USD');
    const totalARS = allPaymentMethods
      .filter(item => item.moneda === 'ARS') // Solo métodos en ARS
      .reduce((acc: number, item: any) => {
        const monto = item.monto ?? 0;
        const neto = item.montoFinal ?? 0;
        const total = hasUsd ? neto : monto;
        return acc + total;
      }, 0)

  // Método de pago principal
  const metodoPrincipal = resolverMetodoPagoPrincipalConMoneda(
    allPaymentMethods.map((m: any) => ({
      tipo: m.tipo,
      monto: m.monto,
      moneda: m.moneda || 'USD',
    })) as MetodoPagoNew[]
  );

  // Detalle de métodos de pago
  const detalleMetodos = formatearDetalleMetodosPago(
    allPaymentMethods.map((m: any) => {
      const monto = m.monto ?? 0;
      const neto = m.montoFinal ?? 0;
      const total = hasUsd ? neto : monto;
      
      return {
        tipo: m.tipo,
        monto: total,
        moneda: m.moneda || 'USD',
      };
    }) as MetodoPagoNew[]
  );

  // Trabajadores únicos
  const trabajadores = comanda.items
    .filter(item => item.trabajador)
    .map(item => item.trabajador)
    .filter((trabajador, index, array) => 
      array.findIndex(t => t?.id === trabajador?.id) === index
    );

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
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
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
                        className={`mt-1 ${
                          comanda.estadoDeComanda === EstadoDeComandaNew.VALIDADO 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        { comanda.estadoDeComanda}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha</label>
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
                                  const monto = mp.monto ?? 0;
                                  const neto = mp.montoFinal ?? 0;
                                  const total = hasUsd ? neto : monto;
                                  
                                  return (
                                    <Badge key={mpIndex} variant="outline" className="text-xs">
                                      {mp.tipo} - {mp.moneda === 'USD' ? formatUSD(total) : formatARSFromNative(total)}
                                    </Badge>
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
                    <p className="mt-1 text-sm text-[#4a3540]">{detalleMetodos}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Total USD(caja):</span>
                      <span className="font-semibold text-[#4a3540]">{formatUSD(totalUSD)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Total ARS(caja):</span>
                      <span className="font-semibold text-[#4a3540]">{formatARSFromNative(totalARS)}</span>
                    </div>
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