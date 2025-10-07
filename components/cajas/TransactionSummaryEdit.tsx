'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, DollarSign, Lock, HandCoins } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { ItemComandaCreateNew, MonedaNew, ComandaNew, ClienteNew } from '@/services/unidadNegocio.service';
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
  señaActiva?: boolean;
  onSeñaToggle?: (enabled: boolean) => void;
  señaMonedas?: string[];
  onSeñaMonedasChange?: (monedas: string[]) => void;
  comandaOriginal?: ComandaNew;
  clienteActual?: ClienteNew | null;
}

export default function TransactionSummaryEdit({
  items,
  tipo,
  className = '',
  señaActiva = false,
  onSeñaToggle,
  señaMonedas = [],
  onSeñaMonedasChange,
  comandaOriginal,
  clienteActual,
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
      if ((ars === 0 && usd === 0) && comandaOriginal.cliente?.prepagosGuardados) {
        const prepagosGuardados = comandaOriginal.cliente.prepagosGuardados;
        const prepagoARS = prepagosGuardados.find((p: any) => p.moneda === 'ARS');
        const prepagoUSD = prepagosGuardados.find((p: any) => p.moneda === 'USD');
        
        if (prepagoARS?.monto) {
          ars = parseFloat(prepagoARS.monto.toString());
        }
        if (prepagoUSD?.monto) {
          usd = parseFloat(prepagoUSD.monto.toString());
        }
      }
      
      return { ars, usd };
    }
    
    // PRIORITY 2: If no original comanda but client is available, use client señas
    // This is a fallback for new comandas
    if (clienteActual?.prepagosGuardados) {
      let ars = 0;
      let usd = 0;
      
      const prepagoARS = clienteActual.prepagosGuardados.find((p: any) => p.moneda === 'ARS');
      const prepagoUSD = clienteActual.prepagosGuardados.find((p: any) => p.moneda === 'USD');
      
      if (prepagoARS?.monto) {
        ars = parseFloat(prepagoARS.monto.toString());
      }
      if (prepagoUSD?.monto) {
        usd = parseFloat(prepagoUSD.monto.toString());
      }
      
      return { ars, usd };
    }
    
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
    const baseSubtotal = (item.precio || 0) * (item.cantidad || 1);
    const isFrozen = isItemFrozen(item);
    const pagarEnPesos = (item as any).pagarEnPesos || false;
    
    // If paying in pesos (but not frozen), convert from USD to ARS
    if (!isFrozen && pagarEnPesos && isExchangeRateValid) {
      return Math.round(baseSubtotal * exchangeRate);
    }
    
    return baseSubtotal;
  };

  // Helper function to get item discount
  const getItemDiscount = (item: ItemComandaCreateNew): number => {
    const discount = item.descuento || 0;
    const isFrozen = isItemFrozen(item);
    const pagarEnPesos = (item as any).pagarEnPesos || false;
    
    // If paying in pesos (but not frozen), convert from USD to ARS
    if (!isFrozen && pagarEnPesos && isExchangeRateValid) {
      return Math.round(discount * exchangeRate);
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
      const pagarEnPesos = (item as any).pagarEnPesos || false;
      return `${item.precio}-${item.cantidad}-${item.descuento}-${pagarEnPesos}`;
    }).join(','),
    señaActiva,
    señaMonedas.join(','),
    señaInfo.ars,
    señaInfo.usd,
    exchangeRate
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

    // Apply seña if active and currencies selected (using original comanda seña amounts)
    let totalConSeña = totalAmount;
    if (señaActiva && señaMonedas.length > 0) {
      let señaAplicada = 0;
      
      señaMonedas.forEach(moneda => {
        if (moneda === 'ARS' && señaInfo.ars > 0) {
          if (primaryCurrency === MONEDAS.USD && isExchangeRateValid) {
            // Convert ARS to USD using exchange rate
            señaAplicada += señaInfo.ars / exchangeRate;
          } else {
            señaAplicada += señaInfo.ars;
          }
        } else if (moneda === 'USD' && señaInfo.usd > 0) {
          if (primaryCurrency === MONEDAS.ARS && isExchangeRateValid) {
            // Convert USD to ARS
            señaAplicada += señaInfo.usd * exchangeRate;
          } else {
            señaAplicada += señaInfo.usd;
          }
        }
      });
      
      totalConSeña = Math.max(0, totalAmount - señaAplicada);
    }

    return { totalSubtotal, totalAmount, totalConSeña, totalDescuento, hasFrozenItems, primaryCurrency };
  }, [
    items.length,
    items.map(item => {
      const pagarEnPesos = (item as any).pagarEnPesos || false;
      return `${item.precio}-${item.cantidad}-${item.descuento}-${pagarEnPesos}`;
    }).join(','),
    señaActiva,
    señaMonedas.join(','),
    señaInfo.ars,
    señaInfo.usd,
    exchangeRate
  ]);

  const hasPrepagosGuardados = señaInfo.ars > 0 || señaInfo.usd > 0;

  if (items.length === 0) {
    return (
      <Card className={`border-[#f9bbc4]/30 ${className}`}>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            No hay items para mostrar el resumen
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render by currency if multiple currencies are present
  if (!allSameCurrency) {
    const currencies = Object.keys(totalsByCurrency);
    
    return (
      <div className={`space-y-4 ${className}`}>
        {currencies.map(currency => {
          const totals = totalsByCurrency[currency];
          const isFrozen = currency === 'ARS' && items.some(item => 
            getItemCurrency(item) === 'ARS' && isItemFrozen(item)
          );
          const formatFn = currency === 'ARS' ? formatARSFromNative : formatUSD;
          
          return (
            <Card key={currency} className="border-[#f9bbc4]/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#f9bbc4]" />
                    Resumen - {currency}
                    {isFrozen && <Lock className="h-4 w-4 text-amber-600" title="Incluye precios congelados" />}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {totals.items} {totals.items === 1 ? 'item' : 'items'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatFn(totals.subtotal)}</span>
                </div>
                
                {totals.descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span className="font-medium">-{formatFn(totals.descuento)}</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                  <span>Total:</span>
                  <span className="text-[#4a3540]">{formatFn(totals.total)}</span>
                </div>

                {/* Seña section (only for current currency) */}
                {hasPrepagosGuardados && tipo === 'ingreso' && (
                  <div className="mt-4 space-y-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HandCoins className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Aplicar Seña</span>
                      </div>
                      <Checkbox
                        checked={señaActiva && señaMonedas.includes(currency)}
                        onCheckedChange={(checked) => {
                          const isActive = !!checked;
                          if (onSeñaMonedasChange) {
                            if (isActive) {
                              // Add this currency to selected señas
                              onSeñaMonedasChange([...señaMonedas.filter(m => m !== currency), currency]);
                            } else {
                              // Remove this currency from selected señas
                              onSeñaMonedasChange(señaMonedas.filter(m => m !== currency));
                            }
                          }
                          if (onSeñaToggle) {
                            // Toggle seña active state
                            onSeñaToggle(isActive || señaMonedas.length > 0);
                          }
                        }}
                      />
                    </div>
                    
                    <div className="text-xs text-green-700">
                      Seña disponible: {formatFn(currency === 'ARS' ? señaInfo.ars : señaInfo.usd)}
                    </div>

                    {señaActiva && señaMonedas.includes(currency) && (
                      <div className="space-y-2 border-t border-green-200 pt-2">
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Seña aplicada:</span>
                          <span className="font-medium">
                            -{formatFn(Math.min(
                              currency === 'ARS' ? señaInfo.ars : señaInfo.usd,
                              totals.total
                            ))}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-green-300 pt-2 text-sm font-bold text-green-800">
                          <span>Total a pagar:</span>
                          <span>{formatFn(totals.totalConSeña)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Unified view for single currency
  return (
    <Card className={`border-[#f9bbc4]/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#f9bbc4]" />
            Resumen de Transacción
            {unifiedTotals.hasFrozenItems && (
              <Lock className="h-4 w-4 text-amber-600" title="Incluye precios congelados" />
            )}
          </span>
          <Badge variant="outline" className="text-xs">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">
            {formatAmount(unifiedTotals.totalSubtotal, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
          </span>
        </div>
        
        {unifiedTotals.totalDescuento > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento:</span>
            <span className="font-medium">
              -{formatAmount(unifiedTotals.totalDescuento, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
          <span>Total:</span>
          <span className="text-[#4a3540]">
            {formatAmount(unifiedTotals.totalAmount, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
          </span>
        </div>

        {/* Seña section */}
        {hasPrepagosGuardados && tipo === 'ingreso' && (
          <div className="mt-4 space-y-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Aplicar Seña</span>
              </div>
              <Checkbox
                checked={señaActiva}
                onCheckedChange={(checked) => {
                  const isActive = !!checked;
                  if (onSeñaToggle) {
                    onSeñaToggle(isActive);
                  }
                  if (onSeñaMonedasChange && isActive) {
                    // Auto-select the primary currency
                    onSeñaMonedasChange([unifiedTotals.primaryCurrency]);
                  }
                }}
              />
            </div>
            
            <div className="space-y-1 text-xs text-green-700">
              {señaInfo.ars > 0 && (
                <div className="flex justify-between">
                  <span>Seña ARS:</span>
                  <span>{formatARSFromNative(señaInfo.ars)}</span>
                </div>
              )}
              {señaInfo.usd > 0 && (
                <div className="flex justify-between">
                  <span>Seña USD:</span>
                  <span>{formatUSD(señaInfo.usd)}</span>
                </div>
              )}
            </div>

            {señaActiva && (
              <div className="space-y-2 border-t border-green-200 pt-2">
                <div className="space-y-1">
                  {señaInfo.ars > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sena-ars"
                        checked={señaMonedas.includes('ARS')}
                        onCheckedChange={(checked) => {
                          if (onSeñaMonedasChange) {
                            if (checked) {
                              onSeñaMonedasChange([...señaMonedas, 'ARS']);
                            } else {
                              onSeñaMonedasChange(señaMonedas.filter(m => m !== 'ARS'));
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="sena-ars"
                        className="text-xs text-green-700 cursor-pointer flex-1"
                      >
                        Usar seña ARS ({formatARSFromNative(señaInfo.ars)})
                      </label>
                    </div>
                  )}
                  {señaInfo.usd > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sena-usd"
                        checked={señaMonedas.includes('USD')}
                        onCheckedChange={(checked) => {
                          if (onSeñaMonedasChange) {
                            if (checked) {
                              onSeñaMonedasChange([...señaMonedas, 'USD']);
                            } else {
                              onSeñaMonedasChange(señaMonedas.filter(m => m !== 'USD'));
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="sena-usd"
                        className="text-xs text-green-700 cursor-pointer flex-1"
                      >
                        Usar seña USD ({formatUSD(señaInfo.usd)})
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-t border-green-300 pt-2 text-sm font-bold text-green-800">
                  <span>Total a pagar:</span>
                  <span>
                    {formatAmount(unifiedTotals.totalConSeña, unifiedTotals.primaryCurrency, unifiedTotals.hasFrozenItems)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
