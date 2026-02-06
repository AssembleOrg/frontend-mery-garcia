'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { ItemComandaCreateNew, MetodoPagoNew, TipoPagoNew, MonedaNew, ClienteNew } from '@/services/unidadNegocio.service';
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
 * FIXED: Discounts now work correctly with split payments:
 * - When split payment is enabled, the discount is applied to the TOTAL before splitting
 * - Individual payments show the discounted amounts without additional discounts
 * - The "Descuentos activos" checkbox remains active when enabling split payment
 * - This prevents the discount from being deactivated unexpectedly
 * 
 * Key Features:
 * - Editable quantity that updates subtotal (price * quantity)
 * - Payment method selection with automatic discount application
 * - Currency restrictions for frozen pricing
 * - Discount display showing original subtotal and discounted amount
 * - Split payment functionality for non-frozen items
 * - Preserved discount state during split payment operations
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
  cliente?: ClienteNew | null;

  isEditMode?: boolean;
  disabled?: boolean;
  onDescuentosToggle?: (itemId: string, enabled: boolean) => void; // New prop
}

// Extended interface to include metodosPago for the new payment system
interface ItemWithPaymentMethods extends ItemComandaCreateNew {
  metodosPago?: Partial<MetodoPagoNew>[];
}

// Extended interface for payment methods with discount information
interface PaymentMethodWithDiscount extends Partial<MetodoPagoNew> {
  descuentoAplicado?: number;
}

