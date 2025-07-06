'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DollarSign,
} from 'lucide-react';
import { MetodoPagoForm } from '@/hooks/useMetodosPago';
import { METODOS_PAGO, METODO_PAGO_LABELS } from '@/lib/constants';
import { formatCurrencyArs } from '@/lib/utils';

interface MetodosPagoSectionProps {
  metodosPago: MetodoPagoForm[];
  totalPagado: number;
  totalRecargos: number;
  montoTotal: number;
  isReadOnly?: boolean;
  onAgregarMetodo: () => void;
  onEliminarMetodo: (index: number) => void;
  onActualizarMetodo: (
    index: number,
    campo: keyof MetodoPagoForm,
    valor: string | number
  ) => void;
  className?: string;
}

export default function MetodosPagoSection({
  metodosPago,
  totalPagado,
  totalRecargos,
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
      case METODOS_PAGO.MIXTO:
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const diferencia = totalPagado - montoTotal;
  const hayDiferencia = Math.abs(diferencia) > 0.01;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Métodos de Pago
          </CardTitle>
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAgregarMetodo}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de métodos de pago */}
        <div className="space-y-3">
          {metodosPago.map((metodo, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3"
            >
              <div className="flex items-center gap-2">
                {getPaymentIcon(metodo.tipo)}
                <span className="text-sm font-medium">
                  {
                    METODO_PAGO_LABELS[
                      metodo.tipo as keyof typeof METODO_PAGO_LABELS
                    ]
                  }
                </span>
              </div>

              <div className="flex flex-1 items-center gap-2">
                {/* Selector de tipo */}
                <Select
                  value={metodo.tipo}
                  onValueChange={(value) =>
                    onActualizarMetodo(index, 'tipo', value)
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={METODOS_PAGO.EFECTIVO}>
                      {METODO_PAGO_LABELS.efectivo}
                    </SelectItem>
                    <SelectItem value={METODOS_PAGO.TARJETA}>
                      {METODO_PAGO_LABELS.tarjeta}
                    </SelectItem>
                    <SelectItem value={METODOS_PAGO.TRANSFERENCIA}>
                      {METODO_PAGO_LABELS.transferencia}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Monto */}
                <div className="flex-1">
                  <Input
                    type="number"
                    value={metodo.monto}
                    onChange={(e) =>
                      onActualizarMetodo(
                        index,
                        'monto',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="Monto"
                    className="text-right"
                    disabled={isReadOnly}
                  />
                </div>

                {/* Recargo */}
                {metodo.recargoPorcentaje > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{metodo.recargoPorcentaje}%
                  </Badge>
                )}

                {/* Monto final */}
                <div className="w-24 text-right text-sm font-medium">
                  {formatCurrencyArs(metodo.montoFinal)}
                </div>

                {/* Botón eliminar */}
                {!isReadOnly && metodosPago.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEliminarMetodo(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="space-y-2 rounded-lg border bg-blue-50 p-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal pagado:</span>
            <span>{formatCurrencyArs(totalPagado - totalRecargos)}</span>
          </div>
          {totalRecargos > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Recargos:</span>
              <span>+{formatCurrencyArs(totalRecargos)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total pagado:</span>
            <span className={hayDiferencia ? 'text-red-600' : 'text-green-600'}>
              {formatCurrencyArs(totalPagado)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Monto total:</span>
            <span>{formatCurrencyArs(montoTotal)}</span>
          </div>
          {hayDiferencia && (
            <div className="flex justify-between text-sm font-medium text-red-600">
              <span>Diferencia:</span>
              <span>
                {diferencia > 0 ? '+' : ''}
                {formatCurrencyArs(diferencia)}
              </span>
            </div>
          )}
        </div>

        {/* Mensaje de validación */}
        {hayDiferencia && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {diferencia > 0
              ? 'El monto pagado es mayor al total. Verifique los importes.'
              : 'El monto pagado es menor al total. Agregue métodos de pago o ajuste los importes.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
