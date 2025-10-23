'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Save,
  X,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Hash,
  Package,
  Edit,
} from 'lucide-react';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useInitializeComandaStore } from '@/hooks/useInitializeComandaStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import useTrabajadoresStore from '@/features/personal/store/trabajadoresStore';
import {
  ComandaUpdateNew,
  EstadoDeComandaNew,
  TipoDeComandaNew,
  ProductoServicioNew,
  TipoPagoNew,
  MonedaNew,
  TipoItemNew,
  NombreDescuentoNew,
  CajaNew,
  ClienteNew,
  ComandaNew,
  ItemComandaCreateNew,
  MetodoPagoNew,
  EstadoPrepagoNew,
} from '@/services/unidadNegocio.service';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import ClienteSelector from '@/components/comandas/ClienteSelector';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { MONEDAS, METODOS_PAGO } from '@/lib/constants';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import TransactionSummaryEdit from './TransactionSummaryEdit';
import ItemFormSimple from './ItemFormSimple';
import MetodosPagoComanda from './MetodosPagoComanda';

/**
 * ModalEditarTransaccionRefactored Component
 * 
 * This is the edit version of the transaction modal that allows editing all aspects
 * of an existing comanda. It uses the new payment method system where each 
 * product/service is associated with a specific payment method.
 * 
 * Key Features:
 * - Loads existing comanda data for editing
 * - Each item has its own payment method configuration
 * - Supports editing all comanda fields
 * - Currency restrictions based on frozen pricing
 * - Simplified summary showing only subtotal and total
 * - Support for multiple currencies in a single transaction
 * 
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback to close the modal
 * @param comandaId - Comanda ID to edit
 */
interface ModalEditarTransaccionRefactoredProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
}

interface PaymentMethod {
  tipo: string;
  moneda: string;
  monto: number;
  montoFinal: number;
  descuentoAplicado: number;
}

// Extended interface to include paymentMethod for the new payment system
interface ItemWithPaymentMethod extends ItemComandaCreateNew {
  paymentMethod?: PaymentMethod;
}

