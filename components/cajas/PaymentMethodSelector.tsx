'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Gift,
  QrCode,
  DollarSign,
  Lock,
  Calculator,
  Split,
} from 'lucide-react';
import { METODOS_PAGO, MONEDAS, MONEDA_LABELS } from '@/lib/constants';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { ItemComandaCreateNew, MetodoPagoNew, ProductoServicioNew, TipoPagoNew, MonedaNew } from '@/services/unidadNegocio.service';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';

/**
 * PaymentMethodSelector Component
 * 
 * This component handles the redesigned payment method system where each product/service
 * is associated with a specific payment method. The component enforces currency restrictions
 * based on whether prices are frozen (ARS only) or dynamic (USD/ARS).
 * 
 * NEW FEATURE: Split payment for non-frozen items allows paying part in USD and part in ARS
 * with the same payment type (e.g., both in cash, both in card, etc.)
 * 
 * NEW FEATURE: "Descuentos activos" checkbox to enable/disable all payment method discounts
 * 
 * @param items - Array of items (products/services) in the transaction
 * @param onUpdateItem - Callback to update item payment information
 * @param tipo - Transaction type ('ingreso' or 'egreso')
 * @param className - Additional CSS classes
 */
interface PaymentMethodSelectorProps {
  items: ItemComandaCreateNew[];
  onUpdateItem: (itemId: string, updates: any) => void;
  tipo: 'ingreso' | 'egreso';
  className?: string;
  onDescuentosToggle?: (enabled: boolean) => void; // New prop
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

export default function PaymentMethodSelector({
  items,
  onUpdateItem,
  tipo,
  className = '',
  onDescuentosToggle, // New prop
}: PaymentMethodSelectorProps) {
  const { formatARS, formatUSD, formatARSFromNative, isExchangeRateValid, arsToUsd } = useCurrencyConverter();
  const { descuentosPorMetodo } = useConfiguracion();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [descuentosActivos, setDescuentosActivos] = useState(true); // Default to true

  // Helper function to get payment method icon
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

  // Helper function to format amount based on currency and frozen status
  const formatAmount = (amount: number, moneda: string, isFrozen: boolean) => {
    if (isFrozen) {
      return `🔒 ${formatARSFromNative(amount)}`;
    }
    return moneda === MONEDAS.ARS ? formatARSFromNative(amount) : formatUSD(amount);
  };

  // Helper function to calculate item total
  const calculateItemTotal = (item: ItemComandaCreateNew) => {
    const baseTotal = (item.precio || 0) * (item.cantidad || 1) - (item.descuento || 0);
    return baseTotal;
  };

  // Helper function to check if item has frozen pricing
  const isItemFrozen = (item: ItemComandaCreateNew) => {
    return item.productoServicio?.esPrecioCongelado || false;
  };

  // Helper function to get available currencies for an item
  const getAvailableCurrencies = (item: ItemComandaCreateNew) => {
    const isFrozen = isItemFrozen(item);
    if (isFrozen) {
      return [{ value: MONEDAS.ARS, label: MONEDA_LABELS[MONEDAS.ARS] }];
    }
    return [
      { value: MONEDAS.USD, label: MONEDA_LABELS[MONEDAS.USD] },
      { value: MONEDAS.ARS, label: MONEDA_LABELS[MONEDAS.ARS] }
    ];
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

  // Helper function to get effective discount percentage (0 if descuentosActivos is false)
  const getEffectiveDiscount = (paymentType: string) => {
    if (!descuentosActivos) return 0;
    return descuentosPorMetodo[paymentType as keyof typeof descuentosPorMetodo] || 0;
  };

  // Helper function to handle split payment toggle
  const handleSplitPaymentToggle = (itemId: string, enabled: boolean) => {
    const item = items.find(i => i.id === itemId);
    if (!item || isItemFrozen(item)) return;

    const currentPaymentMethod = getFirstPaymentMethod(item);
    if (!currentPaymentMethod) return;

    if (enabled) {
      // Enable split payment - create second payment method
      const itemTotal = calculateItemTotal(item);
      const firstAmount = Math.floor(itemTotal / 2); // Split roughly in half
      const secondAmount = itemTotal - firstAmount;

      const firstMethod = {
        ...currentPaymentMethod,
        monto: firstAmount,
        montoFinal: firstAmount,
        moneda: MONEDAS.USD as MonedaNew,
      };

      const secondMethod = {
        ...currentPaymentMethod,
        monto: secondAmount,
        montoFinal: secondAmount,
        moneda: MONEDAS.ARS as MonedaNew,
      };

      onUpdateItem(itemId, { metodosPago: [firstMethod, secondMethod] });
    } else {
      // Disable split payment - keep only first method
      const itemTotal = calculateItemTotal(item);
      const singleMethod = {
        ...currentPaymentMethod,
        monto: itemTotal,
        montoFinal: itemTotal,
        moneda: MONEDAS.USD as MonedaNew,
      };

      onUpdateItem(itemId, { metodosPago: [singleMethod] });
    }
  };

  // Helper function to handle global discounts toggle
  const handleGlobalDescuentosToggle = (enabled: boolean) => {
    setDescuentosActivos(enabled);
    
    // Notify parent component about global discount toggle
    if (onDescuentosToggle) {
      onDescuentosToggle(enabled);
    }
    
    // Update all items to reflect the new discount settings
    items.forEach(item => {
      const currentPaymentMethod = getFirstPaymentMethod(item);
      if (currentPaymentMethod) {
        const isSplitEnabled = isSplitPaymentEnabled(item);
        
        if (isSplitEnabled) {
          // For split payment, recalculate both payments
          const itemTotal = calculateItemTotal(item);
          const splitAmount = Math.round(itemTotal / 2);
          
          const firstMethod = {
            ...currentPaymentMethod,
            monto: splitAmount,
            montoFinal: splitAmount,
            moneda: MONEDAS.USD as MonedaNew,
          };

          const secondMethod = {
            ...currentPaymentMethod,
            monto: itemTotal - splitAmount,
            montoFinal: itemTotal - splitAmount,
            moneda: MONEDAS.ARS as MonedaNew,
          };

          onUpdateItem(item.id!, { metodosPago: [firstMethod, secondMethod] });
        } else {
          // For single payment, recalculate with new discount settings
          const itemTotal = calculateItemTotal(item);
          const discountAmount = enabled ? 
            Math.round((itemTotal * getEffectiveDiscount(currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO)) / 100) : 0;
          
          const updatedPaymentMethod = {
            ...currentPaymentMethod,
            monto: itemTotal,
            montoFinal: itemTotal - discountAmount,
            descuentoAplicado: discountAmount,
            descuentoGlobalPorcentaje: discountAmount > 0 ? Math.round((discountAmount / itemTotal) * 100) : 0,
            recargoPorcentaje: 0,
          };

          onUpdateItem(item.id!, { metodosPago: [updatedPaymentMethod] });
        }
      }
    });
  };

  // Helper function to handle currency conversion when switching
  const handleCurrencyChange = (itemId: string, newCurrency: string, paymentIndex: number = 0) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const currentPaymentMethod = paymentIndex === 0 ? getFirstPaymentMethod(item) : getSecondPaymentMethod(item);
    if (!currentPaymentMethod) return;

    let newAmount = currentPaymentMethod.monto || 0;
    
    // Convert amount if switching between USD and ARS
    if (currentPaymentMethod.moneda === MONEDAS.USD && newCurrency === MONEDAS.ARS) {
      // Convert USD to ARS
      newAmount = (currentPaymentMethod.monto || 0) * (1 / arsToUsd(1));
    } else if (currentPaymentMethod.moneda === MONEDAS.ARS && newCurrency === MONEDAS.USD) {
      // Convert ARS to USD
      newAmount = arsToUsd(currentPaymentMethod.monto || 0);
    }

    const updatedPaymentMethod: Partial<MetodoPagoNew> = {
      ...currentPaymentMethod,
      moneda: newCurrency as MonedaNew,
      monto: newAmount,
      montoFinal: newAmount,
    };

    // Update the specific payment method
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = [...(itemWithPayment.metodosPago || [])];
    updatedMetodosPago[paymentIndex] = updatedPaymentMethod;

    onUpdateItem(itemId, { metodosPago: updatedMetodosPago });
  };

  // Helper function to handle payment method type change
  const handlePaymentTypeChange = (itemId: string, newType: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const currentPaymentMethod = getFirstPaymentMethod(item);
    if (!currentPaymentMethod) return;

    // Update all payment methods for this item with the new type
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = (itemWithPayment.metodosPago || []).map(method => ({
      ...method,
      tipo: newType as TipoPagoNew,
    }));

    onUpdateItem(itemId, { metodosPago: updatedMetodosPago });
  };

  // Helper function to handle amount change
  const handleAmountChange = (itemId: string, newAmount: number, paymentIndex: number = 0) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Remove decimals
    const cleanAmount = Math.floor(newAmount);

    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = [...(itemWithPayment.metodosPago || [])];
    
    if (updatedMetodosPago[paymentIndex]) {
      updatedMetodosPago[paymentIndex] = {
        ...updatedMetodosPago[paymentIndex],
        monto: cleanAmount,
        montoFinal: cleanAmount,
      };
    }

    onUpdateItem(itemId, { metodosPago: updatedMetodosPago });
  };

