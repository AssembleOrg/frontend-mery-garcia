'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Gift,
  QrCode,
  DollarSign,
} from 'lucide-react';
import { METODOS_PAGO, MONEDAS, MONEDA_LABELS } from '@/lib/constants';
import { formatUSD } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { MetodoPagoForm, ResumenDual } from '@/hooks/useMetodosPago';

interface MetodosPagoSectionProps {
  metodosPago: MetodoPagoForm[];
  totalPagado: number;
  montoTotal: number;
  isReadOnly?: boolean;
  onAgregarMetodo?: () => void;
  onEliminarMetodo?: (index: number) => void;
  onActualizarMetodo?: (
    index: number,
    campo: keyof MetodoPagoForm,
    valor: string | number | { nombre: string; codigo: string }
  ) => void;
  className?: string;
  obtenerResumenDual?: () => ResumenDual;
}

export default function MetodosPagoSection({
  metodosPago,
  totalPagado,
  montoTotal,
  isReadOnly = false,
  onAgregarMetodo,
  onEliminarMetodo,
  onActualizarMetodo,
  className = '',
  obtenerResumenDual,
}: MetodosPagoSectionProps) {
  const {
    formatARS,
    formatUSD,
    formatARSFromNative,
    usdToArs,
    isExchangeRateValid,
    formatDual,
  } = useCurrencyConverter();

  // Helper function for dual currency display
  const formatAmount = (amount: number): string => {
    return isExchangeRateValid ? formatDual(amount) : formatUSD(amount);
  };

  const getPaymentIcon = (tipo: string) => {
    switch (tipo) {
      case METODOS_PAGO.EFECTIVO:
        return <Banknote className="h-4 w-4" />;
      case METODOS_PAGO.TARJETA:
        return <CreditCard className="h-4 w-4" />;
      case METODOS_PAGO.TRANSFERENCIA:
        return <Smartphone className="h-4 w-4" />;
      case METODOS_PAGO.GIFTCARD:
        return <Gift className="h-4 w-4" />;
      case METODOS_PAGO.QR:
        return <QrCode className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const totalDescuentos = metodosPago.reduce(
    (sum, mp) => sum + mp.descuentoAplicado,
    0
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Métodos de Pago</span>
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAgregarMetodo}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metodosPago.map((metodo, index) => (
          <div key={index} className="space-y-2">
            {/* Fila principal del método de pago */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {getPaymentIcon(metodo.tipo)}
              </div>

              <Select
                value={metodo.tipo}
                onValueChange={(value) =>
                  onActualizarMetodo?.(index, 'tipo', value)
                }
                disabled={isReadOnly}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={METODOS_PAGO.EFECTIVO}>
                    Efectivo
                  </SelectItem>
                  <SelectItem value={METODOS_PAGO.TARJETA}>Tarjeta</SelectItem>
                  <SelectItem value={METODOS_PAGO.TRANSFERENCIA}>
                    Transferencia
                  </SelectItem>
                  <SelectItem value={METODOS_PAGO.GIFTCARD}>
                    Gift Card
                  </SelectItem>
                  <SelectItem value={METODOS_PAGO.QR}>QR</SelectItem>
                </SelectContent>
              </Select>

              {/* Selector de Moneda */}
              <Select
                value={metodo.moneda || MONEDAS.USD}
                onValueChange={(value) =>
                  onActualizarMetodo?.(index, 'moneda', value)
                }
                disabled={isReadOnly}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MONEDAS.USD}>
                    {MONEDA_LABELS[MONEDAS.USD]}
                  </SelectItem>
                  <SelectItem value={MONEDAS.ARS}>
                    {MONEDA_LABELS[MONEDAS.ARS]}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Monto"
                value={metodo.monto || ''}
                onChange={(e) =>
                  onActualizarMetodo?.(
                    index,
                    'monto',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-24"
                min="0"
                step="0.01"
                readOnly={isReadOnly}
              />

              {/* Mostrar descuento aplicado si existe */}
              {metodo.descuentoAplicado > 0 && (
                <div className="min-w-[60px] text-xs text-green-600">
                  {metodo.moneda === MONEDAS.ARS &&
                  metodo.descuentoOriginalARS ? (
                    <>-{formatARSFromNative(metodo.descuentoOriginalARS)}</>
                  ) : (
                    <>-{formatAmount(metodo.descuentoAplicado)}</>
                  )}
                </div>
              )}

              <div className="min-w-[80px] text-sm font-medium">
                {metodo.moneda === MONEDAS.ARS ? (
                  <>
                    ={' '}
                    {formatARSFromNative(
                      metodo.montoFinalOriginalARS || metodo.monto
                    )}
                    <div className="text-xs text-gray-500">
                      ≈ {formatAmount(metodo.montoFinal)}
                    </div>
                  </>
                ) : (
                  <>
                    = {formatAmount(metodo.montoFinal)}
                    <div className="text-xs text-gray-500">
                      ≈ {formatARS(metodo.montoFinal)}
                    </div>
                  </>
                )}
              </div>

              {!isReadOnly && metodosPago.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEliminarMetodo?.(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Campos adicionales para Gift Card */}
            {metodo.tipo === METODOS_PAGO.GIFTCARD && (
              <div className="ml-6 flex gap-2">
                <Input
                  placeholder="Nombre"
                  value={metodo.giftcard?.nombre || ''}
                  onChange={(e) => {
                    const giftcardData = {
                      nombre: e.target.value,
                      codigo: metodo.giftcard?.codigo || '',
                    };
                    onActualizarMetodo?.(index, 'giftcard', giftcardData);
                  }}
                  className="w-32"
                  readOnly={isReadOnly}
                />
                <Input
                  placeholder="Código"
                  value={metodo.giftcard?.codigo || ''}
                  onChange={(e) => {
                    const giftcardData = {
                      nombre: metodo.giftcard?.nombre || '',
                      codigo: e.target.value,
                    };
                    onActualizarMetodo?.(index, 'giftcard', giftcardData);
                  }}
                  className="w-32"
                  readOnly={isReadOnly}
                />
              </div>
            )}
          </div>
        ))}

        {/* Resumen con descuentos y dual currency */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Total a Pagar:</span>
            <span className="font-medium">{formatAmount(montoTotal)}</span>
          </div>
          {totalDescuentos > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuentos Aplicados:</span>
              <span className="font-medium">
                -{formatAmount(totalDescuentos)}
              </span>
            </div>
          )}

          {/* Resumen Dual USD/ARS */}
          {obtenerResumenDual && (
            <div className="space-y-1 border-t pt-2">
              {(() => {
                const resumen = obtenerResumenDual();
                return (
                  <>
                    <div className="text-xs font-medium text-gray-600">
                      Resumen por Moneda:
                    </div>
                    {resumen.detallesPorMoneda.USD.metodos > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>
                          USD ({resumen.detallesPorMoneda.USD.metodos} método
                          {resumen.detallesPorMoneda.USD.metodos > 1 ? 's' : ''}
                          ):
                        </span>
                        <span>
                          {formatAmount(resumen.detallesPorMoneda.USD.total)}
                        </span>
                      </div>
                    )}
                    {resumen.detallesPorMoneda.ARS.metodos > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>
                          ARS ({resumen.detallesPorMoneda.ARS.metodos} método
                          {resumen.detallesPorMoneda.ARS.metodos > 1 ? 's' : ''}
                          ):
                        </span>
                        <span>
                          {formatARSFromNative(
                            resumen.detallesPorMoneda.ARS.total
                          )}
                        </span>
                      </div>
                    )}
                    {(resumen.totalPagadoUSD > 0 ||
                      resumen.totalPagadoARS > 0) && (
                      <div className="flex justify-between border-t pt-1 text-xs text-gray-500">
                        <span>Total Equivalente ARS:</span>
                        <span>{formatARSFromNative(resumen.totalARS)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-between border-t pt-2 text-sm font-medium">
            <span>Total Pagado (USD):</span>
            <div className="text-right">
              <div>{formatAmount(totalPagado)}</div>
              {obtenerResumenDual &&
                (() => {
                  const resumen = obtenerResumenDual();
                  return (
                    resumen.totalPagadoARS > 0 && (
                      <div className="text-xs text-gray-500">
                        ≈ {formatARSFromNative(resumen.totalARS)}
                      </div>
                    )
                  );
                })()}
            </div>
          </div>
          {Math.abs(totalPagado - montoTotal) > 0.01 && (
            <div
              className={`flex justify-between text-sm ${
                totalPagado > montoTotal ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              <span>Diferencia:</span>
              <span className="font-medium">
                {totalPagado > montoTotal ? '+' : ''}
                {formatAmount(totalPagado - montoTotal)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