export default function ModalEditarTransaccionRefactored({
  isOpen,
  onClose,
  comandaId,
}: ModalEditarTransaccionRefactoredProps) {
  // Store hooks
  const {
    actualizarComanda,
    obtenerComandaPorId,
    cargarComandasPaginadas,
  } = useComandaStore();

  const { productosServicios, loadProductosServicios } =
    useProductosServiciosStore();
  const { trabajadores, loadTrabajadores } = useTrabajadoresStore();
  const personal = trabajadores;
  const { cargarClientes, obtenerEstadisticasSeñas } = useClientesStore();
  const { handleError } = useErrorHandler();

  const {
    isExchangeRateValid,
    formatARS,
    formatUSD,
    formatDual,
    formatARSFromNative,
    usdToArs,
  } = useCurrencyConverter();

  const [dolar, setDolar] = useState(0);
  const [dolarActual, setDolarActual] = useState(0); // Valor actual del dólar
  const [usarDolarOriginal, setUsarDolarOriginal] = useState(true); // Por defecto usar el original
  const { lastDolar } = useExchangeRateStore();
  const [comandaState, setComandaState] = useState<ComandaNew | undefined>(
    undefined
  );

  const { getTipoCambio, cargando } = useExchangeRateStore();
  const { user } = useAuth();
  const { descuentosPorMetodo } = useConfiguracion();

  // Global state for discounts toggle
  const [descuentosActivos, setDescuentosActivos] = useState(true);

  // Initialize stores
  useInitializeComandaStore();

  // Form state
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteNew | null>(null);
  const [clienteProveedor, setClienteProveedor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [responsablesIds, setResponsablesIds] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemComandaCreateNew[]>([]);
  
  // Calculate total amount and detect currency based on items
  const totalTransaccion = useMemo(() => {
    let totalUSD = 0;
    let totalARS = 0;
    let hasUSD = false;
    let hasARS = false;
    
    items.forEach(item => {
      const isFrozen = item.productoServicio?.esPrecioCongelado || false;
      const pagarEnPesos = (item as any).pagarEnPesos || false;
      
      // Get base price based on frozen status
      const precioBase = isFrozen 
        ? (item.productoServicio?.precioFijoARS || 0)
        : (item.precio || 0);
      
      // Calculate subtotal
      const itemSubtotal = precioBase * (item.cantidad || 1);
      
      // Apply discount
      const itemTotal = itemSubtotal - (item.descuento || 0);
      
      // If frozen or paying in pesos, it's ARS
      if (isFrozen) {
        // Frozen prices are already in ARS
        totalARS += itemTotal;
        hasARS = true;
      } else if (pagarEnPesos) {
        // Convert USD to ARS
        const totalEnARS = usdToArs(itemTotal);
        totalARS += totalEnARS;
        hasARS = true;
      } else {
        // Keep in USD
        totalUSD += itemTotal;
        hasUSD = true;
      }
    });
    
    return { totalUSD, totalARS, hasUSD, hasARS };
  }, [items, usdToArs]);
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [fechaCreacion, setFechaCreacion] = useState<Date>(new Date());

  // Seña state - now global for entire transaction
  const [señaActiva, setSeñaActiva] = useState(false);
  const [señaMonedas, setSeñaMonedas] = useState<string[]>([]); // Array of selected currencies for seña

  // Payment methods state - at comanda level
  const [metodosPago, setMetodosPago] = useState<Partial<MetodoPagoNew>[]>([
    { tipo: TipoPagoNew.EFECTIVO, monto: 0, moneda: MonedaNew.ARS }
  ]);

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useModalScrollLock(isOpen);

  // Helper function for dual currency display
  const formatAmount = (amount: number) => {
    return isExchangeRateValid ? formatDual(amount) : formatUSD(amount);
  };

  // Helper function for ARS-native amounts (cuando hay items con monto fijo ARS)
  const formatAmountForARSFixed = (amount: number, esCalculoARS?: boolean) => {
    if (tipo === 'egreso' && hayItemsCongelados && esCalculoARS) {
      // Para egresos con monto fijo ARS: mostrar valor nativo sin conversión
      return `🔒 ${formatARSFromNative(amount)}`;
    }
    // Fallback a formato normal
    return formatAmount(amount);
  };

  // Detectar si hay items con precio congelado en ARS (ingresos) o monto fijo ARS (egresos)
  const hayItemsCongelados = useMemo(() => {
    if (tipo === 'ingreso') {
      return items.some((item) => item.productoServicio?.esPrecioCongelado);
    } else {
      // Para egresos: detectar items con monto fijo en ARS
      return items.some((item) => item.productoServicio?.esPrecioCongelado);
    }
  }, [items, tipo]);

  // Cargar el valor actual del dólar al abrir el modal
  useEffect(() => {
    if (isOpen) {
      lastDolar()
        .then((dolarR) => {
          setDolarActual(dolarR.venta);
          // NO modificar dolar aquí - que se mantenga el valor de la comanda
          // Solo establecer dolarActual para el selector
        })
        .catch((error) => {
          toast.error('Error al obtener el último dólar');
        });
    }
  }, [isOpen]);

  // Load existing comanda data
  useEffect(() => {
    const cargarComanda = async () => {
      if (comandaId && isOpen) {
        try {
          setIsLoading(true);
          const comanda = await obtenerComandaPorId(comandaId);
          setComandaState(comanda);
          setTipo(comanda.tipoDeComanda === TipoDeComandaNew.INGRESO ? 'ingreso' : 'egreso');

          // Establecer el valor del dólar original de la comanda
          if (comanda.valorDolar) {
            setDolar(comanda.valorDolar);
            setUsarDolarOriginal(true); // Asegurar que esté en modo "Original"
          }

          // Cargar todos los datos de la comanda
          setClienteSeleccionado(comanda.cliente || null);
          setClienteProveedor(comanda.cliente?.nombre || '');
          setTelefono(comanda.cliente?.telefono || '');
          setObservaciones(comanda.observaciones || '');

          // Set creation date if available, otherwise use today
          if (comanda.createdAt) {
            setFechaCreacion(new Date(comanda.createdAt));
          } else {
            setFechaCreacion(new Date());
          }

          // Cargar estado de señas
          setSeñaActiva(comanda.usuarioConsumePrepagoARS || comanda.usuarioConsumePrepagoUSD || false);
          const monedasSeña: string[] = [];
          if (comanda.usuarioConsumePrepagoARS) monedasSeña.push('ARS');
          if (comanda.usuarioConsumePrepagoUSD) monedasSeña.push('USD');
          setSeñaMonedas(monedasSeña);

          // Cargar métodos de pago de la comanda
          if (comanda.metodosPago && comanda.metodosPago.length > 0) {
            setMetodosPago(comanda.metodosPago);
          } else {
            // Si no hay métodos de pago, usar el default
            setMetodosPago([{ tipo: TipoPagoNew.EFECTIVO, monto: 0, moneda: MonedaNew.ARS }]);
          }

          // Convertir items al formato correcto (sin payment methods)
          const itemsConvertidos = comanda.items?.map((item) => {
            // Extract trabajador from the item
            const trabajador = (item as any).trabajador;
            const responsablesIds = trabajador ? [trabajador.id] : [];

            return {
              id: item.id || `temp-${Date.now()}`,
              productoServicioId: item.productoServicioId || '',
              nombre: item.nombre || '',
              precio: item.precio || 0,
              cantidad: item.cantidad || 1,
              descuento: item.descuento || 0,
              subtotal: item.subtotal || 0,
              responsablesIds: responsablesIds,
              mostrarSelectorResponsables: false,
              productoServicio: item.productoServicio,
              trabajador: trabajador,
              trabajadorId: trabajador?.id || '',
              pagarEnPesos: false, // Frontend-only field
            };
          }) || [];
          setItems(itemsConvertidos);

          // Los descuentos ya no se activan globalmente, se aplican por item
          setDescuentosActivos(false);
        } catch (error) {
          console.error('Error al cargar comanda:', error);
          toast.error('Error al cargar la comanda');
        } finally {
          setIsLoading(false);
        }
      }
    };

    cargarComanda();
  }, [isOpen, comandaId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadTrabajadores(),
          cargarClientes(),
          loadProductosServicios(),
        ]);
      } catch (error) {
        handleError(error, 'cargar datos del modal');
      }
    };

    loadData();
  }, [loadTrabajadores, cargarClientes, loadProductosServicios, handleError]);

  // Manejar ESC para cerrar modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (mostrarBuscador) {
          setMostrarBuscador(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose, mostrarBuscador]);

  const agregarDesdeProducto = (producto: ProductoServicioNew) => {
    // Para productos congelados: NO convertir, usar precio ARS como base
    // Para productos normales: mantener lógica USD actual
    let precioBase = producto.precio;
    let subtotalBase = producto.precio;

    if (producto.esPrecioCongelado && producto.precioFijoARS) {
      // Items congelados: usar ARS fijo, sin conversiones
      precioBase = producto.precioFijoARS;
      subtotalBase = producto.precioFijoARS;
    } else {
      // Items normales: usar precio USD como base
      precioBase = producto.precio;
      subtotalBase = producto.precio;
    }

    // Determinar la moneda por defecto
    const defaultCurrency = producto.esPrecioCongelado ? MONEDAS.ARS : MONEDAS.USD;
    const defaultAmount = subtotalBase;

    // Crear método de pago inicial con EFECTIVO
    const initialPaymentMethod = {
      tipo: METODOS_PAGO.EFECTIVO as TipoPagoNew,
      moneda: defaultCurrency as MonedaNew,
      monto: defaultAmount,
      montoFinal: defaultAmount,
      descuentoAplicado: 0,
    };

    const nuevoItem: ItemComandaCreateNew = {
      id: `temp-${Date.now()}`,
      productoServicioId: producto.id,
      productoServicio: producto, // mantener objeto completo para cálculos
      nombre: producto.nombre,
      precio: precioBase,
      cantidad: 1,
      descuento: 0,
      subtotal: subtotalBase, // precio * cantidad
      responsablesIds: [],
      trabajadorId: '', // Se debe seleccionar un responsable antes de guardar
    };

    setItems([...items, nuevoItem]);
    setMostrarBuscador(false);
    setBusqueda('');
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Update item with payment method
  const actualizarItem = (
    id: string,
    updates: any
  ) => {
    const itemToUpdate = items.find(item => item.id === id);

    const newItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };

        // If quantity or price is updated, recalculate subtotal
        if (updates.cantidad !== undefined || updates.precio !== undefined) {
          const precio = parseFloat(updatedItem.precio) || 0;
          const cantidad = parseInt(updatedItem.cantidad) || 1;
          const newSubtotal = precio * cantidad;
          updatedItem.subtotal = newSubtotal; // Ensure it's a number
        }

        return updatedItem;
      }
      return item;
    });

    setItems(newItems);
  };

  // Handle global discounts toggle
  const handleGlobalDescuentosToggle = (enabled: boolean) => {
    setDescuentosActivos(enabled);
    // Note: Discounts are now managed at item level via descuento field
    // No need to update payment methods as they are at comanda level
  };

  // DEPRECATED: Old implementation that used payment methods per item
  const handleGlobalDescuentosToggle_OLD = (enabled: boolean) => {
    setDescuentosActivos(enabled);

    // Update all items to reflect the new discount settings
    items.forEach(item => {
      const currentPaymentMethod = (item as any).metodosPago?.[0];
      if (currentPaymentMethod) {
        const isSplitEnabled = (item as any).metodosPago && (item as any).metodosPago.length > 1;

        if (isSplitEnabled) {
          // For split payment, recalculate both payments
          const itemTotal = (item.precio || 0) * (item.cantidad || 1);
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

          actualizarItem(item.id!, { metodosPago: [firstMethod, secondMethod] });
        } else {
          // For single payment, recalculate with new discount settings
          const itemTotal = (item.precio || 0) * (item.cantidad || 1);
          const discountAmount = enabled ?
            Math.round((itemTotal * (descuentosPorMetodo[currentPaymentMethod.tipo as keyof typeof descuentosPorMetodo] || 0)) / 100) : 0;

          const updatedPaymentMethod = {
            ...currentPaymentMethod,
            monto: itemTotal,
            montoFinal: itemTotal - discountAmount,
            descuentoAplicado: discountAmount,
            descuentoGlobalPorcentaje: discountAmount > 0 ? Math.round((discountAmount / itemTotal) * 100) : 0,
            recargoPorcentaje: 0,
          };

          actualizarItem(item.id!, { metodosPago: [updatedPaymentMethod] });
        }
      }
    });
  };

  // Wrapper function to match the expected signature
  const handleItemDescuentosToggle = (itemId: string, enabled: boolean) => {
    handleGlobalDescuentosToggle(enabled);
  };

  // Handle exchange rate change
  const handleExchangeRateChange = (useOriginal: boolean) => {
    setUsarDolarOriginal(useOriginal);

    const newDolarValue = useOriginal && comandaState?.valorDolar
      ? comandaState.valorDolar
      : dolarActual;

    setDolar(newDolarValue);

    // Recalcular montos para servicios USD pagados en ARS
    const updatedItems = items.map(item => {
      const isUSDService = !item.productoServicio?.esPrecioCongelado;
      const paymentMethods = (item as any).metodosPago || [];

      if (isUSDService && paymentMethods.length > 0) {
        const updatedPaymentMethods = paymentMethods.map((mp: any) => {
          if (mp.moneda === 'ARS') {
            // Recalcular el monto ARS basado en el nuevo tipo de cambio
            const baseUSDAmount = item.precio || 0;
            const quantity = item.cantidad || 1;
            const subtotalUSD = baseUSDAmount * quantity;

            // Aplicar descuento si existe
            const discountPercentage = parseFloat(mp.descuentoGlobalPorcentaje || 0);
            const discountAmount = discountPercentage > 0 ? (subtotalUSD * discountPercentage) / 100 : 0;
            const finalUSDAmount = subtotalUSD - discountAmount;

            // Convertir a ARS con el nuevo tipo de cambio
            const newARSAmount = Math.round(finalUSDAmount * newDolarValue);

            return {
              ...mp,
              monto: Math.round(subtotalUSD * newDolarValue),
              montoFinal: newARSAmount,
              descuentoAplicado: Math.round(discountAmount * newDolarValue)
            };
          }
          return mp;
        });

        return {
          ...item,
          metodosPago: updatedPaymentMethods
        };
      }

      return item;
    });

    setItems(updatedItems);
  };

  // Form validation
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!clienteProveedor.trim()) {
      nuevosErrores.clienteProveedor = 'El cliente es requerido';
      toast.error('El cliente es requerido');
      return false;
    }

    // Validar que todos los items de ingreso tengan responsable
    if (tipo === 'ingreso') {
      const itemsSinResponsable = items.filter((item) => !item.trabajadorId || item.trabajadorId === '');
      if (itemsSinResponsable.length > 0) {
        toast.error('Debe seleccionar un responsable para todos los servicios', {
          position: 'top-center',
        });
        nuevosErrores.responsable = 'Debe seleccionar un responsable por item';
        return false;
      }
    }

    if (items.length === 0) {
      nuevosErrores.items = 'Debe agregar al menos un item';
      toast.error('Debe agregar al menos un item');
      return false;
    }

    // Validar items
    items.forEach((item, index) => {
      if (!item.nombre?.trim()) {
        nuevosErrores[`item-${index}-nombre`] = 'El nombre es requerido';
        return false;
      }
      if (item.precio! <= 0) {
        nuevosErrores[`item-${index}-precio`] = 'El precio debe ser mayor a 0';
        return false;
      }
      if (item.cantidad! <= 0) {
        nuevosErrores[`item-${index}-cantidad`] =
          'La cantidad debe ser mayor a 0';
        return false;
      }
      if (item.trabajadorId?.length === 0) {
        nuevosErrores[`item-${index}-responsable`] = 'Debe seleccionar un responsable por item';
        return false;
      }
    });

    // Validar métodos de pago
    const metodosPagoValidos = metodosPago.filter(mp => mp.monto && mp.monto > 0);
    if (metodosPagoValidos.length === 0) {
      nuevosErrores.metodosPago = 'Debe ingresar al menos un monto de pago mayor a 0';
      toast.error('Debe ingresar al menos un monto de pago mayor a 0', {
        position: 'top-center',
      });
      return false;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Save transaction
  const handleSave = async () => {
    if (!validarFormulario()) return;
    setGuardando(true);

    try {

      // Convert items without payment methods (payment methods now at comanda level)
      const itemsForBackend = items.map((item) => {
        return {
          productoServicioId: item.productoServicio?.id!,
          nombre: item.nombre!,
          tipo: tipo === 'ingreso' ? TipoItemNew.INGRESO : TipoItemNew.EGRESO,
          precio: item.precio!,
          cantidad: item.cantidad!,
          descuento: item.descuento!,
          trabajadorId: item.trabajadorId || item.responsablesIds?.[0] || '',
          subtotal: item.subtotal!,
        } as any;
      });

      // Filter out payment methods with 0 amount and add required fields
      const metodosPagoValidos = metodosPago
        .filter(mp => mp.monto && mp.monto > 0)
        .map(mp => ({
          tipo: mp.tipo!,
          monto: mp.monto!,
          moneda: mp.moneda!,
          montoFinal: mp.monto!, // Same as monto (no discount at payment level)
          descuentoGlobalPorcentaje: 0, // No global discount
          recargoPorcentaje: 0, // No surcharge
        })) as any[];

      // Descuentos ya están aplicados a nivel de item como campo descuento
      const descuentos: any[] = [];

      // Preparar IDs de prepago si las señas están activas
      const prepagoARS = señaActiva && señaMonedas.includes('ARS')
        ? clienteSeleccionado?.prepagosGuardados.find(
          (prepago) =>
            prepago.moneda === MonedaNew.ARS &&
            prepago.estado === EstadoPrepagoNew.ACTIVA
        )?.id
        : null;
      const prepagoUSD = señaActiva && señaMonedas.includes('USD')
        ? clienteSeleccionado?.prepagosGuardados.find(
          (prepago) =>
            prepago.moneda === MonedaNew.USD &&
            prepago.estado === EstadoPrepagoNew.ACTIVA
        )?.id
        : null;

      // Update existing comanda
      const comandaUpdate: ComandaUpdateNew = {
        clienteId: clienteSeleccionado?.id,
        observaciones,
        items: itemsForBackend,
        metodosPago: metodosPagoValidos,
        descuentosAplicados: descuentos,
        usuarioConsumePrepagoARS: señaActiva && señaMonedas.includes('ARS'),
        usuarioConsumePrepagoUSD: señaActiva && señaMonedas.includes('USD'),
        createdAt: fechaCreacion,
        valorDolar: dolar, // Incluir el valor del dólar seleccionado
      };


      // Calculate totals from payment methods at comanda level
      comandaUpdate.precioDolar = metodosPagoValidos
        .filter(mp => mp.moneda === 'USD')
        .reduce((sum, mp) => sum + mp.monto, 0);

      comandaUpdate.precioPesos = metodosPagoValidos
        .filter(mp => mp.moneda === 'ARS')
        .reduce((sum, mp) => sum + mp.monto, 0);

      // Restar señas activas del precio correspondiente según la moneda
      // if (señaActiva && clienteSeleccionado?.señasDisponibles) {
      //   if (señaMonedas.includes('USD') && clienteSeleccionado.señasDisponibles.usd) {
      //     const señaUSD = clienteSeleccionado.señasDisponibles.usd;
      //     comandaUpdate.precioDolar = Math.max(0, comandaUpdate.precioDolar - señaUSD);
      //   }
        
      //   if (señaMonedas.includes('ARS') && clienteSeleccionado.señasDisponibles.ars) {
      //     const señaARS = clienteSeleccionado.señasDisponibles.ars;
      //     comandaUpdate.precioPesos = Math.max(0, comandaUpdate.precioPesos - señaARS);
      //   }
      // }

      // Agregar IDs de prepago si están activos
      if (señaActiva && señaMonedas.includes('ARS')) {
        comandaUpdate.prepagoARSID = prepagoARS ? prepagoARS : comandaState?.prepagoARSID;
      }
      if (señaActiva && señaMonedas.includes('USD')) {
        comandaUpdate.prepagoUSDID = prepagoUSD ? prepagoUSD : comandaState?.prepagoUSDID;
      }

      await actualizarComanda(comandaId, comandaUpdate);
      await obtenerEstadisticasSeñas();
      toast.success('Comanda actualizada con éxito');
      onClose();
      await cargarComandasPaginadas({
        page: 1,
        limit: 20,
        orderBy: 'numero',
        order: 'DESC',
        search: '',
        tipoDeComanda:
          tipo === 'ingreso'
            ? TipoDeComandaNew.INGRESO
            : TipoDeComandaNew.EGRESO,
      });
    } catch (error) {
      logger.error(`Error al actualizar comanda:`, error);
      toast.error('Hubo un error al actualizar la comanda');
      setErrores({
        general: 'Error al actualizar la transacción. Intente nuevamente.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !comandaState) return null;

  // Check if comanda is validated (cannot be edited)
  const esComandaValidada = comandaState.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
  // Una comanda PENDIENTE SÍ se puede editar, una VALIDADA NO se puede editar
  const sePuedeEditar = !esComandaValidada;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] shadow-sm">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </h2>
                <p className="text-sm text-gray-600">
                  Comanda #{comandaState.numero} - {comandaState.estadoDeComanda}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isExchangeRateValid && (
                <div className="to-gray-150 flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 px-3 py-2 shadow-sm">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      USD: {formatDual(dolar, false)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {usarDolarOriginal ? '📅 Original' : '🔄 Actual'}
                    </span>
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-gray-100/50 to-gray-50/30 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Info */}
              <Card className="border border-gray-300 bg-white shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="text-lg text-gray-900">
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Número de comanda (solo lectura) */}
                    <div className="md:col-span-2">
                      <Label className="mb-2 block font-medium text-gray-700">
                        Número de Comanda
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {comandaState.numero}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {comandaState.estadoDeComanda}
                        </Badge>
                      </div>
                    </div>

                    {/* Selector de cliente - Solo para ingresos */}
                    {tipo === 'ingreso' && (
                      <div className="md:col-span-2">
                        <ClienteSelector
                          clienteSeleccionado={clienteSeleccionado}
                          onClienteChange={(cliente) => {
                            setClienteSeleccionado(cliente);
                            if (cliente) {
                              setClienteProveedor(cliente.nombre);
                              setTelefono(cliente.telefono || '');

                              // Verificar si el cliente tiene seña disponible y activarla automáticamente si es apropiado
                              if (cliente.señasDisponibles) {
                                const señaARS = cliente.señasDisponibles.ars || 0;
                                const señaUSD = cliente.señasDisponibles.usd || 0;

                                // Si hay seña disponible, activarla automáticamente
                                if (señaARS > 0 || señaUSD > 0) {
                                  setSeñaActiva(true);

                                  // Seleccionar automáticamente las monedas disponibles
                                  const monedasDisponibles: string[] = [];
                                  if (señaARS > 0) monedasDisponibles.push('ARS');
                                  if (señaUSD > 0) monedasDisponibles.push('USD');
                                  setSeñaMonedas(monedasDisponibles);
                                }
                              }
                            } else {
                              setClienteProveedor('');
                              setTelefono('');
                              setSeñaActiva(false); // Reset seña cuando se deselecciona cliente
                              setSeñaMonedas([]); // Reset monedas de seña
                            }
                          }}
                          required={true}
                          disabled={!sePuedeEditar}
                        />
                        {errores.clienteProveedor && (
                          <p className="mt-1 text-xs text-red-600">
                            {errores.clienteProveedor}
                          </p>
                        )}
                      </div>
                    )}

                    {tipo === 'ingreso' && (
                      <div>
                        <Label className="text-gray-700">Teléfono</Label>
                        <Input
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          placeholder="Teléfono"
                          className="border-gray-300"
                          readOnly={!sePuedeEditar}
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <Label className="text-gray-700">Observaciones</Label>
                      <Textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones adicionales"
                        rows={3}
                        className="border-gray-300"
                        readOnly={!sePuedeEditar}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700">Fecha de Creación</Label>
                      <DatePicker
                        date={fechaCreacion}
                        onDateChange={(date) =>
                          setFechaCreacion(date || new Date())
                        }
                        placeholder="Seleccionar fecha"
                        className="w-full"
                        accentColor="#f9bbc4"
                        disabled={!sePuedeEditar}
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700">Tipo de Cambio USD</Label>
                      <div className="space-y-2">
                        <Select
                          value={usarDolarOriginal ? 'original' : 'actual'}
                          onValueChange={(value) => handleExchangeRateChange(value === 'original')}
                          disabled={!sePuedeEditar}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">
                              <div className="flex flex-col">
                                <span>Original ({comandaState?.valorDolar ? formatDual(comandaState.valorDolar, false) : 'N/A'})</span>
                                <span className="text-xs text-gray-500">Valor al crear la comanda</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="actual">
                              <div className="flex flex-col">
                                <span>Actual ({formatDual(dolarActual, false)})</span>
                                <span className="text-xs text-gray-500">Valor de hoy</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          💡 <strong>Valor seleccionado:</strong> {formatDual(dolar, false)}
                          {!usarDolarOriginal && (
                            <div className="text-xs text-orange-600 mt-1">
                              ⚠️ Los montos USD→ARS se recalcularán automáticamente
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items with Payment Methods */}
              <Card className="border border-gray-300 bg-white shadow-md">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="flex items-center justify-between text-lg text-gray-900">
                    <span>
                      {tipo === 'ingreso'
                        ? 'Servicios y Productos'
                        : 'Conceptos del Egreso'}
                    </span>
                    <div className="flex gap-2">
                      {tipo === 'ingreso' && sePuedeEditar && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMostrarBuscador(true)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Search className="mr-2 h-4 w-4" />
                          Buscar {mostrarBuscador ? '(Abierto)' : ''}
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.length === 0 ? (
                    <div className="to-gray-150 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-100 p-8 text-center shadow-sm">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {tipo === 'ingreso'
                          ? 'No hay servicios agregados'
                          : 'No hay conceptos agregados'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Haga clic en "Buscar" para agregar servicios
                      </p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <ItemFormSimple
                        key={`${item.id}-${item.cantidad}-${item.precio}`}
                        item={item}
                        index={index}
                        onUpdateItem={actualizarItem}
                        onRemoveItem={eliminarItem}
                        tipo={tipo}
                        personal={personal}
                        disabled={!sePuedeEditar}
                      />
                    ))
                  )}

                  {errores.items && (
                    <p className="text-sm text-red-600">{errores.items}</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods Section */}
              {items.length > 0 && (
                <Card className="border border-gray-300 bg-white shadow-md">
                  <CardHeader className="bg-gradient-to-r from-[#f9bbc4]/10 to-[#e8b4c6]/10">
                    <CardTitle className="text-lg text-[#4a3540]">
                      Métodos de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <MetodosPagoComanda
                      metodosPago={metodosPago}
                      onChange={setMetodosPago}
                      disabled={!sePuedeEditar}
                    />
                    {errores.metodosPago && (
                      <p className="mt-2 text-sm text-red-600">{errores.metodosPago}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <TransactionSummaryEdit
                  items={items}
                  tipo={tipo}
                  señaActiva={señaActiva}
                  onSeñaToggle={setSeñaActiva}
                  señaMonedas={señaMonedas}
                  onSeñaMonedasChange={setSeñaMonedas}
                  comandaOriginal={comandaState}
                  clienteActual={clienteSeleccionado}
                  customExchangeRate={usarDolarOriginal ? dolar : undefined}
                />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={guardando || !sePuedeEditar}
                    className="flex-1 bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] font-medium text-white shadow-md hover:from-[#e292a3] hover:to-[#d17a8a] disabled:opacity-50"
                  >
                    {guardando ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Actualizar Comanda
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                </div>

                {!sePuedeEditar && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Esta comanda no puede ser editada porque ya está validada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de búsqueda de productos */}
      {mostrarBuscador && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Buscar Productos/Servicios
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarBuscador(false)}
                className="text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Buscar productos o servicios..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="max-h-96 overflow-y-auto">
                {productosServicios
                  .filter((producto) =>
                    producto.nombre
                      .toLowerCase()
                      .includes(busqueda.toLowerCase())
                  )
                  .map((producto) => (
                    <div
                      key={producto.id}
                      onClick={() => agregarDesdeProducto(producto)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3]">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {producto.nombre}
                          </div>
                          <div className="text-sm text-gray-600">
                            {producto.tipo === 'PRODUCTO' ? 'Producto' : 'Servicio'}
                            {producto.esPrecioCongelado && ' 🔒 Precio fijo'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {producto.esPrecioCongelado && producto.precioFijoARS
                            ? `🔒 ${formatARSFromNative(producto.precioFijoARS)}`
                            : formatAmount(producto.precio)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {producto.esPrecioCongelado && producto.precioFijoARS
                            ? 'ARS fijo'
                            : 'USD dinámico'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 