  // Calculate totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    
    items.forEach(item => {
      const itemWithPayment = item as ItemWithPaymentMethods;
      const metodosPago = itemWithPayment.metodosPago || [];
      
      metodosPago.forEach(paymentMethod => {
        if (paymentMethod) {
          const currency = paymentMethod.moneda || MONEDAS.USD;
          totals[currency] = (totals[currency] || 0) + (paymentMethod.montoFinal || 0);
        }
      });
    });

    return totals;
  }, [items]);

  // Check if all items use the same currency
  const allSameCurrency = useMemo(() => {
    const currencies = new Set();
    
    items.forEach(item => {
      const itemWithPayment = item as ItemWithPaymentMethods;
      const metodosPago = itemWithPayment.metodosPago || [];
      
      metodosPago.forEach(paymentMethod => {
        if (paymentMethod) {
          currencies.add(paymentMethod.moneda);
        }
      });
    });
    
    return currencies.size <= 1;
  }, [items]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Métodos de Pago por Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global Discounts Toggle */}
          <div className="flex items-center gap-2 rounded-md bg-gray-100 p-3">
            <Checkbox
              checked={descuentosActivos}
              onCheckedChange={(checked) => handleGlobalDescuentosToggle(checked as boolean)}
              className="h-4 w-4"
            />
            <Label className="text-sm font-medium text-gray-700">
              Descuentos activos
            </Label>
            <span className="text-xs text-gray-500 ml-2">
              {descuentosActivos ? 'Aplicando descuentos por método de pago' : 'Sin descuentos'}
            </span>
          </div>

          {items.map((item, index) => {
            const isFrozen = isItemFrozen(item);
            const itemTotal = calculateItemTotal(item);
            const paymentMethod = getFirstPaymentMethod(item);
            const secondPaymentMethod = getSecondPaymentMethod(item);
            const availableCurrencies = getAvailableCurrencies(item);
            const isExpanded = expandedItems.has(item.id!);
            const isSplitEnabled = isSplitPaymentEnabled(item);

            return (
              <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {/* Item Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {isFrozen && '🔒 '}
                      {tipo === 'ingreso' ? 'Servicio' : 'Concepto'} #{index + 1}
                    </Badge>
                    <span className="font-medium text-gray-900">{item.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(itemTotal, paymentMethod?.moneda || MONEDAS.USD, isFrozen)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {paymentMethod?.tipo ? `${paymentMethod.tipo} - ${paymentMethod.moneda}` : 'Sin método de pago'}
                      </div>
                      {/* Show discount info if discounts are active */}
                      {descuentosActivos && paymentMethod?.tipo && (
                        <div className="text-xs text-green-600">
                          Descuento: {getEffectiveDiscount(paymentMethod.tipo)}%
                        </div>
                      )}
                    </div>
                    {/* Split Payment Checkbox for non-frozen items */}
                    {!isFrozen && (
                      <div className="flex items-center gap-2">
                        <Split className="h-4 w-4 text-gray-500" />
                        <Checkbox
                          checked={isSplitEnabled}
                          onCheckedChange={(checked) => handleSplitPaymentToggle(item.id!, checked as boolean)}
                          className="h-4 w-4"
                        />
                        <Label className="text-xs text-gray-600">Dividir Pago</Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Configuration */}
                <div className="space-y-3">
                  {/* Payment Type Selection */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo de Pago</Label>
                      <Select
                        value={paymentMethod?.tipo || ''}
                        onValueChange={(value) => handlePaymentTypeChange(item.id!, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={METODOS_PAGO.EFECTIVO}>
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              Efectivo
                              {descuentosActivos && (
                                <span className="text-xs text-green-600 ml-auto">
                                  -{getEffectiveDiscount(METODOS_PAGO.EFECTIVO)}%
                                </span>
                              )}
                            </div>
                          </SelectItem>
                          <SelectItem value={METODOS_PAGO.TARJETA}>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Tarjeta
                              {descuentosActivos && (
                                <span className="text-xs text-green-600 ml-auto">
                                  -{getEffectiveDiscount(METODOS_PAGO.TARJETA)}%
                                </span>
                              )}
                            </div>
                          </SelectItem>
                          <SelectItem value={METODOS_PAGO.TRANSFERENCIA}>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" />
                              Transferencia
                              {descuentosActivos && (
                                <span className="text-xs text-green-600 ml-auto">
                                  -{getEffectiveDiscount(METODOS_PAGO.TRANSFERENCIA)}%
                                </span>
                              )}
                            </div>
                          </SelectItem>
                          <SelectItem value={METODOS_PAGO.GIFTCARD}>
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4" />
                              Gift Card
                              {descuentosActivos && (
                                <span className="text-xs text-green-600 ml-auto">
                                  -{getEffectiveDiscount(METODOS_PAGO.GIFTCARD)}%
                                </span>
                              )}
                            </div>
                          </SelectItem>
                          <SelectItem value={METODOS_PAGO.QR}>
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4" />
                              QR
                              {descuentosActivos && (
                                <span className="text-xs text-green-600 ml-auto">
                                  -{getEffectiveDiscount(METODOS_PAGO.QR)}%
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* First Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Primer Pago</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={paymentMethod?.moneda || (isFrozen ? MONEDAS.ARS : MONEDAS.USD)}
                          onValueChange={(value) => handleCurrencyChange(item.id!, value, 0)}
                          disabled={isFrozen}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCurrencies.map(currency => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={paymentMethod?.monto || itemTotal}
                          onChange={(e) => handleAmountChange(item.id!, parseFloat(e.target.value) || 0, 0)}
                          className="w-full text-right"
                          disabled={isFrozen}
                          placeholder="Monto"
                        />
                      </div>
                    </div>

                    {/* Second Payment Method (only if split enabled) */}
                    {isSplitEnabled && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Segundo Pago</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={secondPaymentMethod?.moneda || MONEDAS.ARS}
                            onValueChange={(value) => handleCurrencyChange(item.id!, value, 1)}
                            disabled={true} // Always disabled for second payment
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={MONEDAS.USD}>USD ($)</SelectItem>
                              <SelectItem value={MONEDAS.ARS}>ARS ($)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={secondPaymentMethod?.monto || 0}
                            onChange={(e) => handleAmountChange(item.id!, parseFloat(e.target.value) || 0, 1)}
                            className="w-full text-right"
                            placeholder="Monto"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Frozen Price Warning */}
                  {isFrozen && (
                    <div className="flex items-center gap-2 rounded-md bg-orange-100 p-2">
                      <Lock className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-orange-700">
                        Precio congelado - Solo pago en ARS permitido
                      </span>
                    </div>
                  )}

                  {/* Split Payment Info */}
                  {isSplitEnabled && (
                    <div className="flex items-center gap-2 rounded-md bg-blue-100 p-2">
                      <Split className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-blue-700">
                        Pago dividido: {paymentMethod?.moneda} + {secondPaymentMethod?.moneda}
                      </span>
                    </div>
                  )}

                  {/* Discount Status Info */}
                  {!descuentosActivos && (
                    <div className="flex items-center gap-2 rounded-md bg-yellow-100 p-2">
                      <span className="text-xs text-yellow-700">
                        ⚠️ Descuentos desactivados - No se aplicarán descuentos por método de pago
                      </span>
                    </div>
                  )}

                  {/* Currency Conversion Info */}
                  {!isFrozen && paymentMethod?.moneda === MONEDAS.ARS && !isSplitEnabled && (
                    <div className="text-xs text-gray-600">
                      Conversión automática: USD {formatUSD(itemTotal)} → ARS {formatARSFromNative(itemTotal)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary by Currency */}
      {Object.keys(totalsByCurrency).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen por Moneda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(totalsByCurrency).map(([currency, total]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="font-medium">{MONEDA_LABELS[currency as keyof typeof MONEDA_LABELS]}:</span>
                  <span className="font-semibold">
                    {formatAmount(total, currency, currency === MONEDAS.ARS)}
                  </span>
                </div>
              ))}
              
              {/* Unified Total if all same currency */}
              {allSameCurrency && Object.keys(totalsByCurrency).length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total Unificado:</span>
                    <span className="font-bold text-lg">
                      {formatAmount(
                        Object.values(totalsByCurrency).reduce((sum, total) => sum + total, 0),
                        Object.keys(totalsByCurrency)[0],
                        Object.keys(totalsByCurrency)[0] === MONEDAS.ARS
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 