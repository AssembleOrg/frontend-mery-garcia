'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, User, Lock, Percent } from 'lucide-react';
import { ItemComandaCreateNew, TrabajadorNew } from '@/services/unidadNegocio.service';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatARSNative } from '@/lib/utils';

interface ItemFormSimpleProps {
  item: ItemComandaCreateNew;
  index: number;
  onUpdateItem: (itemId: string, updates: Partial<ItemComandaCreateNew>) => void;
  onRemoveItem: (itemId: string) => void;
  tipo: 'ingreso' | 'egreso';
  personal?: TrabajadorNew[];
  disabled?: boolean;
  showItemNumber?: boolean;
}

export default function ItemFormSimple({
  item,
  index,
  onUpdateItem,
  onRemoveItem,
  tipo,
  personal = [],
  disabled = false,
  showItemNumber = true,
}: ItemFormSimpleProps) {
  const { formatUSD, formatARSFromNative, usdToArs } = useCurrencyConverter();
  
  // Determinar si el item tiene precio congelado (precio en ARS fijo)
  const esPrecioCongelado = item.productoServicio?.esPrecioCongelado || false;
  const esMonedaUSD = !esPrecioCongelado; // Si no está congelado, es USD
  
  // Calcular precio base
  const precioBase = esPrecioCongelado 
    ? (item.productoServicio?.precioFijoARS || 0)
    : (item.precio || 0);

  // Calcular porcentaje inicial desde el monto de descuento (si existe)
  const calcularPorcentajeInicial = () => {
    if (item.descuento && precioBase > 0 && item.cantidad > 0) {
      const subtotalOriginal = precioBase * item.cantidad;
      return (item.descuento / subtotalOriginal) * 100;
    }
    return 0;
  };

  const [localQuantity, setLocalQuantity] = useState(item.cantidad || 1);
  const [localDescuento, setLocalDescuento] = useState(calcularPorcentajeInicial());
  
  // Estado para "pagar en pesos" - solo para items en USD no congelados
  const [pagarEnPesos, setPagarEnPesos] = useState(item.pagarEnPesos || false);

  // Calcular subtotal antes de descuento
  const subtotalSinDescuento = precioBase * localQuantity;

  // Calcular descuento en monto
  const montoDescuento = (subtotalSinDescuento * localDescuento) / 100;

  // Calcular subtotal final
  const subtotalFinal = subtotalSinDescuento - montoDescuento;

  // Actualizar item cuando cambian los valores locales
  useEffect(() => {
    const updates: Partial<ItemComandaCreateNew> = {
      cantidad: localQuantity,
      descuento: montoDescuento,
      subtotal: subtotalFinal,
      pagarEnPesos: pagarEnPesos,
    };
    
    onUpdateItem(item.id || '', updates);
  }, [localQuantity, localDescuento, pagarEnPesos]);

  const handleQuantityChange = (value: string) => {
    const cantidad = parseInt(value) || 1;
    setLocalQuantity(Math.max(1, cantidad));
  };

  const handleDescuentoChange = (value: string) => {
    const descuento = parseFloat(value) || 0;
    setLocalDescuento(Math.max(0, Math.min(100, descuento))); // Entre 0 y 100%
  };

  const handlePagarEnPesosChange = (checked: boolean) => {
    setPagarEnPesos(checked);
  };

  const handleResponsableChange = (trabajadorId: string) => {
    onUpdateItem(item.id || '', {
      trabajadorId: trabajadorId,
      trabajador: personal.find(p => p.id === trabajadorId),
    });
  };

  const formatPrecio = () => {
    if (esPrecioCongelado) {
      return `🔒 ${formatARSFromNative(precioBase)}`;
    }
    
    if (pagarEnPesos) {
      const precioEnPesos = usdToArs(precioBase);
      return `${formatUSD(precioBase)} → ${formatARSNative(precioEnPesos)}`;
    }
    
    return formatUSD(precioBase);
  };

  return (
    <Card className="border-[#f9bbc4]/30 bg-white p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showItemNumber && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f9bbc4] text-xs font-bold text-white">
                {index + 1}
              </span>
            )}
            <h3 className="font-semibold text-[#4a3540]">{item.nombre}</h3>
            {esPrecioCongelado && (
              <Lock className="h-4 w-4 text-amber-600" title="Precio congelado en ARS" />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem(item.id || '')}
            disabled={disabled}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Información del precio */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Precio unitario ({item.productoServicio?.precio}): {item.productoServicio?.esPrecioCongelado ? 'ARS' : 'USD'}</span>
            <span className="font-semibold text-[#4a3540]">{formatPrecio()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Cantidad */}
          <div>
            <Label className="text-sm">Cantidad</Label>
            <Input
              type="number"
              min="1"
              value={localQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={disabled}
              className="border-[#f9bbc4]/30"
            />
          </div>

          {/* Descuento % */}
          <div>
            <Label className="text-sm flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Descuento (%)
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={localDescuento}
              onChange={(e) => handleDescuentoChange(e.target.value)}
              disabled={disabled}
              className="border-[#f9bbc4]/30"
              placeholder="0"
            />
          </div>
        </div>

        {/* Checkbox Pagar en Pesos - Solo para items en USD no congelados */}
        {esMonedaUSD && !esPrecioCongelado && (
          <div className="flex items-center space-x-2 rounded-lg border border-[#f9bbc4]/30 bg-blue-50/50 p-3">
            <Checkbox
              id={`pagar-pesos-${item.id}`}
              checked={pagarEnPesos}
              onCheckedChange={handlePagarEnPesosChange}
              disabled={disabled}
            />
            <label
              htmlFor={`pagar-pesos-${item.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Pagar en pesos (convertir a ARS)
            </label>
          </div>
        )}

        {/* Selector de Responsables */}
        {tipo === 'ingreso' && (() => {
          // Filtrar personal basado en la unidad de negocio del servicio
          const unidadNegocioNombre = item.productoServicio?.unidadNegocio?.nombre?.toLowerCase().trim() || '';
          // Verificar si es tattoo o cosmetic tattoo (más flexible para detectar variaciones)
          const esTattooOCosmeticTattoo = unidadNegocioNombre.includes('tattoo') || 
                                         unidadNegocioNombre.includes('cosmetic');
          
          // Debug temporal - remover después de verificar
          if (item.productoServicio) {
            console.log('🔍 Debug filtro responsable:', {
              nombreServicio: item.productoServicio.nombre,
              unidadNegocio: item.productoServicio.unidadNegocio,
              unidadNegocioNombre,
              esTattooOCosmeticTattoo,
              personalTotal: personal.length
            });
          }
          
          // Si el servicio es de tattoo o cosmetic tattoo, solo mostrar "mery garcía"
          const personalFiltrado = esTattooOCosmeticTattoo
            ? personal.filter((p) => {
                const nombreLower = p.nombre.toLowerCase().trim();
                // Buscar "mery" en el nombre (puede ser "Mery García", "Mery Garcia", etc.)
                return nombreLower.includes('mery');
              })
            : personal;
          
          return (
            <div>
              <Label className="text-sm mb-2">Responsable</Label>
              <Select
                value={item.trabajadorId || ''}
                onValueChange={handleResponsableChange}
                disabled={disabled}
              >
                <SelectTrigger className="border-[#f9bbc4]/30">
                  <SelectValue placeholder="Seleccionar responsable" />
                </SelectTrigger>
                <SelectContent>
                  {personalFiltrado.length > 0 ? (
                    personalFiltrado.map((trabajador) => (
                      <SelectItem key={trabajador.id} value={trabajador.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {trabajador.nombre}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No hay responsables disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          );
        })()}

        {/* Resumen de montos */}
        <div className="space-y-1 rounded-lg border border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              {esPrecioCongelado || pagarEnPesos 
                ? formatARSFromNative(subtotalSinDescuento)
                : formatUSD(subtotalSinDescuento)
              }
            </span>
          </div>
          
          {localDescuento > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Descuento ({localDescuento}%):</span>
              <span className="font-medium text-green-600">
                -
                {esPrecioCongelado || pagarEnPesos
                  ? formatARSFromNative(montoDescuento)
                  : formatUSD(montoDescuento)
                }
              </span>
            </div>
          )}
          
          <div className="flex justify-between border-t border-[#f9bbc4]/30 pt-1">
            <span className="font-semibold text-[#4a3540]">Total:</span>
            <span className="font-bold text-[#4a3540]">
              {esPrecioCongelado || pagarEnPesos
                ? formatARSFromNative(subtotalFinal)
                : formatUSD(subtotalFinal)
              }
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

