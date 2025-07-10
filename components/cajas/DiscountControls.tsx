'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Percent, X, Calculator } from 'lucide-react';
import { formatCurrencyArs } from '@/lib/utils';

interface DiscountControlsProps {
  descuentoPorcentaje: number;
  montoDescuento: number;
  precioBase: number;
  onAplicarDescuento: (porcentaje: number) => void;
  onEliminarDescuento: () => void;
  label?: string;
  size?: 'sm' | 'md';
  maxDescuento?: number;
  disabled?: boolean;
}

export function DiscountControls({
  descuentoPorcentaje,
  montoDescuento,
  precioBase,
  onAplicarDescuento,
  onEliminarDescuento,
  label = 'Descuento',
  size = 'md',
  maxDescuento = 50,
  disabled = false,
}: DiscountControlsProps) {
  const [porcentajeInput, setPorcentajeInput] = useState(
    descuentoPorcentaje.toString()
  );
  const [mostrarInput, setMostrarInput] = useState(false);

  const handleAplicar = () => {
    const porcentaje = parseFloat(porcentajeInput);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > maxDescuento) {
      return;
    }
    onAplicarDescuento(porcentaje);
    setMostrarInput(false);
  };

  const handleEliminar = () => {
    onEliminarDescuento();
    setPorcentajeInput('0');
    setMostrarInput(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAplicar();
    } else if (e.key === 'Escape') {
      setMostrarInput(false);
      setPorcentajeInput(descuentoPorcentaje.toString());
    }
  };

  const tieneDescuento = descuentoPorcentaje > 0;
  const inputSize = size === 'sm' ? 'h-8 text-xs' : 'h-10';
  const buttonSize = size === 'sm' ? 'h-8 px-2 text-xs' : 'h-10 px-3';

  return (
    <div className="space-y-2">
      <Label className={size === 'sm' ? 'text-xs' : 'text-sm'}>{label}</Label>

      <div className="flex items-center gap-2">
        {!mostrarInput ? (
          <>
            {tieneDescuento ? (
              <>
                <Badge
                  variant="secondary"
                  className="border-green-200 bg-green-100 text-green-800"
                >
                  <Percent className="mr-1 h-3 w-3" />
                  {descuentoPorcentaje}% (-{formatCurrencyArs(montoDescuento)})
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`${buttonSize} text-red-600 hover:text-red-700`}
                  onClick={handleEliminar}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={buttonSize}
                  onClick={() => {
                    setPorcentajeInput(descuentoPorcentaje.toString());
                    setMostrarInput(true);
                  }}
                  disabled={disabled}
                >
                  <Calculator className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`${buttonSize} text-green-600 hover:text-green-700`}
                onClick={() => {
                  setPorcentajeInput('10');
                  setMostrarInput(true);
                }}
                disabled={disabled || precioBase <= 0}
              >
                <Percent className="mr-1 h-3 w-3" />
                Aplicar descuento
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="number"
                value={porcentajeInput}
                onChange={(e) => setPorcentajeInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`${inputSize} w-20 pr-6`}
                placeholder="%"
                min="0"
                max={maxDescuento}
                step="0.1"
                autoFocus
                disabled={disabled}
              />
              <Percent className="absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 transform text-gray-400" />
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              className={`${buttonSize} bg-green-600 hover:bg-green-700`}
              onClick={handleAplicar}
              disabled={disabled}
            >
              Aplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={buttonSize}
              onClick={() => {
                setMostrarInput(false);
                setPorcentajeInput(descuentoPorcentaje.toString());
              }}
              disabled={disabled}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {mostrarInput && (
        <p className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          Descuento máximo: {maxDescuento}%
        </p>
      )}
    </div>
  );
}
