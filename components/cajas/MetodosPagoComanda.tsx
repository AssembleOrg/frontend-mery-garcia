'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Gift,
  DollarSign, 
  QrCode
} from 'lucide-react';
import { MetodoPagoNew, TipoPagoNew, MonedaNew } from '@/services/unidadNegocio.service';

interface MetodosPagoComandaProps {
  metodosPago: Partial<MetodoPagoNew>[];
  onChange: (metodos: Partial<MetodoPagoNew>[]) => void;
  disabled?: boolean;
}

const METODOS_PAGO_CONFIG = {
  [TipoPagoNew.EFECTIVO]: {
    label: 'Efectivo',
    icon: Banknote,
    color: 'text-green-600',
  },
  [TipoPagoNew.TARJETA]: {
    label: 'Tarjeta',
    icon: CreditCard,
    color: 'text-blue-600',
  },
  [TipoPagoNew.TRANSFERENCIA]: {
    label: 'Transferencia',
    icon: Smartphone,
    color: 'text-purple-600',
  },
  [TipoPagoNew.GIFT_CARD]: {
    label: 'Gift Card',
    icon: Gift,
    color: 'text-pink-600',
  },

  [TipoPagoNew.QR]: {
    label: 'QR',
    icon: QrCode,
    color: 'text-green-600',
  },
  [TipoPagoNew.MERCADO_PAGO]: {
    label: 'Mercado Pago',
    icon: DollarSign,
    color: 'text-cyan-600',
  },
};

export default function MetodosPagoComanda({
  metodosPago,
  onChange,
  disabled = false,
}: MetodosPagoComandaProps) {
  
  const agregarMetodoPago = () => {
    const nuevoMetodo: Partial<MetodoPagoNew> = {
      tipo: TipoPagoNew.EFECTIVO,
      monto: 0,
      moneda: MonedaNew.ARS,
    };
    onChange([...metodosPago, nuevoMetodo]);
  };

  const eliminarMetodoPago = (index: number) => {
    const nuevosMetodos = metodosPago.filter((_, i) => i !== index);
    onChange(nuevosMetodos);
  };

  const actualizarMetodoPago = (index: number, campo: keyof MetodoPagoNew, valor: any) => {
    const nuevosMetodos = [...metodosPago];
    nuevosMetodos[index] = {
      ...nuevosMetodos[index],
      [campo]: valor,
    };
    onChange(nuevosMetodos);
  };

  const formatearMonto = (valor: string): string => {
    // Remover todo excepto números y coma decimal
    const numeroLimpio = valor.replace(/[^\d,]/g, '');
    
    // Separar parte entera y decimal (coma como decimal)
    const partes = numeroLimpio.split(',');
    const parteEntera = partes[0];
    const parteDecimal = partes[1];

    // Formatear parte entera con separadores de miles (punto)
    const enteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Retornar con decimal si existe (coma como separador decimal)
    return parteDecimal !== undefined 
      ? `${enteraFormateada},${parteDecimal.slice(0, 2)}`
      : enteraFormateada;
  };

  const parsearMonto = (valorFormateado: string): number => {
    // Remover puntos (separador de miles) y reemplazar coma por punto para parseFloat
    const numeroLimpio = valorFormateado.replace(/\./g, '').replace(',', '.');
    const numero = parseFloat(numeroLimpio);
    return isNaN(numero) ? 0 : numero;
  };

  const handleMontoChange = (index: number, valorFormateado: string) => {
    const monto = parsearMonto(valorFormateado);
    actualizarMetodoPago(index, 'monto', monto);
  };

  const calcularTotal = () => {
    return metodosPago.reduce((total, metodo) => total + (metodo.monto || 0), 0);
  };

  const calcularTotalPorMoneda = (moneda: 'ARS' | 'USD') => {
    return metodosPago
      .filter(m => m.moneda === moneda)
      .reduce((total, metodo) => total + (metodo.monto || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-[#4a3540]">
          Métodos de Pago
        </Label>
        <Button
          type="button"
          onClick={agregarMetodoPago}
          disabled={disabled}
          size="sm"
          className="bg-[#f9bbc4] hover:bg-[#e292a3]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Método
        </Button>
      </div>

      {metodosPago.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-gray-500">
            No hay métodos de pago agregados. Haz clic en "Agregar Método" para comenzar.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {metodosPago.map((metodo, index) => {
          const tipo = metodo.tipo || TipoPagoNew.EFECTIVO;
          const config = METODOS_PAGO_CONFIG[tipo];
          const IconComponent = config.icon;
          
          return (
            <Card key={index} className="border-[#f9bbc4]/30 bg-white p-4">
              <div className="grid grid-cols-12 gap-3 items-end">
                {/* Tipo de Pago */}
                <div className="col-span-12 sm:col-span-4">
                  <Label className="text-sm">Tipo de Pago</Label>
                  <Select
                    value={metodo.tipo}
                    onValueChange={(value) => actualizarMetodoPago(index, 'tipo', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="border-[#f9bbc4]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(METODOS_PAGO_CONFIG).map(([tipo, config]) => (
                        <SelectItem key={tipo} value={tipo}>
                          <div className="flex items-center gap-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Moneda */}
                <div className="col-span-6 sm:col-span-2">
                  <Label className="text-sm">Moneda</Label>
                  <Select
                    value={metodo.moneda}
                    onValueChange={(value: 'ARS' | 'USD') => actualizarMetodoPago(index, 'moneda', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="border-[#f9bbc4]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Monto */}
                <div className="col-span-6 sm:col-span-5">
                  <Label className="text-sm">Monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {metodo.moneda === 'ARS' ? '$' : 'US$'}
                    </span>
                    <Input
                      type="text"
                      value={formatearMonto(String(metodo.monto || 0))}
                      onChange={(e) => handleMontoChange(index, e.target.value)}
                      disabled={disabled}
                      className="border-[#f9bbc4]/30 pl-12"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Botón Eliminar */}
                <div className="col-span-12 sm:col-span-1 flex sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarMetodoPago(index)}
                    disabled={disabled || metodosPago.length === 1}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Resumen de totales */}
      {metodosPago.length > 0 && (
        <Card className="border-[#f9bbc4]/50 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5 p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#4a3540]">Total ARS:</span>
              <span className="font-bold text-green-700">
                $ {formatearMonto(String(calcularTotalPorMoneda('ARS')))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#4a3540]">Total USD:</span>
              <span className="font-bold text-green-700">
                US$ {formatearMonto(String(calcularTotalPorMoneda('USD')))}
              </span>
            </div>
            <div className="border-t border-[#f9bbc4]/30 pt-2 flex justify-between">
              <span className="font-semibold text-[#4a3540]">Métodos configurados:</span>
              <span className="font-bold text-[#4a3540]">{metodosPago.length}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

