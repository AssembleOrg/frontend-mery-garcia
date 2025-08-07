'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, Lock, Split } from 'lucide-react';
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
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

export default function TransactionSummary({
  items,
  tipo,
  className = '',
}: TransactionSummaryProps) {
  const { formatARS, formatUSD, formatARSFromNative, isExchangeRateValid } = useCurrencyConverter();
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

  // Helper function to get the first payment method from an item
  const getFirstPaymentMethod = (item: ItemComandaCreateNew): Partial<MetodoPagoNew> | null => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago?.[0] || null;
  };

  // Helper function to get the second payment method from an item (for split payments)
  const getSecondPaymentMethod = (item: ItemComandaCreateNew): Partial<MetodoPagoNew> | null => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago?.[1] || null;
  };

  // Helper function to check if item has split payment enabled
  const isSplitPaymentEnabled = (item: ItemComandaCreateNew) => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago && itemWithPayment.metodosPago.length > 1;
  };

  // Helper function to check if any item has split payment
  const hasAnySplitPayment = () => {
    return items.some(item => isSplitPaymentEnabled(item));
  };

  // Helper function to calculate total discount for an item
  const calculateTotalDiscount = (item: ItemComandaCreateNew) => {
    const paymentMethod = getFirstPaymentMethod(item);
    if (!paymentMethod) return 0;
    
    const porcentajeDescuento = descuentosPorMetodo[paymentMethod.tipo as keyof typeof descuentosPorMetodo] || 0;
    if (porcentajeDescuento === 0) return 0;
    
    // Apply discount to the total item amount (subtotal)
    const totalAmount = (item.precio || 0) * (item.cantidad || 1);
    const descuento = (totalAmount * porcentajeDescuento) / 100;
    
    return descuento;
  };

  // Helper function to calculate discounted total for an item
  const calculateDiscountedTotal = (item: ItemComandaCreateNew) => {
    const totalDiscount = calculateTotalDiscount(item);
    const subtotal = (item.precio || 0) * (item.cantidad || 1);
    return subtotal - totalDiscount;
  };

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { subtotal: number; total: number; items: number }> = {};
    
    items.forEach(item => {
      const paymentMethod = getFirstPaymentMethod(item);
      if (paymentMethod) {
        // Check if this item has split payment
        const isSplit = isSplitPaymentEnabled(item);
        const secondPaymentMethod = getSecondPaymentMethod(item);
        
        // Calculate subtotal as price * quantity
        const itemSubtotal = (item.precio || 0) * (item.cantidad || 1);
        // Calculate discounted total for this item
        const itemDiscountedTotal = calculateDiscountedTotal(item);
        
        if (isSplit && secondPaymentMethod) {
          // Handle split payment - treat as separate currencies
          const firstCurrency = paymentMethod.moneda || MONEDAS.USD;
          const secondCurrency = secondPaymentMethod.moneda || MONEDAS.ARS;
          
          // First payment (USD)
          if (!totals[firstCurrency]) {
            totals[firstCurrency] = { subtotal: 0, total: 0, items: 0 };
          }
          totals[firstCurrency].subtotal += itemSubtotal;
          totals[firstCurrency].total += (paymentMethod.monto || 0);
          totals[firstCurrency].items += 1;
          
          // Second payment (ARS)
          if (!totals[secondCurrency]) {
            totals[secondCurrency] = { subtotal: 0, total: 0, items: 0 };
          }
          totals[secondCurrency].subtotal += itemSubtotal;
          totals[secondCurrency].total += (secondPaymentMethod.monto || 0);
          totals[secondCurrency].items += 1;
        } else {
          // Single payment method
          let currency = paymentMethod.moneda || MONEDAS.USD;
          
          // If item is frozen, it should always be ARS
          if (isItemFrozen(item)) {
            currency = MONEDAS.ARS as MonedaNew;
          }
          
          if (!totals[currency]) {
            totals[currency] = { subtotal: 0, total: 0, items: 0 };
          }
          
          totals[currency].subtotal += itemSubtotal;
          // Use the discounted total for the summary
          totals[currency].total += itemDiscountedTotal;
          totals[currency].items += 1;
        }
      }
    });

    return totals;
  }, [items, descuentosPorMetodo]);

  // Check if all items use the same currency
  const allSameCurrency = useMemo(() => {
    const currencies = new Set();
    
    items.forEach(item => {
      const paymentMethod = getFirstPaymentMethod(item);
      if (paymentMethod) {
        // Check if this item has split payment
        const isSplit = isSplitPaymentEnabled(item);
        const secondPaymentMethod = getSecondPaymentMethod(item);
        
        if (isSplit && secondPaymentMethod) {
          // Add both currencies for split payments
          const firstCurrency = paymentMethod.moneda || MONEDAS.USD;
          const secondCurrency = secondPaymentMethod.moneda || MONEDAS.ARS;
          currencies.add(firstCurrency);
          currencies.add(secondCurrency);
        } else {
          // Single payment method
          let currency = paymentMethod.moneda || MONEDAS.USD;
          
          // If item is frozen, it should always be ARS
          if (isItemFrozen(item)) {
            currency = MONEDAS.ARS as MonedaNew;
          }
          
          currencies.add(currency);
        }
      }
    });
    
    return currencies.size <= 1;
  }, [items]);

  // Calculate unified totals
  const unifiedTotals = useMemo(() => {
    let totalSubtotal = 0;
    let totalAmount = 0;
    let hasFrozenItems = false;
    let primaryCurrency: MonedaNew = MONEDAS.USD as MonedaNew;

    items.forEach(item => {
      const paymentMethod = getFirstPaymentMethod(item);
      if (paymentMethod) {
        // Determine the correct currency for this item
        let currency = paymentMethod.moneda || MONEDAS.USD;
        
        // If item is frozen, it should always be ARS
        if (isItemFrozen(item)) {
          currency = MONEDAS.ARS as MonedaNew;
          hasFrozenItems = true;
        }
        
        // Calculate subtotal as price * quantity
        const itemSubtotal = (item.precio || 0) * (item.cantidad || 1);
        // Calculate discounted total for this item
        const itemDiscountedTotal = calculateDiscountedTotal(item);
        
        totalSubtotal += itemSubtotal;
        // Use the discounted total for the summary
        totalAmount += itemDiscountedTotal;
        
        // Set primary currency based on frozen items
        if (isItemFrozen(item)) {
          primaryCurrency = MONEDAS.ARS as MonedaNew;
        }
      }
    });

    return { totalSubtotal, totalAmount, hasFrozenItems, primaryCurrency };
  }, [items, descuentosPorMetodo]);

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
          {/* Multiple Currencies Display */}
          {hasMultipleCurrencies && currencies.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Resumen por Moneda:
              </div>
              
              {currencies.map((currency) => {
                const totals = totalsByCurrency[currency];
                const isFrozen = items.some(item => 
                  isItemFrozen(item) && getFirstPaymentMethod(item)?.moneda === currency
                );
                
                // Check if this currency has split payments
                const hasSplitInThisCurrency = items.some(item => {
                  const isSplit = isSplitPaymentEnabled(item);
                  const firstPayment = getFirstPaymentMethod(item);
                  const secondPayment = getSecondPaymentMethod(item);
                  
                  return isSplit && (
                    firstPayment?.moneda === currency || 
                    secondPayment?.moneda === currency
                  );
                });
                
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
                        {hasSplitInThisCurrency && (
                          <Split className="h-4 w-4 text-blue-600" />
                        )}
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
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-semibold">
                          {formatAmount(totals.total, currency, isFrozen)}
                        </span>
                      </div>
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
              
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold">
                  {formatAmount(unifiedTotals.totalAmount, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
                </span>
              </div>
              
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