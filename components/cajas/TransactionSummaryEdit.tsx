'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, DollarSign, Lock, Split, HandCoins } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { ItemComandaCreateNew, MetodoPagoNew, MonedaNew, ComandaNew, EstadoPrepagoNew, ClienteNew } from '@/services/unidadNegocio.service';
import { MONEDAS } from '@/lib/constants';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';

/**
 * TransactionSummaryEdit Component
 * 
 * This component is specifically designed for editing existing comandas.
 * It handles señas based on the original comanda data rather than client availability,
 * since the señas were already consumed in this comanda.
 * 
 * @param items - Array of items in the transaction
 * @param tipo - Transaction type ('ingreso' or 'egreso')
 * @param descuentosActivos - Whether discounts are active
 * @param señaActiva - Whether seña is active
 * @param onSeñaToggle - Handler for seña toggle
 * @param señaMonedas - Array of currencies to use for seña
 * @param onSeñaMonedasChange - Handler for seña currency selection
 * @param comandaOriginal - Original comanda data with prepago information
 */
interface TransactionSummaryEditProps {
  items: ItemComandaCreateNew[];
  tipo: 'ingreso' | 'egreso';
  className?: string;
  descuentosActivos?: boolean;
  señaActiva?: boolean;
  onSeñaToggle?: (enabled: boolean) => void;
  señaMonedas?: string[];
  onSeñaMonedasChange?: (monedas: string[]) => void;
  comandaOriginal?: ComandaNew;
  clienteActual?: ClienteNew | null; // Allow null values
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

export default function TransactionSummaryEdit({
  items,
  tipo,
  className = '',
  descuentosActivos = true,
  señaActiva = false,
  onSeñaToggle,
  señaMonedas = [],
  onSeñaMonedasChange,
  comandaOriginal,
  clienteActual, // Add current client prop
}: TransactionSummaryEditProps) {
  const { formatARS, formatUSD, formatARSFromNative, isExchangeRateValid, exchangeRate } = useCurrencyConverter();
  const { descuentosPorMetodo } = useConfiguracion();

  // Extract seña information from original comanda or current client
  const señaInfo = useMemo(() => {
    // PRIORITY 1: Always try to get from original comanda first
    // This ensures we show the original señas that were applied to this comanda
    // Even after saving and reopening, the original señas will be displayed
    if (comandaOriginal) {
      let ars = 0;
      let usd = 0;
      
      // First, try to get from prepago fields (original comanda señas)
      if (comandaOriginal.prepagoARS?.monto) {
        ars = parseFloat(comandaOriginal.prepagoARS.monto.toString());
      }
      if (comandaOriginal.prepagoUSD?.monto) {
        usd = parseFloat(comandaOriginal.prepagoUSD.monto.toString());
      }
      
      // If no prepago in comanda, check if cliente has señas in prepagosGuardados
      // This handles cases where señas were used but not stored in prepago fields
      // We include UTILIZADO status because these were the original señas used
      if (ars === 0 && usd === 0 && comandaOriginal.cliente) {
        // Get señas from cliente's prepagosGuardados (including UTILIZADO for original comanda)
        const prepagosARS = comandaOriginal.cliente.prepagosGuardados?.find(
          prepago => prepago.moneda === 'ARS'
        );
        const prepagosUSD = comandaOriginal.cliente.prepagosGuardados?.find(
          prepago => prepago.moneda === 'USD'
        );
        
        if (prepagosARS) {
          ars = parseFloat(prepagosARS.monto.toString());
        }
        if (prepagosUSD) {
          usd = parseFloat(prepagosUSD.monto.toString());
        }
      }
      
      // If we found señas in the original comanda, return them
      // This ensures the original señas are always displayed when editing
      if (ars > 0 || usd > 0) {
        return { ars, usd };
      }
    }
    
    // PRIORITY 2: Only if no señas found in original comanda AND we have a different client
    // This allows showing señas when changing to a completely new client during editing
    // The client ID comparison ensures we only show new client señas when actually changing clients
    if (clienteActual && comandaOriginal?.cliente?.id !== clienteActual.id) {
      return {
        ars: clienteActual.señasDisponibles?.ars || 0,
        usd: clienteActual.señasDisponibles?.usd || 0,
      };
    }
    
    // Default: no señas found
    // This happens when there are no original señas and no client change
    return { ars: 0, usd: 0 };
  }, [comandaOriginal, clienteActual]);

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

  // Helper function to get the actual total amount for an item from its payment methods
  const getItemTotalFromPaymentMethods = (item: ItemComandaCreateNew) => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    const paymentMethods = itemWithPayment.metodosPago || [];
    
    if (paymentMethods.length === 0) {
      // If no payment methods, return subtotal without discount
      const subtotal = (item.precio || 0) * (item.cantidad || 1);
      return subtotal;
    }
    
    // Sum all montoFinal values from payment methods
    const total = paymentMethods.reduce((total, pm) => {
      return total + (pm.montoFinal || 0);
    }, 0);
    
    return total;
  };

