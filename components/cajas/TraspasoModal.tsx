'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Comanda } from '@/types/caja';
import {
  Calendar,
  Package,
  CreditCard,
  User,
  Shield,
  Clock,
} from 'lucide-react';

interface TraspasoData {
  fecha: string;
  numeroComandas: number;
  montoTotal: number;
  montoTotalUSD?: number;
  montoTotalARS?: number;
  montoParcial: number;
  montoParcialUSD?: number;
  montoParcialARS?: number;
  fechaInicio: string;
  fechaFin: string;
  metodosPago: string[];
  esTraspasoParcial?: boolean;
  montoResidualUSD?: number;
  montoResidualARS?: number;
}

interface TraspasoModalProps {
  traspaso: TraspasoData;
  comandas: Comanda[];
  trigger: React.ReactNode;
}

export default function TraspasoModal({
  traspaso,
  comandas,
  trigger,
}: TraspasoModalProps) {
  const { formatUSD, formatARSFromNative, isExchangeRateValid } =
    useCurrencyConverter();

  // Función helper para formatear montos según la moneda
  const formatAmount = (amount: number, currency?: string) => {
    if (currency === 'ARS') {
      return formatARSFromNative(amount);
    }
    return formatUSD(amount);
  };
  const getMetodoPagoColor = (metodo: string) => {
    switch (metodo.toLowerCase()) {
      case 'efectivo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'mercadopago':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[95vh] max-w-[95vw] w-[95vw] h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-sm" style={{ width: '95vw', height: '95vh', maxWidth: '95vw', maxHeight: '95vh' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-blue-600" />
            Detalles del Traspaso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del traspaso */}
          <Card className="border-[#f9bbc4]/20 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Fecha de Traspaso</p>
                  <p className="font-medium">{formatDate(traspaso.fecha)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Período</p>
                  <p className="text-sm font-medium">
                    {formatDate(traspaso.fechaInicio)} -{' '}
                    {formatDate(traspaso.fechaFin)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Comandas</p>
                  <p className="font-medium">{traspaso.numeroComandas}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {traspaso.esTraspasoParcial ? 'Monto Transferido' : 'Monto Total'}
                  </p>
                  <div className="space-y-1">
                    <p className="font-medium text-green-600">
                      USD: {formatUSD(
                        traspaso.esTraspasoParcial && traspaso.montoParcialUSD !== undefined
                          ? traspaso.montoParcialUSD
                          : traspaso.montoTotalUSD || 0
                      )}
                    </p>
                    <p className="font-medium text-green-600">
                      ARS: {formatARSFromNative(
                        traspaso.esTraspasoParcial && traspaso.montoParcialARS !== undefined
                          ? traspaso.montoParcialARS
                          : traspaso.montoTotalARS || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {traspaso.montoParcial > 0 && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Traspaso Parcial: {formatAmount(traspaso.montoParcial)}
                    </span>
                  </div>
                </div>
              )}

              {traspaso.esTraspasoParcial && 
               ((traspaso.montoResidualUSD || 0) > 0 || (traspaso.montoResidualARS || 0) > 0) && (
                <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Residual en Caja Chica
                    </span>
                  </div>
                  <div className="space-y-1 ml-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">USD:</span>
                      <span className="font-medium text-orange-600">
                        {formatUSD(traspaso.montoResidualUSD || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ARS:</span>
                      <span className="font-medium text-orange-600">
                        {formatARSFromNative(traspaso.montoResidualARS || 0)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 ml-6">
                    ⚠️ Monto que quedó en Caja Chica del traspaso parcial
                  </p>
                </div>
              )}

              {traspaso.metodosPago.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-gray-600">Métodos de Pago</p>
                  <div className="flex flex-wrap gap-2">
                    {traspaso.metodosPago.map((metodo, index) => (
                      <Badge key={index} className={getMetodoPagoColor(metodo)}>
                        <CreditCard className="mr-1 h-3 w-3" />
                        {metodo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de comandas */}
          <Card className="border-[#f9bbc4]/20 bg-white/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Comandas Traspasadas ({comandas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comandas.map((comanda, index) => {
                  const metodoPrincipal =
                    comanda.metodosPago?.length > 0
                      ? comanda.metodosPago[0].tipo
                      : 'efectivo';

                  return (
                    <div key={comanda.id}>
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">
                              #{comanda.numero}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">
                                {comanda.cliente.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600">
                                {formatDate(comanda.fecha)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge
                            className={getMetodoPagoColor(metodoPrincipal)}
                          >
                            {metodoPrincipal}
                          </Badge>
                          <Badge className={getEstadoColor(comanda.estado)}>
                            {comanda.estado}
                          </Badge>
                          <span className="font-medium text-green-600">
                            {formatAmount(comanda.totalFinal, comanda.moneda)}
                          </span>
                        </div>
                      </div>

                      {index < comandas.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  );
                })}
              </div>

              {comandas.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <Package className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p>No se encontraron comandas para este traspaso</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
