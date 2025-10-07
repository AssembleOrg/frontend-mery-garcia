'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, DollarSign, Lock, Split, HandCoins } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { ItemComandaCreateNew, MetodoPagoNew, MonedaNew } from '@/services/unidadNegocio.service';
import { MONEDAS } from '@/lib/constants';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';

/**
 * TransactionSummary Component
 * 
 * This component displays a simplified summary showing only subtotal and total amounts.
 * It distinguishes between different currencies when services are paid using multiple currencies,
 * and displays a unified subtotal and total when all services use a single currency.
 * 
 * The total is calculated as the sum of discounted totals for all items.
 * 
 * @param items - Array of items in the transaction
 * @param tipo - Transaction type ('ingreso' or 'egreso')
 * @param className - Additional CSS classes
 */
interface TransactionSummaryProps {
  items: ItemComandaCreateNew[];
  tipo: 'ingreso' | 'egreso';
  className?: string;
  descuentosActivos?: boolean; // New prop to know if discounts are active
  señaActiva?: boolean; // New prop for global seña control
  onSeñaToggle?: (enabled: boolean) => void; // New prop for seña toggle handler
  cliente?: any; // Add cliente prop to check for available seña
  señaMonedas?: string[]; // Array of currencies to use for seña
  onSeñaMonedasChange?: (monedas: string[]) => void; // Handler for seña currency selection
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

export default function TransactionSummary({
  items,
  tipo,
  className = '',
  descuentosActivos = true, // Default to true for backward compatibility
  señaActiva = false, // Default to false for backward compatibility
  onSeñaToggle, // Optional handler for seña toggle
  cliente, // Client information for seña checking
  señaMonedas = [], // Default to empty array
  onSeñaMonedasChange, // Optional handler for seña currency selection
}: TransactionSummaryProps) {
  const { formatARS, formatUSD, formatARSFromNative, isExchangeRateValid, usdToArs } = useCurrencyConverter();
  const { descuentosPorMetodo } = useConfiguracion();


  // Helper function to format amount based on currency and frozen status
  const formatAmount = (amount: number, moneda: string, isFrozen: boolean) => {
    if (isFrozen) {
      return `🔒 ${formatARSFromNative(amount)}`;
    }
    return moneda === MONEDAS.ARS ? formatARSFromNative(amount) : formatUSD(amount);
  };

  // Helper function to check if item has frozen pricing
  const isItemFrozen = (item: ItemComandaCreateNew) => {
    return item.productoServicio?.esPrecioCongelado || false;
  };

  // Helper function to get item's currency based on frozen status and pagarEnPesos flag
  const getItemCurrency = (item: ItemComandaCreateNew): 'ARS' | 'USD' => {
    const isFrozen = isItemFrozen(item);
    const pagarEnPesos = (item as any).pagarEnPesos || false;
    
    // If frozen or paying in pesos, it's ARS
    if (isFrozen || pagarEnPesos) {
      return 'ARS';
    }
    
    return 'USD';
  };

  // Helper function to calculate item subtotal
  const getItemSubtotal = (item: ItemComandaCreateNew): number => {
    const isFrozen = isItemFrozen(item);
    const pagarEnPesos = (item as any).pagarEnPesos || false;
    
    // Get base price based on frozen status
    const precioBase = isFrozen 
      ? (item.productoServicio?.precioFijoARS || 0)
      : (item.precio || 0);
    
    const subtotal = precioBase * (item.cantidad || 1);
    
    // If paying in pesos and not frozen, convert USD to ARS
    if (pagarEnPesos && !isFrozen) {
      return usdToArs(subtotal);
    }
    
    return subtotal;
  };

  // Helper function to get item discount
  const getItemDiscount = (item: ItemComandaCreateNew): number => {
    const isFrozen = isItemFrozen(item);
    const pagarEnPesos = (item as any).pagarEnPesos || false;
    const discount = item.descuento || 0;
    
    // If paying in pesos and not frozen, convert USD to ARS
    if (pagarEnPesos && !isFrozen) {
      return usdToArs(discount);
    }
    
    return discount;
  };

  // Helper function to calculate item total (subtotal - discount)
  const getItemTotal = (item: ItemComandaCreateNew): number => {
    const subtotal = getItemSubtotal(item);
    const discount = getItemDiscount(item);
    return subtotal - discount;
  };

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { subtotal: number; total: number; totalConSeña: number; descuento: number; items: number }> = {};
    
    items.forEach(item => {
      const currency = getItemCurrency(item);
      const itemSubtotal = getItemSubtotal(item);
      const itemDiscount = getItemDiscount(item);
      const itemTotal = getItemTotal(item);
      
      if (!totals[currency]) {
        totals[currency] = { subtotal: 0, total: 0, totalConSeña: 0, descuento: 0, items: 0 };
      }
      
      totals[currency].subtotal += itemSubtotal;
      totals[currency].descuento += itemDiscount;
      totals[currency].total += itemTotal;
      totals[currency].totalConSeña = totals[currency].total;
      totals[currency].items += 1;
    });

    // Apply seña by currency if active
    if (señaActiva && señaMonedas.length > 0 && cliente?.señasDisponibles) {
      señaMonedas.forEach(moneda => {
        if (totals[moneda]) {
          let señaAplicada = 0;
          
          if (moneda === 'ARS' && cliente.señasDisponibles.ars > 0) {
            señaAplicada = Math.min(cliente.señasDisponibles.ars, totals[moneda].total);
          } else if (moneda === 'USD' && cliente.señasDisponibles.usd > 0) {
            señaAplicada = Math.min(cliente.señasDisponibles.usd, totals[moneda].total);
          }
          
          totals[moneda].totalConSeña = Math.max(0, totals[moneda].total - señaAplicada);
        }
      });
    }

    return totals;
  }, [
    items.length,
    items.map(item => {
      const pagarEnPesos = (item as any).pagarEnPesos || false;
      return `${item.precio}-${item.cantidad}-${item.descuento}-${pagarEnPesos}`;
    }).join(','),
    señaActiva,
    señaMonedas.join(','),
    cliente?.señasDisponibles,
    usdToArs
  ]);

  // Check if all items use the same currency
  const allSameCurrency = useMemo(() => {
    const currencies = new Set();
    
    items.forEach(item => {
      const currency = getItemCurrency(item);
      currencies.add(currency);
    });
    
    return currencies.size <= 1;
  }, [
    items.length,
    items.map(item => {
      const pagarEnPesos = (item as any).pagarEnPesos || false;
      return `${getItemCurrency(item)}-${pagarEnPesos}`;
    }).join(',')
  ]);

  // Calculate unified totals
  const unifiedTotals = useMemo(() => {
    let totalSubtotal = 0;
    let totalAmount = 0;
    let totalDescuento = 0;
    let hasFrozenItems = false;
    let primaryCurrency: MonedaNew = MONEDAS.USD as MonedaNew;

    items.forEach(item => {
      const currency = getItemCurrency(item);
      const itemSubtotal = getItemSubtotal(item);
      const itemDiscount = getItemDiscount(item);
      const itemTotal = getItemTotal(item);
      
      // Check if item is frozen or paying in pesos
      if (isItemFrozen(item) || (item as any).pagarEnPesos) {
        hasFrozenItems = true;
        primaryCurrency = MONEDAS.ARS as MonedaNew;
      }
      
      totalSubtotal += itemSubtotal;
      totalDescuento += itemDiscount;
      totalAmount += itemTotal;
    });

    // Apply seña if active and currencies selected
    let totalConSeña = totalAmount;
    if (señaActiva && señaMonedas.length > 0 && cliente?.señasDisponibles) {
      let señaAplicada = 0;
      
      señaMonedas.forEach(moneda => {
        if (moneda === 'ARS' && cliente.señasDisponibles.ars > 0) {
          // Convert ARS seña to USD for calculation if needed
          if (primaryCurrency === MONEDAS.USD) {
            // Convert ARS to USD using exchange rate
            señaAplicada += cliente.señasDisponibles.ars / 1330; // Assuming 1 USD = 1330 ARS
          } else {
            señaAplicada += cliente.señasDisponibles.ars;
          }
        } else if (moneda === 'USD' && cliente.señasDisponibles.usd > 0) {
          if (primaryCurrency === MONEDAS.ARS) {
            // Convert USD to ARS
            señaAplicada += cliente.señasDisponibles.usd * 1330; // Assuming 1 USD = 1330 ARS
          } else {
            señaAplicada += cliente.señasDisponibles.usd;
          }
        }
      });
      
      // Apply seña (cannot exceed total amount)
      totalConSeña = Math.max(0, totalAmount - señaAplicada);
    }

    return { totalSubtotal, totalAmount, totalConSeña, totalDescuento, hasFrozenItems, primaryCurrency };
  }, [
    items.length,
    items.map(item => {
      const pagarEnPesos = (item as any).pagarEnPesos || false;
      return `${item.precio}-${item.cantidad}-${item.descuento}-${pagarEnPesos}-${isItemFrozen(item)}`;
    }).join(','),
    señaActiva,
    señaMonedas.join(','),
    cliente?.señasDisponibles,
    usdToArs
  ]);

  // Get the primary currency for unified display
  const getPrimaryCurrency = () => {
    const currencies = Object.keys(totalsByCurrency);
    if (currencies.length === 1) {
      return currencies[0];
    }
    // If multiple currencies, prefer ARS if any items are frozen
    const hasFrozen = items.some(isItemFrozen);
    return hasFrozen ? MONEDAS.ARS : MONEDAS.USD;
  };

  const primaryCurrency = getPrimaryCurrency();
  const isPrimaryFrozen = items.some(isItemFrozen);
  const currencies = Object.keys(totalsByCurrency);
  const hasMultipleCurrencies = currencies.length > 1;

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="border border-gray-300 bg-white shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
            <Calculator className="h-5 w-5" />
            Resumen de Transacción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seña Control */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Aplicar Seña</div>
                  <div className="text-xs text-gray-500">
                    {!cliente?.señasDisponibles || (cliente.señasDisponibles.ars <= 0 && cliente.señasDisponibles.usd <= 0)
                      ? 'Sin seña disponible'
                      : señaActiva 
                        ? 'Seña activa - El cliente consume prepago' 
                        : 'Sin seña - Pago completo'
                    }
                  </div>
                </div>
              </div>
              {onSeñaToggle && (
                <Checkbox
                  checked={señaActiva}
                  onCheckedChange={onSeñaToggle}
                  disabled={!cliente?.señasDisponibles || (cliente.señasDisponibles.ars <= 0 && cliente.señasDisponibles.usd <= 0)}
                  className={`h-5 w-5 border-2 ${
                    señaActiva 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600' 
                      : 'border-gray-300 bg-white'
                  } ${
                    !cliente?.señasDisponibles || (cliente.señasDisponibles.ars <= 0 && cliente.señasDisponibles.usd <= 0)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-blue-400 cursor-pointer'
                  }`}
                />
              )}
            </div>
            
            {/* Seña Currency Selection */}
            {señaActiva && cliente?.señasDisponibles && onSeñaMonedasChange && (
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs font-medium text-blue-700 mb-2">Seleccionar monedas para seña:</div>
                <div className="space-y-2">
                  {cliente.señasDisponibles.ars > 0 && (
                    <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={señaMonedas.includes('ARS')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSeñaMonedasChange([...señaMonedas, 'ARS']);
                          } else {
                            onSeñaMonedasChange(señaMonedas.filter(m => m !== 'ARS'));
                          }
                        }}
                        className={`h-4 w-4 border-2 ${
                          señaMonedas.includes('ARS')
                            ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-600' 
                            : 'border-gray-300 bg-white'
                        } hover:border-green-400 cursor-pointer`}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          ARS: {formatARSFromNative(cliente.señasDisponibles.ars)}
                        </span>
                        <div className="text-xs text-gray-500">Peso Argentino</div>
                      </div>
                    </div>
                  )}
                  {cliente.señasDisponibles.usd > 0 && (
                    <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={señaMonedas.includes('USD')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSeñaMonedasChange([...señaMonedas, 'USD']);
                          } else {
                            onSeñaMonedasChange(señaMonedas.filter(m => m !== 'USD'));
                          }
                        }}
                        className={`h-4 w-4 border-2 ${
                          señaMonedas.includes('USD')
                            ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-600' 
                            : 'border-gray-300 bg-white'
                        } hover:border-green-400 cursor-pointer`}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          USD: {formatUSD(cliente.señasDisponibles.usd)}
                        </span>
                        <div className="text-xs text-gray-500">Dólar Estadounidense</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Seña Information */}
            {!cliente ? (
              <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-200">
                <div className="text-gray-600 text-xs">
                  Seleccione un cliente para ver información de seña
                </div>
              </div>
            ) : cliente?.señasDisponibles ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Seña disponible ARS:</span>
                  <span className="font-medium text-green-600">
                    {formatARSFromNative(cliente.señasDisponibles.ars || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Seña disponible USD:</span>
                  <span className="font-medium text-green-600">
                    {formatUSD(cliente.señasDisponibles.usd || 0)}
                  </span>
                </div>
                
                {/* Seña Usage Info */}
                {señaActiva && señaMonedas.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-200">
                    <div className="text-blue-700 text-xs">
                      <div className="font-medium">Seña aplicada en:</div>
                      <div className="font-medium">
                        {señaMonedas.map(moneda => 
                          moneda === 'ARS' 
                            ? `ARS: ${formatARSFromNative(cliente.señasDisponibles.ars)}`
                            : `USD: ${formatUSD(cliente.señasDisponibles.usd)}`
                        ).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-200">
                <div className="text-yellow-700 text-xs">
                  El cliente no tiene seña disponible
                </div>
              </div>
            )}
          </div>

          {/* Multiple Currencies Display */}
          {hasMultipleCurrencies && currencies.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Resumen por Moneda:
              </div>
              
              {currencies.map((currency) => {
                const totals = totalsByCurrency[currency];
                const isFrozen = items.some(item => 
                  isItemFrozen(item) && getItemCurrency(item) === currency
                );
                
                return (
                  <div key={currency} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {currency}
                        </Badge>
                        <span className="text-sm font-medium">
                          {totals.items} {tipo === 'ingreso' ? 'servicio' : 'concepto'}{totals.items > 1 ? 's' : ''}
                        </span>
                      </div>
                      {isFrozen && <Lock className="h-4 w-4 text-orange-600" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">
                          {formatAmount(totals.subtotal, currency, isFrozen)}
                        </span>
                      </div>
                      {totals.descuento > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Descuento:</span>
                          <span className="font-medium">
                            -{formatAmount(totals.descuento, currency, isFrozen)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm border-t pt-1">
                        <span>Total:</span>
                        <span className="font-semibold">
                          {formatAmount(totals.total, currency, isFrozen)}
                        </span>
                      </div>
                      {/* Show total with seña if different */}
                      {señaActiva && señaMonedas.includes(currency) && totals.totalConSeña < totals.total && (
                        <div className="flex justify-between text-sm border-t pt-1">
                          <span className="text-blue-700">Total con Seña:</span>
                          <span className="font-semibold text-blue-700">
                            {formatAmount(totals.totalConSeña, currency, isFrozen)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unified Display - Single Currency */}
          {!hasMultipleCurrencies && currencies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                <span className="font-medium">
                  {formatAmount(unifiedTotals.totalSubtotal, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
                </span>
              </div>
              
              {unifiedTotals.totalDescuento > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm font-medium">Descuento:</span>
                  <span className="font-medium">
                    -{formatAmount(unifiedTotals.totalDescuento, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold">
                  {formatAmount(unifiedTotals.totalAmount, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
                </span>
              </div>
              
              {/* Seña Applied Display */}
              {señaActiva && señaMonedas.length > 0 && unifiedTotals.totalConSeña < unifiedTotals.totalAmount && (
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium text-blue-700">Total con Seña:</span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatAmount(unifiedTotals.totalConSeña, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
                  </span>
                </div>
              )}
              
              {unifiedTotals.hasFrozenItems && (
                <div className="flex items-center gap-2 rounded-md bg-orange-100 p-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-700">
                    Transacción con precios congelados en ARS
                  </span>
                </div>
              )}
            </div>
          )}

          {/* No Payment Methods */}
          {currencies.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No hay métodos de pago configurados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 