  // Helper function to convert USD to ARS using real exchange rate
  const usdToArs = (usdAmount: number): number => {
    if (!isExchangeRateValid) return usdAmount; // Return original if rate is invalid
    // Use the real exchange rate from the hook
    return Math.round(usdAmount * exchangeRate);
  };

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { subtotal: number; total: number; totalConSeña: number; items: number }> = {};
    
    items.forEach(item => {
      const paymentMethod = getFirstPaymentMethod(item);
      if (paymentMethod) {
        // Check if this item has split payment
        const isSplit = isSplitPaymentEnabled(item);
        const secondPaymentMethod = getSecondPaymentMethod(item);
        
        // Calculate subtotal as price * quantity (always in USD for non-frozen items)
        const itemSubtotalUSD = (item.precio || 0) * (item.cantidad || 1);
        // Get the actual total from payment methods (already discounted)
        const itemTotal = getItemTotalFromPaymentMethods(item);
        
        if (isSplit && secondPaymentMethod) {
          // Handle split payment - treat as separate currencies
          const firstCurrency = paymentMethod.moneda || MONEDAS.USD;
          const secondCurrency = secondPaymentMethod.moneda || MONEDAS.ARS;
          
          // First payment (USD)
          if (!totals[firstCurrency]) {
            totals[firstCurrency] = { subtotal: 0, total: 0, totalConSeña: 0, items: 0 };
          }
          // For USD, use the USD subtotal directly
          totals[firstCurrency].subtotal += itemSubtotalUSD;
          totals[firstCurrency].total += (paymentMethod.montoFinal || paymentMethod.monto || 0);
          totals[firstCurrency].totalConSeña = totals[firstCurrency].total;
          totals[firstCurrency].items += 1;
          
          // Second payment (ARS)
          if (!totals[secondCurrency]) {
            totals[secondCurrency] = { subtotal: 0, total: 0, totalConSeña: 0, items: 0 };
          }
          // For ARS, convert USD subtotal to ARS
          const itemSubtotalARS = Math.round(usdToArs(itemSubtotalUSD));
          totals[secondCurrency].subtotal += itemSubtotalARS;
          totals[secondCurrency].total += (secondPaymentMethod.montoFinal || secondPaymentMethod.monto || 0);
          totals[secondCurrency].totalConSeña = totals[secondCurrency].total;
          totals[secondCurrency].items += 1;
        } else {
          // Single payment method
          let currency = paymentMethod.moneda || MONEDAS.USD;
          
          // If item is frozen, it should always be ARS
          if (isItemFrozen(item)) {
            currency = MONEDAS.ARS as MonedaNew;
          }
          
          if (!totals[currency]) {
            totals[currency] = { subtotal: 0, total: 0, totalConSeña: 0, items: 0 };
          }
          
          // Calculate subtotal in the correct currency
          let itemSubtotalInCurrency: number;
          if (isItemFrozen(item)) {
            itemSubtotalInCurrency = itemSubtotalUSD; // Already in ARS native
          } else if (currency === MONEDAS.ARS) {
            itemSubtotalInCurrency = Math.round(usdToArs(itemSubtotalUSD)); // Convert USD to ARS
          } else {
            itemSubtotalInCurrency = itemSubtotalUSD; // Keep in USD
          }
          
          totals[currency].subtotal += itemSubtotalInCurrency;
          totals[currency].total += itemTotal;
          totals[currency].totalConSeña = totals[currency].total;
          totals[currency].items += 1;
        }
      }
    });

