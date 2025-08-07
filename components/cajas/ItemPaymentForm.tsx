'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Trash2,
  Banknote,
  CreditCard,
  Smartphone,
  Gift,
  QrCode,
  Split,
  ChevronDown,
  User,
  DollarSign,
  Lock,
} from 'lucide-react';
import { ItemComandaCreateNew, MetodoPagoNew, TipoPagoNew, MonedaNew } from '@/services/unidadNegocio.service';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import { toast } from 'sonner';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { MONEDAS, METODOS_PAGO, MONEDA_LABELS } from '@/lib/constants';
import { TrabajadorNew } from '@/services/unidadNegocio.service';

/**
 * ItemPaymentForm Component
 * 
 * This component handles the payment method configuration for individual items.
 * It enforces currency restrictions based on frozen pricing and provides
 * automatic currency conversion when switching between USD and ARS.
 * 
 * NEW FEATURE: Split payment for non-frozen items allows paying part in USD and part in ARS
 * with the same payment type (e.g., both in cash, both in card, etc.)
 * 
 * Key Features:
 * - Editable quantity that updates subtotal (price * quantity)
 * - Payment method selection with automatic discount application
 * - Currency restrictions for frozen pricing
 * - Discount display showing original subtotal and discounted amount
 * - Split payment functionality for non-frozen items
 * 
 * @param item - The item to configure payment for
 * @param index - Index of the item in the list
 * @param onUpdateItem - Callback to update item payment information
 * @param onRemoveItem - Callback to remove the item
 * @param tipo - Transaction type ('ingreso' or 'egreso')
 */
interface ItemPaymentFormProps {
  item: ItemComandaCreateNew;
  index: number;
  onUpdateItem: (itemId: string, updates: any) => void;
  onRemoveItem: (itemId: string) => void;
  tipo: 'ingreso' | 'egreso';
  personal?: TrabajadorNew[];
  isEditMode?: boolean;
  disabled?: boolean;
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

// Extended interface for payment methods with discount information
interface PaymentMethodWithDiscount extends Partial<MetodoPagoNew> {
  descuentoAplicado?: number;
}

export default function ItemPaymentForm({
  item,
  index,
  onUpdateItem,
  onRemoveItem,
  tipo,
  personal = [],
  isEditMode = false,
  disabled = false,
}: ItemPaymentFormProps) {
  const { formatARS, formatUSD, formatARSFromNative, isExchangeRateValid, arsToUsd, usdToArs } = useCurrencyConverter();
  const { descuentosPorMetodo } = useConfiguracion();

  // Local state for quantity input to ensure proper synchronization
  const [localQuantity, setLocalQuantity] = useState(item.cantidad || 1);
  
  // Local state for responsible selector
  const [mostrarSelectorResponsables, setMostrarSelectorResponsables] = useState(false);
  
  // Local state for first payment amount to prevent recalculation loops
  const [localFirstPaymentAmount, setLocalFirstPaymentAmount] = useState<string>('');

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

  // Helper function to calculate item subtotal (price * quantity)
  const calculateItemSubtotal = () => {
    const precio = parseFloat(String(item.precio)) || 0;
    const cantidad = parseInt(String(item.cantidad)) || 1;
    const subtotal = precio * cantidad;
    return subtotal;
  };

  // Helper function to calculate item total (subtotal - discount)
  const calculateItemTotal = () => {
    return calculateItemSubtotal() - (item.descuento || 0);
  };

  // Helper function to check if item has frozen pricing
  const isItemFrozen = () => {
    return item.productoServicio?.esPrecioCongelado || false;
  };

  // Helper function to get available currencies for an item
  const getAvailableCurrencies = () => {
    const isFrozen = isItemFrozen();
    if (isFrozen) {
      return [{ value: MONEDAS.ARS, label: MONEDA_LABELS[MONEDAS.ARS] }];
    }
    return [
      { value: MONEDAS.USD, label: MONEDA_LABELS[MONEDAS.USD] },
      { value: MONEDAS.ARS, label: MONEDA_LABELS[MONEDAS.ARS] }
    ];
  };

  // Helper function to get the first payment method from an item
  const getFirstPaymentMethod = (): PaymentMethodWithDiscount | null => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago?.[0] || null;
  };

