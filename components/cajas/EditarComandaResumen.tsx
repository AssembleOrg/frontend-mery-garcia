'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComandaNew, TipoDeComandaNew } from '@/services/unidadNegocio.service';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface EditarComandaResumenProps {
  comanda: ComandaNew;
  tipo: 'ingreso' | 'egreso';
}

export default function EditarComandaResumen({
  comanda,
  tipo,
}: EditarComandaResumenProps) {
  const { formatARS, formatUSD, formatDual, isExchangeRateValid } = useCurrencyConverter();

  // Calcular totales
  const subtotalBase = comanda.items.reduce((sum, item) => {
    return sum + ((item.precio || 0) * (item.cantidad || 0));
  }, 0);

  const totalDescuentos = comanda.items.reduce((sum, item) => {
    return sum + (item.descuento || 0);
  }, 0);

  const subtotalConDescuentos = subtotalBase - totalDescuentos;

  const totalPagado = comanda.metodosPago.reduce((sum, metodo) => {
    return sum + (metodo.montoFinal || 0);
  }, 0);

  const diferencia = totalPagado - subtotalConDescuentos;

  return (
    <Card className="border border-gray-300 bg-white shadow-md">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-lg text-gray-900">
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Subtotal base */}
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
            <div className="text-sm text-gray-700">
              Subtotal base
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatUSD(subtotalBase)}
              </div>
              {isExchangeRateValid && (
                <div className="text-xs text-gray-600">
                  {formatARS(subtotalBase)}
                </div>
              )}
            </div>
          </div>

          {/* Descuentos por ítem */}
          {totalDescuentos > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-100 to-orange-200 p-3 shadow-sm">
              <div className="text-sm text-orange-700">
                Descuentos por ítem
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-orange-700">
                  -{formatUSD(totalDescuentos)}
                </div>
                {isExchangeRateValid && (
                  <div className="text-xs text-orange-600">
                    -{formatARS(totalDescuentos)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total a pagar */}
          <div className="flex items-center justify-between rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-200 p-3 shadow-md">
            <div className="text-sm font-medium text-blue-900">
              Total a pagar
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-blue-900">
                {formatUSD(subtotalConDescuentos)}
              </div>
              {isExchangeRateValid && (
                <div className="text-sm text-blue-700">
                  {formatARS(subtotalConDescuentos)}
                </div>
              )}
            </div>
          </div>

          {/* Total pagado */}
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-100 to-green-200 p-3 shadow-sm">
            <div className="text-sm text-green-700">
              Total pagado
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-700">
                {formatUSD(totalPagado)}
              </div>
              {isExchangeRateValid && (
                <div className="text-xs text-green-600">
                  {formatARS(totalPagado)}
                </div>
              )}
            </div>
          </div>

          {/* Diferencia/Balance */}
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
            <div className="text-sm text-gray-700">Balance</div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold ${
                  Math.abs(diferencia) < 0.01
                    ? 'text-green-600'
                    : diferencia > 0
                      ? 'text-blue-600'
                      : 'text-red-600'
                }`}
              >
                {Math.abs(diferencia) < 0.01
                  ? '✓ Balanceado'
                  : diferencia > 0
                    ? `+${formatUSD(diferencia)} (exceso)`
                    : `${formatUSD(diferencia)} (faltante)`}
              </div>
              {isExchangeRateValid && Math.abs(diferencia) > 0.01 && (
                <div className="text-xs text-gray-600">
                  {diferencia > 0 ? '+' : ''}{formatARS(diferencia)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 