    // Apply seña by currency if active (using original comanda seña amounts)
    if (señaActiva && señaMonedas.length > 0) {
      señaMonedas.forEach(moneda => {
        if (totals[moneda]) {
          let señaAplicada = 0;
          
          if (moneda === 'ARS' && señaInfo.ars > 0) {
            señaAplicada = Math.min(señaInfo.ars, totals[moneda].total);
          } else if (moneda === 'USD' && señaInfo.usd > 0) {
            señaAplicada = Math.min(señaInfo.usd, totals[moneda].total);
          }
          
          totals[moneda].totalConSeña = Math.max(0, totals[moneda].total - señaAplicada);
        }
      });
    }

    return totals;
  }, [
    items.length,
    items.map(item => {
      const pm = getFirstPaymentMethod(item);
      const pm2 = getSecondPaymentMethod(item);
      return `${pm?.tipo || ''}-${pm?.montoFinal || 0}-${pm2?.tipo || ''}-${pm2?.montoFinal || 0}`;
    }).join(','),
    descuentosActivos,
    señaActiva,
    señaMonedas,
    señaInfo,
    usdToArs // Add this dependency
  ]);

  // Check if all items use the same currency
  const allSameCurrency = useMemo(() => {
    const currencies = new Set();
    
    items.forEach(item => {
      const paymentMethod = getFirstPaymentMethod(item);
      if (paymentMethod) {
        const isSplit = isSplitPaymentEnabled(item);
        const secondPaymentMethod = getSecondPaymentMethod(item);
        
        if (isSplit && secondPaymentMethod) {
          const firstCurrency = paymentMethod.moneda || MONEDAS.USD;
          const secondCurrency = secondPaymentMethod.moneda || MONEDAS.ARS;
          currencies.add(firstCurrency);
          currencies.add(secondCurrency);
        } else {
          let currency = paymentMethod.moneda || MONEDAS.USD;
          
          if (isItemFrozen(item)) {
            currency = MONEDAS.ARS as MonedaNew;
          }
          
          currencies.add(currency);
        }
      }
    });
    
    return currencies.size <= 1;
  }, [
    items.length,
    items.map(item => {
      const pm = getFirstPaymentMethod(item);
      return `${pm?.moneda || ''}-${pm?.tipo || ''}`;
    }).join(','),
    descuentosActivos
  ]);

  // Calculate unified totals
  const unifiedTotals = useMemo(() => {
    let totalSubtotal = 0;
    let totalAmount = 0;
    let hasFrozenItems = false;
    let primaryCurrency: MonedaNew = MONEDAS.USD as MonedaNew;

    items.forEach(item => {
      const paymentMethod = getFirstPaymentMethod(item);
      if (paymentMethod) {
        let currency = paymentMethod.moneda || MONEDAS.USD;
        
        if (isItemFrozen(item)) {
          currency = MONEDAS.ARS as MonedaNew;
          hasFrozenItems = true;
        }
        
        const itemSubtotalUSD = (item.precio || 0) * (item.cantidad || 1);
        const itemTotal = getItemTotalFromPaymentMethods(item);
        
        // Simple logic: show totals in the currency of the service
        // If service is in USD, show in USD. If service is in ARS, show in ARS.
        // No complex conversions - just display in the payment currency
        if (currency === MONEDAS.ARS && !isItemFrozen(item)) {
          // Service is paid in ARS, but price is in USD
          // The itemTotal is already in ARS from the payment method
          // So we just add it directly, no need to convert again
          const itemSubtotalARS = Math.round(itemSubtotalUSD * exchangeRate);
          totalSubtotal += itemSubtotalARS;
          totalAmount += itemTotal; // itemTotal is already in ARS
        } else {
          // Service is in USD or frozen in ARS, keep as is
          totalSubtotal += itemSubtotalUSD;
          totalAmount += itemTotal;
        }
        
        if (isItemFrozen(item)) {
          primaryCurrency = MONEDAS.ARS as MonedaNew;
        }
      }
    });

    // Apply seña if active and currencies selected (using original comanda seña amounts)
    let totalConSeña = totalAmount;
    if (señaActiva && señaMonedas.length > 0) {
      let señaAplicada = 0;
      
      señaMonedas.forEach(moneda => {
        if (moneda === 'ARS' && señaInfo.ars > 0) {
          if (primaryCurrency === MONEDAS.USD) {
            // Convert ARS to USD using exchange rate
            señaAplicada += señaInfo.ars / exchangeRate; // Using real exchange rate
          } else {
            señaAplicada += señaInfo.ars;
          }
        } else if (moneda === 'USD' && señaInfo.usd > 0) {
          if (primaryCurrency === MONEDAS.ARS) {
            // Convert USD to ARS
            señaAplicada += señaInfo.usd * exchangeRate; // Using real exchange rate
          } else {
            señaAplicada += señaInfo.usd;
          }
        }
      });
      
      totalConSeña = Math.max(0, totalAmount - señaAplicada);
    }

    return { totalSubtotal, totalAmount, totalConSeña, hasFrozenItems, primaryCurrency };
  }, [
    items.length,
    items.map(item => {
      const pm = getFirstPaymentMethod(item);
      const pm2 = getSecondPaymentMethod(item);
      return `${pm?.montoFinal || 0}-${pm2?.montoFinal || 0}-${isItemFrozen(item)}`;
    }).join(','),
    descuentosActivos,
    señaActiva,
    señaMonedas,
    señaInfo,
    exchangeRate // Add exchangeRate dependency
  ]);

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
          {/* Discount Status Indicator */}
          <div className={`flex items-center gap-2 rounded-md p-2 text-xs ${
            descuentosActivos 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}>
            {descuentosActivos ? (
              <>
                <span className="text-green-600">✓</span>
                Descuentos activos - Aplicando descuentos por método de pago
              </>
            ) : (
              <>
                <span className="text-yellow-600">⚠️</span>
                Descuentos desactivados - No se aplicarán descuentos por método de pago
              </>
            )}
          </div>

          {/* Seña Control - Based on Original Comanda */}
          {onSeñaToggle && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">Aplicar Seña</div>
                    <div className="text-xs text-gray-500">
                      {señaActiva 
                        ? 'Seña activa - El cliente consume prepago' 
                        : 'Sin seña - Pago completo'
                      }
                    </div>
                  </div>
                </div>
                <Checkbox
                  checked={señaActiva}
                  onCheckedChange={onSeñaToggle}
                  className={`h-5 w-5 border-2 ${
                    señaActiva 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600' 
                      : 'border-gray-300 bg-white'
                  } hover:border-blue-400 cursor-pointer`}
                />
              </div>
              
              {/* Seña Currency Selection - Based on Original Comanda */}
              {señaActiva && onSeñaMonedasChange && (señaInfo.ars > 0 || señaInfo.usd > 0) && (
                <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-2">Seleccionar monedas para seña:</div>
                  <div className="space-y-2">
                    {señaInfo.ars > 0 && (
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
                            ARS: {formatARSFromNative(señaInfo.ars)}
                          </span>
                          <div className="text-xs text-gray-500">Seña original de la comanda</div>
                        </div>
                      </div>
                    )}
                    {señaInfo.usd > 0 && (
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
                            USD: {formatUSD(señaInfo.usd)}
                          </span>
                          <div className="text-xs text-gray-500">Seña original de la comanda</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Seña Information from Original Comanda */}
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Seña original ARS:</span>
                  <span className="font-medium text-blue-600">
                    {formatARSFromNative(señaInfo.ars)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Seña original USD:</span>
                  <span className="font-medium text-blue-600">
                    {formatUSD(señaInfo.usd)}
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
                            ? `ARS: ${formatARSFromNative(señaInfo.ars)}`
                            : `USD: ${formatUSD(señaInfo.usd)}`
                        ).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                      <div className="flex justify-between text-sm">
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