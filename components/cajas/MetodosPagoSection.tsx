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
import { METODOS_PAGO } from '@/lib/constants';
import { formatUSD } from '@/lib/utils';
import { MetodoPagoForm } from '@/hooks/useMetodosPago';

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
    valor: string | number
  ) => void;
  className?: string;
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
}: MetodosPagoSectionProps) {
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
          <div key={index} className="flex items-center gap-2">
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
                <SelectItem value={METODOS_PAGO.EFECTIVO}>Efectivo</SelectItem>
                <SelectItem value={METODOS_PAGO.TARJETA}>Tarjeta</SelectItem>
                <SelectItem value={METODOS_PAGO.TRANSFERENCIA}>
                  Transferencia
                </SelectItem>
                <SelectItem value={METODOS_PAGO.GIFTCARD}>Gift Card</SelectItem>
                <SelectItem value={METODOS_PAGO.QR}>QR</SelectItem>
                <SelectItem value={METODOS_PAGO.MIXTO}>Mixto</SelectItem>
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
                -{formatUSD(metodo.descuentoAplicado)}
              </div>
            )}

            <div className="min-w-[80px] text-sm font-medium">
              = {formatUSD(metodo.montoFinal)}
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
        ))}

        {/* Resumen con descuentos */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Total a Pagar:</span>
            <span className="font-medium">{formatUSD(montoTotal)}</span>
          </div>
          {totalDescuentos > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuentos Aplicados:</span>
              <span className="font-medium">-{formatUSD(totalDescuentos)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-sm font-medium">
            <span>Total Pagado:</span>
            <span>{formatUSD(totalPagado)}</span>
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
                {formatUSD(totalPagado - montoTotal)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