export default function ItemPaymentFormEdit({
  item,
  index,
  onUpdateItem,
  onRemoveItem,
  tipo,
  personal = [],
  cliente = null,

  isEditMode = false,
  disabled = false,
  onDescuentosToggle, // New prop
}: ItemPaymentFormProps) {
  const { formatARS, formatUSD, formatARSFromNative, isExchangeRateValid, arsToUsd, usdToArs } = useCurrencyConverter();
  const { descuentosPorMetodo } = useConfiguracion();

  // Local state for quantity input to ensure proper synchronization
  const [localQuantity, setLocalQuantity] = useState(item.cantidad || 1);
  
  // Local state for responsible selector
  const [mostrarSelectorResponsables, setMostrarSelectorResponsables] = useState(false);
  
  // Local state for first payment amount to prevent recalculation loops
  const [localFirstPaymentAmount, setLocalFirstPaymentAmount] = useState<string>('');
  
  // Local state for discounts toggle - initialize from backend to avoid initial flicker
  const [descuentosActivos, setDescuentosActivos] = useState<boolean>(() => {
    const pm = (item as ItemWithPaymentMethods).metodosPago?.[0];
    if (!pm) return true;
    return parseFloat(String(pm.descuentoGlobalPorcentaje || 0)) > 0;
  });
  
  // Keep discounts toggle in sync if backend value changes later
  useEffect(() => {
    const pm = (item as ItemWithPaymentMethods).metodosPago?.[0];
    if (pm !== undefined) {
      // Only update descuentosActivos if we're not in split payment mode
      // In split payment mode, individual payments have descuentoGlobalPorcentaje: 0
      // but the overall discount is still active
      const isSplitEnabled = isSplitPaymentEnabled();
      
      if (!isSplitEnabled) {
        // For single payment, check if there's a discount
        const hasDiscount = parseFloat(String(pm.descuentoGlobalPorcentaje || 0)) > 0;
        setDescuentosActivos(hasDiscount);
      }
      // If split is enabled, do NOT change descuentosActivos
      // The discount is applied to the total before splitting
    }
  }, [item.metodosPago]);
  


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





  // Helper function to get effective discount percentage (0 if descuentosActivos is false)
  const getEffectiveDiscount = (paymentType: string) => {
    if (!descuentosActivos) return 0;
    return descuentosPorMetodo[paymentType as keyof typeof descuentosPorMetodo] || 0;
  };

  // Helper function to calculate discount based on payment method
  const calculateDiscount = (paymentType: string, amount: number, currency: string) => {
    const porcentajeDescuento = getEffectiveDiscount(paymentType);
    if (porcentajeDescuento === 0) return { montoFinal: amount, descuentoAplicado: 0 };
    
    const descuento = Math.round((amount * porcentajeDescuento) / 100);
    const montoFinal = Math.round(amount - descuento);
    
    return { montoFinal, descuentoAplicado: descuento };
  };

  // Helper function to calculate total discount for the item
  const calculateTotalDiscount = () => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) return 0;
    
    const porcentajeDescuento = getEffectiveDiscount(paymentMethod.tipo as keyof typeof descuentosPorMetodo);
    if (porcentajeDescuento === 0) return 0;
    
    // Get the base amount in the payment currency
    const subtotalUSD = calculateItemSubtotal();
    let baseAmount: number;
    
    if (isItemFrozen()) {
      baseAmount = subtotalUSD; // Already in ARS native
    } else if (paymentMethod.moneda === MONEDAS.ARS) {
      // Convert USD subtotal to ARS first, then apply discount
      baseAmount = Math.round(usdToArs(subtotalUSD));
    } else {
      baseAmount = subtotalUSD; // Keep in USD
    }
    
    // Apply discount to the base amount in the correct currency
    const descuento = Math.round((baseAmount * porcentajeDescuento) / 100);
    
    return descuento;
  };

  // Helper function to calculate discounted total
  const calculateDiscountedTotal = () => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) return calculateItemSubtotal();
    
    const subtotalUSD = calculateItemSubtotal();
    let baseAmount: number;
    
    if (isItemFrozen()) {
      baseAmount = subtotalUSD; // Already in ARS native
    } else if (paymentMethod.moneda === MONEDAS.ARS) {
      // Convert USD subtotal to ARS first
      baseAmount = Math.round(usdToArs(subtotalUSD));
    } else {
      baseAmount = subtotalUSD; // Keep in USD
    }
    
    const totalDiscount = calculateTotalDiscount();
    return baseAmount - totalDiscount;
  };

  // Helper function to handle split payment toggle
  const handleSplitPaymentToggle = (enabled: boolean) => {
    const isFrozen = isItemFrozen();
    if (isFrozen) return; // Cannot split frozen items

    const currentPaymentMethod = getFirstPaymentMethod();
    if (!currentPaymentMethod) return;

    if (enabled) {
      // Enable split payment - create second payment method
      const finalAmountWithSeña = calculateDiscountedTotal();
      const firstAmount = Math.round(finalAmountWithSeña / 2); // Split roughly in half
      const secondAmount = calculateSecondPaymentAmount(firstAmount);
      
      // For split payment, the discount and seña are already applied to the total
      // So we don't apply additional discount to individual payments
      // BUT we preserve the descuentosActivos state
      const firstMethod = {
        ...currentPaymentMethod,
        monto: firstAmount, // Amount after discount and seña
        montoFinal: firstAmount, // Amount after discount and seña
        descuentoAplicado: 0, // No additional discount for split payments
        descuentoGlobalPorcentaje: 0, // No additional discount percentage
        recargoPorcentaje: 0,
        moneda: MONEDAS.USD as MonedaNew,
      };

      const secondMethod = {
        ...currentPaymentMethod,
        monto: secondAmount, // Amount after discount (already discounted)
        montoFinal: secondAmount, // Amount after discount (already discounted)
        descuentoAplicado: 0, // No additional discount for split payments
        descuentoGlobalPorcentaje: 0, // No additional discount percentage
        recargoPorcentaje: 0,
        moneda: MONEDAS.ARS as MonedaNew,
      };

      onUpdateItem(item.id!, { metodosPago: [firstMethod, secondMethod] });
      
      // IMPORTANT: Do NOT change descuentosActivos state here
      // The discount is applied to the total before splitting, so we keep it active
    } else {
      // Disable split payment - keep only first method
      const finalAmountWithSeña = calculateDiscountedTotal();
      const singleMethod = {
        ...currentPaymentMethod,
        monto: Math.round(finalAmountWithSeña),
        montoFinal: Math.round(finalAmountWithSeña),
        moneda: MONEDAS.USD as MonedaNew,
      };

      onUpdateItem(item.id!, { metodosPago: [singleMethod] });
      
      // IMPORTANT: Do NOT change descuentosActivos state here
      // The discount should remain active as it was before
      
      // However, we need to restore the discount information in the single method
      // since the split payment methods had descuentoGlobalPorcentaje: 0
      if (descuentosActivos) {
        const itemSubtotalUSD = calculateItemSubtotal();
        const currentCurrency = singleMethod.moneda || MONEDAS.USD;
        
        // Determine base amount in the payment currency
        let baseAmount: number;
        if (isItemFrozen()) {
          baseAmount = itemSubtotalUSD; // Already in ARS native
        } else if (currentCurrency === MONEDAS.ARS) {
          // Convert USD subtotal to ARS first
          baseAmount = Math.round(usdToArs(itemSubtotalUSD));
        } else {
          baseAmount = itemSubtotalUSD; // Keep in USD
        }
        
        // Calculate discount with the base amount in the correct currency
        const { montoFinal, descuentoAplicado } = calculateDiscount(
          singleMethod.tipo || METODOS_PAGO.EFECTIVO, 
          baseAmount, 
          currentCurrency
        );
        
        const updatedSingleMethod = {
          ...singleMethod,
          monto: baseAmount, // Use the original subtotal in the correct currency
          montoFinal: Math.round(montoFinal), // Use the discounted total in the correct currency
          descuentoAplicado: Math.round(descuentoAplicado),
          descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / baseAmount) * 100) : 0,
          recargoPorcentaje: 0,
        };

        onUpdateItem(item.id!, { metodosPago: [updatedSingleMethod] });
      }
    }
  };

  // Helper function to calculate second payment amount automatically
  const calculateSecondPaymentAmount = (firstPaymentAmount: number) => {
    const finalAmountWithSeña = calculateDiscountedTotal();
    const remainingAmount = finalAmountWithSeña - firstPaymentAmount;
    // Convert USD remaining amount to ARS using the exchange rate and round to integer
    const secondAmount = Math.round(usdToArs(remainingAmount)); // Convert USD to ARS and round
    return secondAmount;
  };

  // Helper function to handle first payment amount change (when split is enabled)
      const handleFirstPaymentAmountChange = (newAmount: number) => {
    const cleanAmount = Math.round(newAmount); // Use Math.round instead of Math.floor
    const finalAmountWithSeña = calculateDiscountedTotal();
    const subtotal = calculateItemSubtotal();
    
    // Ensure first payment doesn't exceed final amount with seña
    if (cleanAmount > finalAmountWithSeña) {
        toast.error('El monto de pago no puede ser mayor al total con descuento y seña');
      return;
    }
    
    // Ensure first payment doesn't exceed subtotal
    if (cleanAmount > subtotal) {
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
    
    // For split payment, the discount is already applied to the total
    // So we don't apply additional discount to individual payments
    // BUT we preserve the descuentosActivos state
    const firstMethodWithDiscount = {
      ...firstMethod,
      monto: cleanAmount, // Amount entered by user
      montoFinal: cleanAmount, // Amount after discount (already discounted)
      descuentoAplicado: 0, // No additional discount for split payments
      descuentoGlobalPorcentaje: 0, // No additional discount percentage
      recargoPorcentaje: 0,
    };

    const secondMethod = {
      ...getFirstPaymentMethod(),
      monto: secondAmount, // Amount calculated
      montoFinal: secondAmount, // Amount after discount (already discounted)
      descuentoAplicado: 0, // No additional discount for split payments
      descuentoGlobalPorcentaje: 0, // No additional discount percentage
      recargoPorcentaje: 0,
      moneda: MONEDAS.ARS as MonedaNew,
    };

    onUpdateItem(item.id!, { metodosPago: [firstMethodWithDiscount, secondMethod] });
    
    // Update local state to reflect the actual value used
    setLocalFirstPaymentAmount(cleanAmount.toString());
    
    // IMPORTANT: Do NOT change descuentosActivos state here
    // The discount is applied to the total before splitting, so we keep it active
  };



  // Helper function to handle quantity change (keep recalculation in a dedicated effect)
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedSubtotal = (parseFloat(String(item.precio)) || 0) * newQuantity;
    onUpdateItem(item.id!, { cantidad: newQuantity, subtotal: updatedSubtotal });
  };

  // Helper function to get the correct amount for payment method
  const getPaymentAmount = () => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) {
      // If no payment method set, initialize with EFECTIVO
      const baseAmount = calculateItemSubtotal(); // Use subtotal, not discounted total
      // If item is not frozen and needs ARS, convert USD→ARS
      if (!isItemFrozen()) {
        return Math.round(usdToArs(baseAmount));
      }
      return baseAmount;
    }
    
    // Return the final amount after discount in the correct currency
    return paymentMethod.montoFinal || paymentMethod.monto || calculateDiscountedTotal();
  };

  // Helper function to initialize payment method with correct currency and amount
  const initializePaymentMethod = (currency: string) => {
    // Use subtotal (without discount) as base amount
    const baseAmountUSD = calculateItemSubtotal();
    let baseAmount: number;
    
    // Convert to the target currency if needed
    if (isItemFrozen()) {
      baseAmount = baseAmountUSD; // Already in ARS native
    } else if (currency === MONEDAS.ARS) {
      // Convert USD subtotal to ARS first
      baseAmount = Math.round(usdToArs(baseAmountUSD));
    } else {
      baseAmount = baseAmountUSD; // Keep in USD
    }
    
    // Check if split payment is enabled
    const isSplitEnabled = isSplitPaymentEnabled();
    
    if (isSplitEnabled) {
      // For split payment, apply discount to the total and split the final amount
      const finalAmountWithSeña = calculateDiscountedTotal();
      const splitAmount = Math.round(finalAmountWithSeña / 2); // Split roughly in half
      
      return {
        tipo: METODOS_PAGO.EFECTIVO as TipoPagoNew,
        moneda: currency as MonedaNew,
        monto: splitAmount,
        montoFinal: splitAmount,
        descuentoAplicado: 0,
        descuentoGlobalPorcentaje: 0,
        recargoPorcentaje: 0,
      };
    } else {
      // For single payment, apply discount to the converted amount
      const { montoFinal, descuentoAplicado } = calculateDiscount(METODOS_PAGO.EFECTIVO, baseAmount, currency);
      
      return {
        tipo: METODOS_PAGO.EFECTIVO as TipoPagoNew,
        moneda: currency as MonedaNew,
        monto: baseAmount,
        montoFinal: montoFinal,
        descuentoAplicado: descuentoAplicado,
        descuentoGlobalPorcentaje: descuentoAplicado > 0 ? (descuentoAplicado / baseAmount) * 100 : 0,
        recargoPorcentaje: 0,
      };
    }
  };

  // Initialize payment method if it doesn't exist
  useEffect(() => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) {
      const defaultCurrency = isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD;
      const newPaymentMethod = initializePaymentMethod(defaultCurrency);
      onUpdateItem(item.id!, { metodosPago: [newPaymentMethod] });
    }
  }, []); // Only run once when component mounts

  // Update payment method when item changes (quantity, price, etc.) but avoid overriding backend on first mount
  const skipInitialRecalcRef = useRef(true);
  useEffect(() => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod) return;

    // Skip the very first run (hydration) to preserve backend amounts when editing
    if (skipInitialRecalcRef.current) {
      skipInitialRecalcRef.current = false;
      return;
    }

    const itemSubtotalUSD = calculateItemSubtotal(); // For non-frozen items, price is USD
    const currentCurrency = paymentMethod.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
    const splitEnabled = isSplitPaymentEnabled();

    let updatedPaymentMethod: PaymentMethodWithDiscount;

    if (splitEnabled) {
      const discountedTotalUSD = calculateDiscountedTotal();
      const splitAmountUSD = Math.round(discountedTotalUSD / 2);
      updatedPaymentMethod = {
        ...paymentMethod,
        monto: splitAmountUSD,
        montoFinal: splitAmountUSD,
        descuentoAplicado: 0,
        descuentoGlobalPorcentaje: 0,
        recargoPorcentaje: 0,
      };
    } else {
      // Determine base amount in the payment currency
      const baseAmount = isItemFrozen()
        ? itemSubtotalUSD // In ARS native already
        : currentCurrency === MONEDAS.ARS
          ? Math.round(usdToArs(itemSubtotalUSD))
          : itemSubtotalUSD;

      const { montoFinal, descuentoAplicado } = calculateDiscount(
        paymentMethod.tipo || METODOS_PAGO.EFECTIVO,
        baseAmount,
        currentCurrency
      );

      updatedPaymentMethod = {
        ...paymentMethod,
        monto: baseAmount,
        montoFinal: Math.round(montoFinal),
        descuentoAplicado: Math.round(descuentoAplicado),
        descuentoGlobalPorcentaje:
          descuentoAplicado > 0 ? Math.round((descuentoAplicado / baseAmount) * 100) : 0,
        recargoPorcentaje: 0,
      };
    }

    onUpdateItem(item.id!, { metodosPago: [updatedPaymentMethod] });
  }, [item.cantidad, item.precio]);

  // Recalculate discounts when descuentosActivos changes
  useEffect(() => {
    const paymentMethod = getFirstPaymentMethod();
    if (!paymentMethod || skipInitialRecalcRef.current) return;

    const itemSubtotalUSD = calculateItemSubtotal();
    const currentCurrency = paymentMethod.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
    
    // Determine base amount in the payment currency
    let baseAmount: number;
    if (isItemFrozen()) {
      baseAmount = itemSubtotalUSD; // Already in ARS native
    } else if (currentCurrency === MONEDAS.ARS) {
      // Convert USD subtotal to ARS first
      baseAmount = Math.round(usdToArs(itemSubtotalUSD));
    } else {
      baseAmount = itemSubtotalUSD; // Keep in USD
    }
    
    // Calculate discount with the base amount in the correct currency
    const { montoFinal, descuentoAplicado } = calculateDiscount(
      paymentMethod.tipo || METODOS_PAGO.EFECTIVO, 
      baseAmount, 
      currentCurrency
    );
    
    const updatedPaymentMethod: PaymentMethodWithDiscount = {
      ...paymentMethod,
      monto: baseAmount, // Use the original subtotal in the correct currency
      montoFinal: Math.round(montoFinal), // Use the discounted total in the correct currency
      descuentoAplicado: Math.round(descuentoAplicado),
      descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / baseAmount) * 100) : 0,
      recargoPorcentaje: 0,
    };

    onUpdateItem(item.id!, { metodosPago: [updatedPaymentMethod] });
  }, [descuentosActivos]);





  // Helper function to handle currency conversion when switching
  const handleCurrencyChange = (newCurrency: string, paymentIndex: number = 0) => {
    const currentPaymentMethod = paymentIndex === 0 ? getFirstPaymentMethod() : getSecondPaymentMethod();
    
    if (!currentPaymentMethod) {
      // Initialize new payment method with EFECTIVO as default
      const newPaymentMethod = initializePaymentMethod(newCurrency);
      onUpdateItem(item.id!, { metodosPago: [newPaymentMethod] });
      return;
    }

    // Get the original subtotal in USD (before any discounts)
    const originalSubtotalUSD = calculateItemSubtotal();
    const currentCurrency = currentPaymentMethod.moneda || MONEDAS.USD;
    
    let newAmount: number;
    let newMontoFinal: number;
    let descuentoAplicado: number = 0;
    
    if (currentCurrency === MONEDAS.USD && newCurrency === MONEDAS.ARS) {
      // Converting from USD to ARS: convert subtotal first, then apply discount
      const subtotalARS = Math.round(usdToArs(originalSubtotalUSD));
      
      if (descuentosActivos) {
        // Apply discount to the ARS amount
        const porcentajeDescuento = getEffectiveDiscount(currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO);
        descuentoAplicado = Math.round((subtotalARS * porcentajeDescuento) / 100);
        newMontoFinal = subtotalARS - descuentoAplicado;
      } else {
        newMontoFinal = subtotalARS;
      }
      
      newAmount = subtotalARS; // monto should be the original amount in ARS
    } else if (currentCurrency === MONEDAS.ARS && newCurrency === MONEDAS.USD) {
      // Converting from ARS to USD: convert ARS amount back to USD, then apply discount
      const subtotalUSD = originalSubtotalUSD; // Already in USD
      
      if (descuentosActivos) {
        // Apply discount to the USD amount
        const porcentajeDescuento = getEffectiveDiscount(currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO);
        descuentoAplicado = Math.round((subtotalUSD * porcentajeDescuento) / 100);
        newMontoFinal = subtotalUSD - descuentoAplicado;
      } else {
        newMontoFinal = subtotalUSD;
      }
      
      newAmount = subtotalUSD; // monto should be the original amount in USD
    } else {
      // Same currency, no conversion needed
      newAmount = originalSubtotalUSD;
      if (descuentosActivos) {
        const porcentajeDescuento = getEffectiveDiscount(currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO);
        descuentoAplicado = Math.round((originalSubtotalUSD * porcentajeDescuento) / 100);
        newMontoFinal = originalSubtotalUSD - descuentoAplicado;
      } else {
        newMontoFinal = originalSubtotalUSD;
      }
    }

    const updatedPaymentMethod: PaymentMethodWithDiscount = {
      ...currentPaymentMethod,
      moneda: newCurrency as MonedaNew,
      monto: newAmount,
      montoFinal: newMontoFinal,
      descuentoAplicado: descuentoAplicado,
      descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / newAmount) * 100) : 0,
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
    const itemSubtotalUSD = calculateItemSubtotal(); // Base in USD for non-frozen
    const currentCurrency = currentPaymentMethod?.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
    
    // Determine base amount in the payment currency
    let baseAmount: number;
    if (isItemFrozen()) {
      baseAmount = itemSubtotalUSD; // Already in ARS native
    } else if (currentCurrency === MONEDAS.ARS) {
      // Convert USD subtotal to ARS first, then apply discount
      baseAmount = Math.round(usdToArs(itemSubtotalUSD));
    } else {
      baseAmount = itemSubtotalUSD; // Keep in USD
    }
    
    // Calculate discount with the base amount in the correct currency
    const { montoFinal, descuentoAplicado } = calculateDiscount(newType, baseAmount, currentCurrency);
    
    const updatedPaymentMethod: PaymentMethodWithDiscount = {
      ...currentPaymentMethod,
      tipo: newType as TipoPagoNew,
      monto: baseAmount, // Use subtotal in the correct currency
      montoFinal: Math.round(montoFinal), // This should be the discounted amount in the correct currency
      descuentoAplicado: Math.round(descuentoAplicado),
      descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / baseAmount) * 100) : 0,
      recargoPorcentaje: 0,
    };

    // Update only the first payment method with all the calculated properties
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = [...(itemWithPayment.metodosPago || [])];
    updatedMetodosPago[0] = updatedPaymentMethod; // Update only the first payment method

    onUpdateItem(item.id!, { metodosPago: updatedMetodosPago });
  };

  // Helper function to handle amount change
  const handleAmountChange = (newAmount: number, paymentIndex: number = 0) => {
    // Round to integer instead of floor
    const cleanAmount = Math.round(newAmount);
    const subtotalUSD = calculateItemSubtotal();
    
    // Validate against subtotal
    const currentPaymentMethod = paymentIndex === 0 ? getFirstPaymentMethod() : getSecondPaymentMethod();
    const currentCurrency = currentPaymentMethod?.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
    const maxAllowed = isItemFrozen()
      ? subtotalUSD // ARS native
      : currentCurrency === MONEDAS.ARS
        ? Math.round(usdToArs(subtotalUSD))
        : subtotalUSD;

    if (cleanAmount > maxAllowed) return;

    const paymentType = currentPaymentMethod?.tipo || METODOS_PAGO.EFECTIVO;
    
    // Check if split payment is enabled
    const isSplitEnabled = isSplitPaymentEnabled();
    
    let updatedPaymentMethod: PaymentMethodWithDiscount;
    
    if (isSplitEnabled) {
      // For split payment, no additional discount is applied
      updatedPaymentMethod = {
        ...currentPaymentMethod,
        monto: cleanAmount,
        montoFinal: cleanAmount,
        descuentoAplicado: 0,
        descuentoGlobalPorcentaje: 0,
        recargoPorcentaje: 0,
      };
    } else {
      // For single payment, apply discount to the amount
      const { montoFinal, descuentoAplicado } = calculateDiscount(paymentType, cleanAmount, currentCurrency);
      
      updatedPaymentMethod = {
        ...currentPaymentMethod,
        monto: cleanAmount,
        montoFinal: Math.round(montoFinal), // Round the final amount
        descuentoAplicado: Math.round(descuentoAplicado), // Round the discount
        descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / cleanAmount) * 100) : 0,
        recargoPorcentaje: 0,
      };
    }

    // Update the specific payment method
    const itemWithPayment = item as ItemWithPaymentMethods;
    const updatedMetodosPago = [...(itemWithPayment.metodosPago || [])];
    updatedMetodosPago[paymentIndex] = updatedPaymentMethod;

    onUpdateItem(item.id!, { metodosPago: updatedMetodosPago });
  };

  // Helper function to handle discounts toggle
  const handleDescuentosToggle = (enabled: boolean) => {
    setDescuentosActivos(enabled);
    
    // Recalculate payment methods with new discount settings
    const currentPaymentMethod = getFirstPaymentMethod();
    if (currentPaymentMethod) {
      const isSplitEnabled = isSplitPaymentEnabled();
      
      if (isSplitEnabled) {
        // For split payment, recalculate both payments
        const finalAmountWithSeña = calculateDiscountedTotal();
        const firstAmount = Math.round(finalAmountWithSeña / 2);
        const secondAmount = calculateSecondPaymentAmount(firstAmount);
        
        const firstMethod = {
          ...currentPaymentMethod,
          monto: firstAmount,
          montoFinal: firstAmount,
          descuentoGlobalPorcentaje: 0,
          recargoPorcentaje: 0,
        };

        const secondMethod = {
          ...getSecondPaymentMethod(),
          monto: secondAmount,
          montoFinal: secondAmount,
          descuentoGlobalPorcentaje: 0,
          recargoPorcentaje: 0,
        };

        onUpdateItem(item.id!, { metodosPago: [firstMethod, secondMethod] });
      } else {
        // For single payment, recalculate with new discount settings
        const itemSubtotalUSD = calculateItemSubtotal();
        const currentCurrency = currentPaymentMethod.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
        
        // Determine base amount in the payment currency
        let baseAmount: number;
        if (isItemFrozen()) {
          baseAmount = itemSubtotalUSD; // Already in ARS native
        } else if (currentCurrency === MONEDAS.ARS) {
          // Convert USD subtotal to ARS first
          baseAmount = Math.round(usdToArs(itemSubtotalUSD));
        } else {
          baseAmount = itemSubtotalUSD; // Keep in USD
        }
        
        // Calculate discount with the base amount in the correct currency
        const { montoFinal, descuentoAplicado } = calculateDiscount(
          currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO, 
          baseAmount, 
          currentCurrency
        );
        
        const updatedPaymentMethod = {
          ...currentPaymentMethod,
          monto: baseAmount, // Use the original subtotal in the correct currency
          montoFinal: Math.round(montoFinal), // Use the discounted total in the correct currency
          descuentoAplicado: Math.round(descuentoAplicado),
          descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / baseAmount) * 100) : 0,
          recargoPorcentaje: 0,
        };

        onUpdateItem(item.id!, { metodosPago: [updatedPaymentMethod] });
      }
    }
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

  // Sync discounts when descuentosActivos changes
  useEffect(() => {
    // Only recalculate if we have payment methods and descuentosActivos changed
    const currentPaymentMethod = getFirstPaymentMethod();
    if (currentPaymentMethod) {
      const isSplitEnabled = isSplitPaymentEnabled();
      
      if (isSplitEnabled) {
        // For split payment, recalculate both payments
        const finalAmountWithSeña = calculateDiscountedTotal();
        const firstAmount = Math.round(finalAmountWithSeña / 2);
        const secondAmount = calculateSecondPaymentAmount(firstAmount);
        
        const firstMethod = {
          ...currentPaymentMethod,
          monto: firstAmount,
          montoFinal: firstAmount,
          descuentoGlobalPorcentaje: 0,
          recargoPorcentaje: 0,
        };

        const secondMethod = {
          ...getSecondPaymentMethod(),
          monto: secondAmount,
          montoFinal: secondAmount,
          descuentoGlobalPorcentaje: 0,
          recargoPorcentaje: 0,
        };

        onUpdateItem(item.id!, { metodosPago: [firstMethod, secondMethod] });
      } else {
        // For single payment, recalculate with new discount settings
        const itemSubtotalUSD = calculateItemSubtotal();
        const currentCurrency = currentPaymentMethod.moneda || (isItemFrozen() ? MONEDAS.ARS : MONEDAS.USD);
        
        // Determine base amount in the payment currency
        let baseAmount: number;
        if (isItemFrozen()) {
          baseAmount = itemSubtotalUSD; // Already in ARS native
        } else if (currentCurrency === MONEDAS.ARS) {
          // Convert USD subtotal to ARS first
          baseAmount = Math.round(usdToArs(itemSubtotalUSD));
        } else {
          baseAmount = itemSubtotalUSD; // Keep in USD
        }
        
        // Calculate discount with the base amount in the correct currency
        const { montoFinal, descuentoAplicado } = calculateDiscount(
          currentPaymentMethod.tipo || METODOS_PAGO.EFECTIVO, 
          baseAmount, 
          currentCurrency
        );
        
        const updatedPaymentMethod = {
          ...currentPaymentMethod,
          monto: baseAmount, // Use the original subtotal in the correct currency
          montoFinal: Math.round(montoFinal), // Use the discounted total in the correct currency
          descuentoAplicado: Math.round(descuentoAplicado),
          descuentoGlobalPorcentaje: descuentoAplicado > 0 ? Math.round((descuentoAplicado / baseAmount) * 100) : 0,
          recargoPorcentaje: 0,
        };

        onUpdateItem(item.id!, { metodosPago: [updatedPaymentMethod] });
      }
    }
  }, [descuentosActivos]); // Trigger when descuentosActivos changes

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
          
          {/* Discounts Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={descuentosActivos}
              onCheckedChange={(checked) => {
                // Call local function for immediate UI update
                handleDescuentosToggle(checked as boolean);
                // Also notify parent component
                if (onDescuentosToggle) {
                  onDescuentosToggle(item.id!, checked as boolean);
                }
              }}
              disabled={disabled}
              className={`h-4 w-4 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <Label className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
              Descuentos activos
            </Label>
          </div>
          
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
              
              // Update local state immediately for responsive UI
              setLocalQuantity(value);
              
              if (!isNaN(value) && value >= 1) {
                handleQuantityChange(value);
              } else if (inputValue === '') {
                // Allow empty input temporarily
              } else {
              }
            }}
            onBlur={(e) => {
              if (disabled) return;
              // Ensure minimum value when input loses focus
              const value = parseInt(e.target.value);
              if (isNaN(value) || value < 1) {
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
              value={isSplitEnabled ? localFirstPaymentAmount : (paymentMethod?.montoFinal || paymentMethod?.monto || calculateDiscountedTotal())}
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
        {discountInfo && descuentosActivos && (
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

        {/* Discount Status Info */}
        {!descuentosActivos && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-100 p-2">
            <span className="text-xs text-yellow-700">
              ⚠️ Descuentos desactivados - No se aplicarán descuentos por método de pago
            </span>
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
            Conversión automática: USD {formatUSD(calculateItemSubtotal())} → ARS {formatARSFromNative(Math.round(usdToArs(calculateItemSubtotal())))}
            {descuentosActivos && getEffectiveDiscount(paymentMethod.tipo as keyof typeof descuentosPorMetodo) > 0 && (
              <div className="mt-1 text-xs text-blue-600">
                Con descuento: ARS {formatARSFromNative(Math.round(usdToArs(calculateItemSubtotal()) - calculateTotalDiscount()))}
              </div>
            )}
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

                {mostrarSelectorResponsables && (() => {
                  // Filtrar personal basado en la unidad de negocio del servicio
                  const unidadNegocioNombre = item.productoServicio?.unidadNegocio?.nombre?.toLowerCase().trim() || '';
                  // Verificar si es tattoo o cosmetic tattoo (más flexible para detectar variaciones)
                  const esTattooOCosmeticTattoo = unidadNegocioNombre.includes('tattoo') || 
                                                   unidadNegocioNombre.includes('cosmetic');
                  
                  // Si el servicio es de tattoo o cosmetic tattoo, solo mostrar "mery garcía"
                  const personalFiltrado = esTattooOCosmeticTattoo
                    ? personal.filter((p) => {
                        const nombreLower = p.nombre.toLowerCase().trim();
                        // Buscar "mery" en el nombre (puede ser "Mery García", "Mery Garcia", etc.)
                        return nombreLower.includes('mery');
                      })
                    : personal;
                  
                  return (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                      <div className="max-h-48 overflow-y-auto p-2">
                        {personalFiltrado.length > 0 ? (
                          personalFiltrado.map((persona) => (
                            <div
                              key={persona.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Asegurar que se actualiza el estado correctamente
                                onUpdateItem(item.id!, {
                                  responsablesIds: [persona.id]
                                });
                                
                                setMostrarSelectorResponsables(false);
                                
                              }}
                              className="flex cursor-pointer items-center space-x-2 rounded px-2 py-1 hover:bg-gray-100"
                            >
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {persona.nombre}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-sm text-gray-500">
                            No hay responsables disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 