  // Helper function to get the second payment method from an item (for split payments)
  const getSecondPaymentMethod = (): PaymentMethodWithDiscount | null => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago?.[1] || null;
  };

  // Helper function to check if item has split payment enabled
  const isSplitPaymentEnabled = () => {
    const itemWithPayment = item as ItemWithPaymentMethods;
    return itemWithPayment.metodosPago && itemWithPayment.metodosPago.length > 1;
  };

  // Helper function to calculate discount based on payment method
  const calculateDiscount = (paymentType: string, amount: number, currency: string) => {
    const porcentajeDescuento = descuentosPorMetodo[paymentType as keyof typeof descuentosPorMetodo] || 0;
    if (porcentajeDescuento === 0) return { montoFinal: amount, descuentoAplicado: 0 };
    
    const descuento = Math.round((amount * porcentajeDescuento) / 100);
    const montoFinal = Math.round(amount - descuento);
    
    return { montoFinal, descuentoAplicado: descuento };
  };

  // Helper function to calculate total discount for the item
  const calculateTotalDiscount = () => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) return 0;
    
    const porcentajeDescuento = descuentosPorMetodo[paymentMethod.tipo as keyof typeof descuentosPorMetodo] || 0;
    if (porcentajeDescuento === 0) return 0;
    
    // Apply discount to the total item amount (subtotal)
    const totalAmount = calculateItemSubtotal();
    const descuento = Math.round((totalAmount * porcentajeDescuento) / 100);
    
    return descuento;
  };

  // Helper function to calculate discounted total
  const calculateDiscountedTotal = () => {
    const totalDiscount = calculateTotalDiscount();
    return calculateItemSubtotal() - totalDiscount;
  };

  // Helper function to handle split payment toggle
  const handleSplitPaymentToggle = (enabled: boolean) => {
    const isFrozen = isItemFrozen();
    if (isFrozen) return; // Cannot split frozen items

    const currentPaymentMethod = getFirstPaymentMethod();
    if (!currentPaymentMethod) return;

    if (enabled) {
      // Enable split payment - create second payment method
      const discountedTotal = calculateDiscountedTotal();
      const firstAmount = Math.round(discountedTotal / 2); // Split roughly in half
      const secondAmount = calculateSecondPaymentAmount(firstAmount);
      
      // Calculate discount for each payment method (round to integers)
      const totalDiscount = calculateTotalDiscount();
      const discountedTotalForSplit = calculateDiscountedTotal();
      const firstDiscount = Math.round((firstAmount / discountedTotalForSplit) * totalDiscount);
      const secondDiscount = Math.round((secondAmount / discountedTotalForSplit) * totalDiscount);

      const firstMethod = {
        ...currentPaymentMethod,
        monto: firstAmount, // Amount after discount
        montoFinal: firstAmount, // Amount after discount
        descuentoAplicado: firstDiscount,
        descuentoGlobalPorcentaje: firstDiscount > 0 ? Math.round((firstDiscount / firstAmount) * 100) : 0,
        recargoPorcentaje: 0,
        moneda: MONEDAS.USD as MonedaNew,
      };

      const secondMethod = {
        ...currentPaymentMethod,
        monto: secondAmount, // Amount after discount
        montoFinal: secondAmount, // Amount after discount
        descuentoAplicado: secondDiscount,
        descuentoGlobalPorcentaje: secondDiscount > 0 ? Math.round((secondDiscount / secondAmount) * 100) : 0,
        recargoPorcentaje: 0,
        moneda: MONEDAS.ARS as MonedaNew,
      };

      onUpdateItem(item.id!, { metodosPago: [firstMethod, secondMethod] });
    } else {
      // Disable split payment - keep only first method
      const discountedTotal = calculateDiscountedTotal();
      const singleMethod = {
        ...currentPaymentMethod,
        monto: Math.round(discountedTotal),
        montoFinal: Math.round(discountedTotal),
        moneda: MONEDAS.USD as MonedaNew,
      };

      onUpdateItem(item.id!, { metodosPago: [singleMethod] });
    }
  };

  // Helper function to calculate second payment amount automatically
  const calculateSecondPaymentAmount = (firstPaymentAmount: number) => {
    const discountedTotal = calculateDiscountedTotal();
    const remainingAmount = discountedTotal - firstPaymentAmount;
    // Convert USD remaining amount to ARS using the exchange rate and round to integer
    const secondAmount = Math.round(usdToArs(remainingAmount)); // Convert USD to ARS and round
    return secondAmount;
  };

  // Helper function to handle first payment amount change (when split is enabled)
  const handleFirstPaymentAmountChange = (newAmount: number) => {
    const cleanAmount = Math.round(newAmount); // Use Math.round instead of Math.floor
    const discountedTotal = calculateDiscountedTotal();
    const subtotal = calculateItemSubtotal();
    
    // Ensure first payment doesn't exceed discounted total
    if (cleanAmount > discountedTotal) {
        toast.error('El monto de pago no puede ser mayor al total con descuento ');
      console.log('Payment amount exceeds discounted total:', cleanAmount, '>', discountedTotal);
      return;
    }
    
    // Ensure first payment doesn't exceed subtotal
    if (cleanAmount > subtotal) {
      console.log('Payment amount exceeds subtotal:', cleanAmount, '>', subtotal);
      return;
    }

    const firstMethod = {
      ...getFirstPaymentMethod(),
      monto: cleanAmount,
      montoFinal: cleanAmount,
      moneda: MONEDAS.USD as MonedaNew,
    };

    // Calculate second payment automatically
    const secondAmount = calculateSecondPaymentAmount(cleanAmount);
    
    // Calculate discount for each payment method (round to integers)
    const totalDiscount = Math.round(calculateTotalDiscount());
    const discountedTotalForSplit = calculateDiscountedTotal();
    const firstDiscount = Math.round((cleanAmount / discountedTotalForSplit) * totalDiscount);
    const secondDiscount = Math.round((secondAmount / discountedTotalForSplit) * totalDiscount);

    const firstMethodWithDiscount = {
      ...firstMethod,
      monto: cleanAmount, // Amount entered by user (after discount)
      montoFinal: cleanAmount, // Amount after discount
      descuentoAplicado: firstDiscount,
      descuentoGlobalPorcentaje: firstDiscount > 0 ? Math.round((firstDiscount / cleanAmount) * 100) : 0,
      recargoPorcentaje: 0,
    };

    const secondMethod = {
      ...getFirstPaymentMethod(),
      monto: secondAmount, // Amount calculated (after discount)
      montoFinal: secondAmount, // Amount after discount
      descuentoAplicado: secondDiscount,
      descuentoGlobalPorcentaje: secondDiscount > 0 ? Math.round((secondDiscount / secondAmount) * 100) : 0,
      recargoPorcentaje: 0,
      moneda: MONEDAS.ARS as MonedaNew,
    };

    onUpdateItem(item.id!, { metodosPago: [firstMethodWithDiscount, secondMethod] });
    
    // Update local state to reflect the actual value used
    setLocalFirstPaymentAmount(cleanAmount.toString());
  };

  // Helper function to handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      return; // Prevent invalid quantities
    }
    
    const updatedSubtotal = (parseFloat(String(item.precio)) || 0) * newQuantity;
    
    // Get current payment method to update it as well
    const currentPaymentMethod = getFirstPaymentMethod();
    let updatedPaymentMethod = null;
    
    if (currentPaymentMethod) {
      const discountedTotal = calculateDiscountedTotal();
      let newAmount = discountedTotal;
      
      // Convert amount if the payment method is in a different currency
      if (currentPaymentMethod.moneda === MONEDAS.ARS && !isItemFrozen()) {
        // Convert USD to ARS for non-frozen items
        newAmount = discountedTotal * (1 / arsToUsd(1));
      } else if (currentPaymentMethod.moneda === MONEDAS.USD && isItemFrozen()) {
        // Convert ARS to USD for frozen items (if needed)
        newAmount = arsToUsd(discountedTotal);
      }
      
      // Ensure the amount doesn't exceed the subtotal
      const subtotal = calculateItemSubtotal();
      if (newAmount > subtotal) {
        newAmount = subtotal;
      }
      
      // Recalculate discount with new amount
      const { montoFinal, descuentoAplicado } = calculateDiscount(
        currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO,
        newAmount,
        currentPaymentMethod.moneda || MONEDAS.USD
      );
      
      updatedPaymentMethod = {
        ...currentPaymentMethod,
        monto: newAmount,
        montoFinal,
        descuentoAplicado,
        descuentoGlobalPorcentaje: descuentoAplicado > 0 ? (descuentoAplicado / newAmount) * 100 : 0,
        recargoPorcentaje: 0,
      };
      
    }
    
    // Combine both updates into a single call
    const updates: any = { 
      cantidad: newQuantity,
      subtotal: updatedSubtotal
    };
    
    if (updatedPaymentMethod) {
      updates.metodosPago = [updatedPaymentMethod];
    }
    
    onUpdateItem(item.id!, updates);
  };

  // Helper function to get the correct amount for payment method
  const getPaymentAmount = () => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) {
      // If no payment method set, initialize with EFECTIVO
      const baseAmount = calculateDiscountedTotal();
      const baseCurrency = isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD;
      
      // If item is not frozen and we're displaying in ARS, convert from USD
      if (!isItemFrozen() && baseCurrency === MONEDAS.USD) {
        return baseAmount * (1 / arsToUsd(1)); // Convert USD to ARS
      }
      
      return baseAmount;
    }
    
    // Return the final amount after discount
    return paymentMethod.montoFinal || paymentMethod.monto || calculateDiscountedTotal();
  };

  // Helper function to initialize payment method with correct currency and amount
  const initializePaymentMethod = (currency: string) => {
    const baseAmount = calculateDiscountedTotal();
    let convertedAmount = baseAmount;
    
    // If converting from USD to ARS for non-frozen items, apply exchange rate
    if (!isItemFrozen() && currency === MONEDAS.ARS) {
      convertedAmount = baseAmount * (1 / arsToUsd(1));
    }
    
    const { montoFinal, descuentoAplicado } = calculateDiscount(METODOS_PAGO.EFECTIVO, convertedAmount, currency);
    
    return {
      tipo: METODOS_PAGO.EFECTIVO as TipoPagoNew,
      moneda: currency as MonedaNew,
      monto: convertedAmount,
      montoFinal,
      descuentoAplicado,
      descuentoGlobalPorcentaje: descuentoAplicado > 0 ? (descuentoAplicado / convertedAmount) * 100 : 0,
      recargoPorcentaje: 0,
    };
  };

  // Initialize payment method if it doesn't exist
  useEffect(() => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) {
      const defaultCurrency = isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD;
      const newPaymentMethod = initializePaymentMethod(defaultCurrency);
      onUpdateItem(item.id!, { metodosPago: [newPaymentMethod] });
    }
  }, [item.id]); // Only run when item.id changes

  // Update payment method when item changes (quantity, price, etc.)
  useEffect(() => {
    const paymentMethod = getFirstPaymentMethod();
    if (paymentMethod) {
      const discountedTotal = calculateDiscountedTotal();
      const currentCurrency = paymentMethod.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
      
      // Recalculate the payment method with the new discounted total
      const { montoFinal, descuentoAplicado } = calculateDiscount(
        paymentMethod.tipo || METODOS_PAGO.EFECTIVO,
        discountedTotal,
        currentCurrency
      );
      
      const updatedPaymentMethod: PaymentMethodWithDiscount = {
        ...paymentMethod,
        monto: discountedTotal,
        montoFinal,
        descuentoAplicado,
        descuentoGlobalPorcentaje: descuentoAplicado > 0 ? (descuentoAplicado / discountedTotal) * 100 : 0,
        recargoPorcentaje: 0,
      };
      
      onUpdateItem(item.id!, { metodosPago: [updatedPaymentMethod] });
    }
  }, [item.cantidad, item.precio, item.descuento]); // Run when item properties change

  // Force re-calculation when item changes
  useEffect(() => {
  }, [item.cantidad, item.precio, item.subtotal]);

  // Helper function to handle currency conversion when switching
  const handleCurrencyChange = (newCurrency: string, paymentIndex: number = 0) => {
    const currentPaymentMethod = paymentIndex === 0 ? getFirstPaymentMethod() : getSecondPaymentMethod();
    
    if (!currentPaymentMethod) {
      // Initialize new payment method with EFECTIVO as default
      const newPaymentMethod = initializePaymentMethod(newCurrency);
      onUpdateItem(item.id!, { metodosPago: [newPaymentMethod] });
      return;
    }

    let newAmount = currentPaymentMethod.monto || calculateDiscountedTotal();
    
    // Convert amount if switching between USD and ARS
    if (currentPaymentMethod.moneda === MONEDAS.USD && newCurrency === MONEDAS.ARS) {
      // Convert USD to ARS using exchange rate
      newAmount = (currentPaymentMethod.monto || calculateDiscountedTotal()) * (1 / arsToUsd(1));
    } else if (currentPaymentMethod.moneda === MONEDAS.ARS && newCurrency === MONEDAS.USD) {
      // Convert ARS to USD
      newAmount = arsToUsd(currentPaymentMethod.monto || calculateDiscountedTotal());
    }

    const updatedPaymentMethod: PaymentMethodWithDiscount = {
      ...currentPaymentMethod,
      moneda: newCurrency as MonedaNew,
      monto: newAmount,
      montoFinal: newAmount,
      descuentoAplicado: 0, // No discount when changing currency
      descuentoGlobalPorcentaje: 0,
      recargoPorcentaje: 0,
    };

    // Update the specific payment method
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = [...(itemWithPayment.metodosPago || [])];
    updatedMetodosPago[paymentIndex] = updatedPaymentMethod;

    onUpdateItem(item.id!, { metodosPago: updatedMetodosPago });
  };

  // Helper function to handle payment method type change
  const handlePaymentTypeChange = (newType: string) => {
    const currentPaymentMethod = getFirstPaymentMethod();
    const currentAmount = currentPaymentMethod?.monto || calculateDiscountedTotal();
    const currentCurrency = currentPaymentMethod?.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
    
    // Calculate discount with the current amount and currency
    const { montoFinal, descuentoAplicado } = calculateDiscount(newType, currentAmount, currentCurrency);
    
    const updatedPaymentMethod: PaymentMethodWithDiscount = {
      ...currentPaymentMethod,
      tipo: newType as TipoPagoNew,
      monto: currentAmount,
      montoFinal,
      descuentoAplicado,
      descuentoGlobalPorcentaje: descuentoAplicado > 0 ? (descuentoAplicado / currentAmount) * 100 : 0,
      recargoPorcentaje: 0,
    };

    // Update all payment methods for this item with the new type
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = (itemWithPayment.metodosPago || []).map(method => ({
      ...method,
      tipo: newType as TipoPagoNew,
    }));

    onUpdateItem(item.id!, { metodosPago: updatedMetodosPago });
  };

  // Helper function to handle amount change
  const handleAmountChange = (newAmount: number, paymentIndex: number = 0) => {
    // Round to integer instead of floor
    const cleanAmount = Math.round(newAmount);
    const subtotal = calculateItemSubtotal();
    
    // Validate against subtotal
    if (cleanAmount > subtotal) {
      return;
    }
    
    const currentPaymentMethod = paymentIndex === 0 ? getFirstPaymentMethod() : getSecondPaymentMethod();
    const paymentType = currentPaymentMethod?.tipo || METODOS_PAGO.EFECTIVO;
    const currentCurrency = currentPaymentMethod?.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
    
    // Recalculate discount with new amount
    const { montoFinal, descuentoAplicado } = calculateDiscount(paymentType, cleanAmount, currentCurrency);
    
    const updatedPaymentMethod: PaymentMethodWithDiscount = {
      ...currentPaymentMethod,
      monto: cleanAmount,
      montoFinal: Math.round(montoFinal), // Round the final amount
      descuentoAplicado: Math.round(descuentoAplicado), // Round the discount
      descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / cleanAmount) * 100) : 0,
      recargoPorcentaje: 0,
    };

    // Update the specific payment method
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = [...(itemWithPayment.metodosPago || [])];
    updatedMetodosPago[paymentIndex] = updatedPaymentMethod;

    onUpdateItem(item.id!, { metodosPago: updatedMetodosPago });
  };

  const isFrozen = isItemFrozen();
  const itemSubtotal = calculateItemSubtotal();
  const itemTotal = calculateItemTotal();
  const paymentMethod = getFirstPaymentMethod();
  const secondPaymentMethod = getSecondPaymentMethod();
  const availableCurrencies = getAvailableCurrencies();
  const paymentAmount = getPaymentAmount();
  const isSplitEnabled = isSplitPaymentEnabled();
  
  // Sync local first payment amount with payment method
  useEffect(() => {
    const firstMethod = getFirstPaymentMethod();
    if (firstMethod && isSplitEnabled) {
      setLocalFirstPaymentAmount(firstMethod.monto?.toString() || '');
    }
  }, [item.metodosPago, isSplitEnabled]);

  // Calculate discount info for display
  const discountInfo = useMemo(() => {
    if (!paymentMethod) return null;
    
    const totalDiscount = calculateTotalDiscount();
    if (totalDiscount <= 0) return null;
    
    const porcentajeDescuento = descuentosPorMetodo[paymentMethod.tipo as keyof typeof descuentosPorMetodo] || 0;
    const montoOriginal = calculateItemSubtotal();
    const montoFinal = calculateDiscountedTotal();
    
    return {
      montoOriginal,
      montoFinal,
      descuentoAplicado: totalDiscount,
      porcentajeDescuento
    };
  }, [paymentMethod, item.cantidad, item.precio, descuentosPorMetodo]); // Added item properties as dependencies

  return (
    <div className="rounded-lg border-2 border-gray-300 bg-gradient-to-r from-white to-gray-50 p-4 shadow-md">
      {/* Item Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-gray-700">
            {isFrozen && '🔒 '}
            {tipo === 'ingreso' ? 'Servicio' : 'Concepto'} #{index + 1}
          </Badge>
          {/* Split Payment Checkbox for non-frozen items */}
          {!isFrozen && (
            <div className="flex items-center gap-2">
              <Split className="h-4 w-4 text-gray-500" />
              <Checkbox
                checked={isSplitEnabled}
                onCheckedChange={(checked) => handleSplitPaymentToggle(checked as boolean)}
                disabled={disabled}
                className={`h-4 w-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <Label className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>Dividir Pago</Label>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveItem(item.id!)}
          disabled={disabled}
          className={`text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Item Details - Partially editable */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div>
          <Label className="text-gray-700">Nombre</Label>
          <Input
            value={item.nombre}
            disabled
            className="border-gray-300 bg-gray-100"
          />
        </div>

        <div>
          <Label className="text-gray-700">Precio Lista</Label>
          <Input
            type="number"
            value={item.precio || ''}
            disabled
            className="border-gray-300 bg-gray-100"
          />
        </div>

        <div>
          <Label className="text-gray-700">Cantidad *</Label>
          <Input
            type="number"
            min="1"
            value={localQuantity}
            onChange={(e) => {
              if (disabled) return;
              const inputValue = e.target.value;
              const value = parseInt(inputValue);
              console.log('Quantity input changed to:', value, 'from:', inputValue); // Debug log
              
              // Update local state immediately for responsive UI
              setLocalQuantity(value);
              
              if (!isNaN(value) && value >= 1) {
                console.log('Calling handleQuantityChange with:', value); // Debug log
                handleQuantityChange(value);
              } else if (inputValue === '') {
                // Allow empty input temporarily
                console.log('Empty quantity input');
              } else {
                console.log('Invalid quantity value:', value); // Debug log
              }
            }}
            onBlur={(e) => {
              if (disabled) return;
              // Ensure minimum value when input loses focus
              const value = parseInt(e.target.value);
              if (isNaN(value) || value < 1) {
                console.log('Fixing invalid quantity to 1'); // Debug log
                handleQuantityChange(1);
              }
            }}
            className={`border-gray-300 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={disabled}
          />
        </div>

        <div>
          <Label className="text-gray-700">Subtotal</Label>
          <div className="flex h-10 items-center justify-between rounded-md border-2 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-150 px-3">
            <span className="text-xs text-gray-600">
              {formatAmount(itemSubtotal, isFrozen ? MONEDAS.ARS : MONEDAS.USD, isFrozen)} ({isFrozen ? 'ARS' : 'USD'})
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Configuration */}
      <div className="space-y-3">
        {/* Payment Type Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Tipo de Pago</Label>
          <Select
            value={paymentMethod?.tipo || METODOS_PAGO.EFECTIVO}
            onValueChange={handlePaymentTypeChange}
            disabled={disabled}
          >
            <SelectTrigger className={`w-full ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={METODOS_PAGO.EFECTIVO}>
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Efectivo
                </div>
              </SelectItem>
              <SelectItem value={METODOS_PAGO.TARJETA}>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tarjeta
                </div>
              </SelectItem>
              <SelectItem value={METODOS_PAGO.TRANSFERENCIA}>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Transferencia
                </div>
              </SelectItem>
              <SelectItem value={METODOS_PAGO.GIFTCARD}>
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift Card
                </div>
              </SelectItem>
              <SelectItem value={METODOS_PAGO.QR}>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR
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
              onValueChange={(value) => handleCurrencyChange(value, 0)}
              disabled={isFrozen || isSplitEnabled || disabled} // Lock when split is enabled or disabled
            >
              <SelectTrigger className={`w-full ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
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
              value={isSplitEnabled ? localFirstPaymentAmount : (paymentMethod?.montoFinal || calculateDiscountedTotal())}
              onChange={(e) => {
                if (disabled) return;
                const newValue = e.target.value;
                setLocalFirstPaymentAmount(newValue);
                
                if (isSplitEnabled) {
                  const numValue = parseFloat(newValue) || 0;
                  handleFirstPaymentAmountChange(numValue);
                } else {
                  handleAmountChange(parseFloat(newValue) || 0, 0);
                }
              }}
              className={`w-full text-right ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={isFrozen || !isSplitEnabled || disabled} // Disabled when not split payment or disabled
              placeholder="Monto"
              max={calculateItemSubtotal()} // Maximum value is the subtotal
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
                onValueChange={(value) => handleCurrencyChange(value, 1)}
                disabled={true || disabled} // Always disabled for second payment or when disabled
              >
                <SelectTrigger className={`w-full ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
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
                onChange={(e) => {
                  if (disabled) return;
                  handleAmountChange(parseFloat(e.target.value) || 0, 1);
                }}
                className={`w-full text-right ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={true || disabled} // Always disabled for second payment or when disabled
                placeholder="Calculado automáticamente"
                max={calculateItemSubtotal()} // Maximum value is the subtotal
              />
            </div>
          </div>
        )}

        {/* Split Payment Info */}
        {isSplitEnabled && (
          <div className="flex items-center gap-2 rounded-md bg-blue-100 p-2">
            <Split className="h-4 w-4 text-blue-600" />
            <div className="text-xs text-blue-700">
              <div>Pago dividido: {paymentMethod?.moneda} + {secondPaymentMethod?.moneda}</div>
              <div className="text-blue-600">
                Cálculo: (Subtotal {formatUSD(calculateItemSubtotal())} - Descuento {formatUSD(calculateTotalDiscount())} = {formatUSD(calculateDiscountedTotal())} - USD {formatUSD(paymentMethod?.monto || 0)}) × Tipo de cambio = ARS {formatARSFromNative(secondPaymentMethod?.monto || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Discount Information Display */}
        {discountInfo && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 font-medium">Descuento aplicado:</span>
              <span className="text-green-700 font-semibold">
                -{formatAmount(discountInfo.descuentoAplicado, paymentMethod?.moneda || MONEDAS.USD, isFrozen)} ({discountInfo.porcentajeDescuento}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-green-600 mt-1">
              <span>Total con descuento:</span>
              <span className="font-medium">
                {formatAmount(discountInfo.montoFinal, paymentMethod?.moneda || MONEDAS.USD, isFrozen)}
              </span>
            </div>
          </div>
        )}

        {/* Frozen Price Warning */}
        {isFrozen && (
          <div className="flex items-center gap-2 rounded-md bg-orange-100 p-2">
            <Lock className="h-4 w-4 text-orange-600" />
            <span className="text-xs text-orange-700">
              Precio congelado - Solo pago en ARS permitido
            </span>
          </div>
        )}

        {/* Currency Conversion Info */}
        {!isFrozen && paymentMethod?.moneda === MONEDAS.ARS && !isSplitEnabled && (
          <div className="text-xs text-gray-600">
            Conversión automática: USD {formatUSD(itemTotal)} → ARS {formatARSFromNative(paymentAmount)}
          </div>
        )}

        {/* Selector de responsables - Solo para ingresos */}
        {tipo === 'ingreso' && (
          <div className="mt-4 border-t pt-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Responsables para este item
              </Label>
              <div className="relative responsables-selector">
                <div
                  onClick={() => {
                    if (disabled) return;
                    setMostrarSelectorResponsables(!mostrarSelectorResponsables);
                  }}
                  className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm ${
                    disabled 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'cursor-pointer bg-white hover:border-gray-400'
                  }`}
                >
                  <span
                    className={
                      disabled
                        ? 'text-gray-400'
                        : item.responsablesIds?.length! > 0
                          ? 'text-gray-900'
                          : 'text-gray-500'
                    }
                  >
                    {(() => {
                      if (item.responsablesIds?.length! > 0) {
                        const persona = personal.find(
                          (p) => p.id === item.responsablesIds?.[0]
                        );
                        return persona
                          ? persona.nombre
                          : 'Responsable seleccionado';
                      } else {
                        return 'Seleccionar responsable';
                      }
                    })()}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>

                {mostrarSelectorResponsables && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-48 overflow-y-auto p-2">
                      {personal.map((persona) => (
                        <div
                          key={persona.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            console.log(
                              'Seleccionando responsable:',
                              persona.nombre,
                              'para item:',
                              item.id
                            );
                            
                            // Asegurar que se actualiza el estado correctamente
                            onUpdateItem(item.id!, {
                              responsablesIds: [persona.id]
                            });
                            
                            setMostrarSelectorResponsables(false);
                            
                            console.log(
                              'Responsable seleccionado. Nuevo estado:',
                              [persona.id]
                            );
                          }}
                          className="flex cursor-pointer items-center space-x-2 rounded px-2 py-1 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {persona.nombre}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 