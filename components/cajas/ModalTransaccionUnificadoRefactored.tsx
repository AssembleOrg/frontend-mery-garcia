'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
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
  ComandaCreateNew,
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
  EstadoPrepagoNew,
} from '@/services/unidadNegocio.service';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import ClienteSelector from '@/components/comandas/ClienteSelector';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ItemFormSimple from './ItemFormSimple';
import TransactionSummary from './TransactionSummary';
import MetodosPagoComanda from './MetodosPagoComanda';
import { MONEDAS, METODOS_PAGO } from '@/lib/constants';
import { useConfiguracion } from '@/features/configuracion/store/configuracionStore';
import { MetodoPagoNew } from '@/services/unidadNegocio.service';

/**
 * ModalTransaccionUnificadoRefactored Component
 *
 * This is the refactored version of the transaction modal that implements the new
 * payment method system where each product/service is associated with a specific
 * payment method. The component is broken down into smaller, more manageable pieces
 * for better maintainability and readability.
 *
 * Key Features:
 * - Each item has its own payment method configuration
 * - Non-editable item inputs (only total amount can be modified)
 * - Currency restrictions based on frozen pricing
 * - Simplified summary showing only subtotal and total
 * - Support for multiple currencies in a single transaction
 *
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback to close the modal
 * @param tipo - Transaction type ('ingreso' or 'egreso')
 * @param comandaId - Optional comanda ID for editing
 */
interface ModalTransaccionUnificadoRefactoredProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'ingreso' | 'egreso';
  comandaId?: string;
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

export default function ModalTransaccionUnificadoRefactored({
  isOpen,
  onClose,
  tipo,
  comandaId,
}: ModalTransaccionUnificadoRefactoredProps) {
  // Store hooks
  const {
    agregarComanda,
    cargarComandasPaginadas,
    getUltimaComanda,
    existeComanda,
    obtenerComandaPorId,
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
  const { lastDolar } = useExchangeRateStore();
  const [comandaState, setComandaState] = useState<ComandaNew | undefined>(
    undefined
  );

  const { getTipoCambio, cargando } = useExchangeRateStore();
  const { user } = useAuth();
  const { descuentosPorMetodo } = useConfiguracion();

  useInitializeComandaStore();

  // Global state for discounts toggle
  const [descuentosActivos, setDescuentosActivos] = useState(true);

  // Modal state
  const [isModalBusquedaOpen, setIsModalBusquedaOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Form state
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
  const [errores, setErrores] = useState<{ [key: string]: string }>({});
  const [fechaCreacion, setFechaCreacion] = useState<Date>(new Date()); // Default to today

  // Client state
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteNew | null>(null);
  const [clienteProveedor, setClienteProveedor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [responsablesIds, setResponsablesIds] = useState<string[]>([]);

  // Seña state - now global for entire transaction
  const [señaActiva, setSeñaActiva] = useState(false);
  const [señaMonedas, setSeñaMonedas] = useState<string[]>([]); // Array of selected currencies for seña

  // Payment methods state - at comanda level
  const [metodosPago, setMetodosPago] = useState<Partial<MetodoPagoNew>[]>([
    { tipo: TipoPagoNew.EFECTIVO, monto: 0, moneda: MonedaNew.ARS }
  ]);

  // UI state
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [numeroManual, setNumeroManual] = useState('');
  const [numeroUltimaComanda, setNumeroUltimaComanda] = useState('');

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

  useEffect(() => {
    cargarComandasPaginadas({
      page: 1,
      limit: 20,
      orderBy: 'numero',
      order: 'DESC',
      search: '',
      tipoDeComanda:
        tipo === 'ingreso' ? TipoDeComandaNew.INGRESO : TipoDeComandaNew.EGRESO,
    });

    lastDolar()
      .then((dolarR) => {
        if (dolar === 0) {
          setDolar(dolarR.venta);
        }
      })
      .catch((error) => {
        toast.error('Error al obtener el último dólar');
      });
  }, []);

  const validarNumeroManual = (numero: string): boolean => {
    if (!numero.trim()) return false;

    // Validar que sea solo números
    if (!/^\d+$/.test(numero)) return false;

    // Generar el número completo con prefijo
    const prefijo = tipo === 'ingreso' ? '01' : '02';
    const numeroCompleto = `${prefijo}-${numero.padStart(4, '0')}`;

    // Verificar que no exista ya
    return true;
  };

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

  const siguienteNumeroComanda = (actual: string): string => {
    const [prefijo, correlativo] = actual.split('-');

    // Asegura número; si no es válido devuelve 0
    const siguiente = (parseInt(correlativo, 10) || 0) + 1;

    // Mantén la longitud original con ceros a la izquierda
    const nuevoCorrelativo = String(siguiente).padStart(
      correlativo.length,
      '0'
    );

    return `${prefijo}-${nuevoCorrelativo}`;
  };

  useEffect(() => {
    const dolar = getTipoCambio().valorVenta;
    if (isOpen) {
      getUltimaComanda().then((comanda) => {
        if (comanda) {
          setNumeroUltimaComanda(siguienteNumeroComanda(comanda.numero));
        } else {
          setNumeroUltimaComanda('01-0001');
        }
      });
    }
  }, [isOpen]);

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

  // Debug useEffect para el modal de búsqueda
  useEffect(() => {
    if (mostrarBuscador) {
    }
  }, [mostrarBuscador, productosServicios.length]);

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
    const defaultCurrency = producto.esPrecioCongelado
      ? MONEDAS.ARS
      : MONEDAS.USD;
    const defaultAmount = subtotalBase;

    // Calcular el descuento inicial si los descuentos están activos
    const discountAmount = descuentosActivos
      ? Math.round(
          (defaultAmount *
            (descuentosPorMetodo[METODOS_PAGO.EFECTIVO as keyof typeof descuentosPorMetodo] || 0)) /
            100
        )
      : 0;
    
    const finalAmount = defaultAmount - discountAmount;

    // Crear método de pago inicial con EFECTIVO y descuento aplicado
    const initialPaymentMethod = {
      tipo: METODOS_PAGO.EFECTIVO as TipoPagoNew,
      moneda: defaultCurrency as MonedaNew,
      monto: defaultAmount, // Subtotal original
      montoFinal: finalAmount, // Total con descuento aplicado
      descuentoAplicado: discountAmount,
      descuentoGlobalPorcentaje: discountAmount > 0 
        ? Math.round((discountAmount / defaultAmount) * 100) 
        : 0,
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
  const actualizarItem = (id: string, updates: any) => {
    const itemToUpdate = items.find((item) => item.id === id);

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

    // Validar numeración manual (siempre activa)
    if (numeroManual.trim()) {
      if (!/^\d+$/.test(numeroManual)) {
        nuevosErrores.numeroManual = 'Solo se permiten números';
      } else if (!validarNumeroManual(numeroManual)) {
        const prefijo = tipo === 'ingreso' ? '01' : '02';
        const numeroCompleto = `${prefijo}-${numeroManual.padStart(4, '0')}`;
        nuevosErrores.numeroManual = `El número ${numeroCompleto} ya existe`;
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
      const numeroTransaccion = numeroManual.trim()
        ? '01-' + numeroManual
        : numeroUltimaComanda;

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

      const prepagoARS =
        señaActiva && señaMonedas.includes('ARS')
          ? clienteSeleccionado?.prepagosGuardados.find(
              (prepago) =>
                prepago.moneda === MonedaNew.ARS &&
                prepago.estado === EstadoPrepagoNew.ACTIVA
            )?.id
          : null;
      const prepagoUSD =
        señaActiva && señaMonedas.includes('USD')
          ? clienteSeleccionado?.prepagosGuardados.find(
              (prepago) =>
                prepago.moneda === MonedaNew.USD &&
                prepago.estado === EstadoPrepagoNew.ACTIVA
            )?.id
          : null;
      const nuevaComandaNew: ComandaCreateNew = {
        clienteId: clienteSeleccionado?.id,
        creadoPorId: user?.id,
        numero: numeroTransaccion.toString(),
        observaciones,
        tipoDeComanda:
          tipo === 'ingreso'
            ? TipoDeComandaNew.INGRESO
            : TipoDeComandaNew.EGRESO,
        estadoDeComanda: EstadoDeComandaNew.PENDIENTE,
        valorDolar: parseFloat(getTipoCambio().valorVenta.toString()),
        caja: CajaNew.CAJA_1,
        descuentosAplicados: [],
        items: itemsForBackend,
        metodosPago: metodosPagoValidos,
        usuarioConsumePrepagoARS: señaActiva && señaMonedas.includes('ARS'),
        usuarioConsumePrepagoUSD: señaActiva && señaMonedas.includes('USD'),
        createdAt: fechaCreacion,
      };

      if (señaActiva && señaMonedas.includes('ARS')) {
        nuevaComandaNew.prepagoARSID = prepagoARS?.toString() || '';
      }
      if (señaActiva && señaMonedas.includes('USD')) {
        nuevaComandaNew.prepagoUSDID = prepagoUSD?.toString() || '';
      }

      // Descuentos ya están aplicados a nivel de item como campo descuento
      nuevaComandaNew.descuentosAplicados = [];

      // Calculate totals from payment methods at comanda level
      // precioDolar and precioPesos should be the sum of all payment methods by currency
      // The seña consumption is tracked separately via usuarioConsumePrepagoARS/USD
      nuevaComandaNew.precioDolar = metodosPagoValidos
        .filter(mp => mp.moneda === 'USD')
        .reduce((sum, mp) => sum + mp.monto, 0);

      nuevaComandaNew.precioPesos = metodosPagoValidos
        .filter(mp => mp.moneda === 'ARS')
        .reduce((sum, mp) => sum + mp.monto, 0);

      if (!comandaId) {
        const existe = await existeComanda(numeroTransaccion.toString());
        if (existe) {
          toast.error('El número de comanda ya existe');
          return;
        }
      }

      await agregarComanda(nuevaComandaNew);
      resetForm();
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
      await obtenerEstadisticasSeñas();
      toast.success('Comanda creada/actualizada con éxito');
    } catch (error) {
      logger.error(`Error al guardar ${tipo}:`, error);
      toast.error('Hubo un error al crear/actualizar la comanda');
      setErrores({
        general: 'Error al guardar la transacción. Intente nuevamente.',
      });
    } finally {
      setGuardando(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setClienteSeleccionado(null);
    setClienteProveedor('');
    setTelefono('');
    setResponsableId('');
    setResponsablesIds([]);
    setObservaciones('');
    setItems([]);
    setMetodosPago([{ tipo: TipoPagoNew.EFECTIVO, monto: 0, moneda: MonedaNew.ARS }]);
    setNumeroManual('');
    setNumeroUltimaComanda('');
    setGuardando(false);
    setErrores({});
    setMostrarBuscador(false);
    setBusqueda('');
    setSeñaActiva(false); // Reset seña state
    setSeñaMonedas([]); // Reset seña currencies
    setFechaCreacion(new Date()); // Reset to today
  };

  useEffect(() => {
    const cargarComanda = async () => {
      if (comandaId && isOpen) {
        try {
          const comanda = await obtenerComandaPorId(comandaId);
          setComandaState(comanda);

          // Cargar todos los datos de la comanda
          setClienteSeleccionado(comanda.cliente || null);
          setClienteProveedor(comanda.cliente?.nombre || '');
          setTelefono(comanda.cliente?.telefono || '');
          setObservaciones(comanda.observaciones || '');
          setNumeroManual(comanda.numero?.split('-')[1] || '');

          // Set creation date if available, otherwise use today
          if (comanda.createdAt) {
            setFechaCreacion(new Date(comanda.createdAt));
          } else {
            setFechaCreacion(new Date());
          }

          // Convertir items al formato correcto
          const itemsConvertidos =
            comanda.items?.map((item) => {
              return {
                id: item.id || `temp-${Date.now()}`,
                productoServicioId: item.productoServicioId || '',
                nombre: item.nombre || '',
                precio: item.precio || 0,
                cantidad: item.cantidad || 1,
                descuentoPorcentaje: 0,
                descuento: item.descuento || 0,
                subtotal: item.subtotal || 0,
                responsablesIds: item.trabajador ? [item.trabajador.id] : [],
                mostrarSelectorResponsables: false,
                productoServicio: item.productoServicio,
              };
            }) || [];
          setItems(itemsConvertidos);
        } catch (error) {
          console.error('Error al cargar comanda:', error);
          toast.error('Error al cargar la comanda');
        }
      }
    };

    cargarComanda();
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Handle global discounts toggle (DEPRECATED - discounts now at item level)
  const handleGlobalDescuentosToggle = (enabled: boolean) => {
    setDescuentosActivos(enabled);
    // Note: Discounts are now managed at item level via descuento field
    // No need to update payment methods as they are at comanda level
  };

  // DEPRECATED: Old implementation that used payment methods per item
  const handleGlobalDescuentosToggle_OLD = (enabled: boolean) => {
    setDescuentosActivos(enabled);

    // Update all items to reflect the new discount settings
    items.forEach((item) => {
      const currentPaymentMethod = (item as any).metodosPago?.[0];
      if (currentPaymentMethod) {
        const isSplitEnabled = (item as any).metodosPago && (item as any).metodosPago.length > 1;

        if (isSplitEnabled) {
          // For split payment, recalculate both payments considering the discount
          const itemSubtotal = (item.precio || 0) * (item.cantidad || 1);
          
          // Calculate the discounted total
          const discountAmount = enabled
            ? Math.round(
                (itemSubtotal *
                  (descuentosPorMetodo[
                    currentPaymentMethod.tipo as keyof typeof descuentosPorMetodo
                  ] || 0)) /
                  100
              )
            : 0;
          
          const discountedTotal = itemSubtotal - discountAmount;
          
          // Split the discounted total
          const firstAmount = Math.round(discountedTotal / 2);
          const secondAmount = discountedTotal - firstAmount;

          // Preserve the original discount information
          const firstMethod = {
            ...currentPaymentMethod,
            monto: firstAmount,
            montoFinal: firstAmount,
            descuentoAplicado: discountAmount, // Preserve discount amount
            descuentoGlobalPorcentaje: discountAmount > 0 
              ? Math.round((discountAmount / itemSubtotal) * 100) 
              : 0, // Preserve discount percentage
            moneda: MONEDAS.USD as MonedaNew,
          };

          const secondMethod = {
            ...currentPaymentMethod,
            monto: secondAmount,
            montoFinal: secondAmount,
            descuentoAplicado: discountAmount, // Preserve discount amount
            descuentoGlobalPorcentaje: discountAmount > 0 
              ? Math.round((discountAmount / itemSubtotal) * 100) 
              : 0, // Preserve discount percentage
            moneda: MONEDAS.ARS as MonedaNew,
          };

          actualizarItem(item.id!, {
            metodosPago: [firstMethod, secondMethod],
          });
        } else {
          // For single payment, recalculate with new discount settings
          const itemTotal = (item.precio || 0) * (item.cantidad || 1);
          const discountAmount = enabled
            ? Math.round(
                (itemTotal *
                  (descuentosPorMetodo[
                    currentPaymentMethod.tipo as keyof typeof descuentosPorMetodo
                  ] || 0)) /
                  100
              )
            : 0;

          const updatedPaymentMethod = {
            ...currentPaymentMethod,
            monto: itemTotal,
            montoFinal: itemTotal - discountAmount,
            descuentoAplicado: discountAmount,
            descuentoGlobalPorcentaje:
              discountAmount > 0
                ? Math.round((discountAmount / itemTotal) * 100)
                : 0,
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
                {tipo === 'ingreso' ? (
                  <ArrowUpCircle className="h-5 w-5 text-white" />
                ) : (
                  <ArrowDownCircle className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {tipo === 'ingreso' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
                </h2>
                <p className="text-sm text-gray-600">
                  {tipo === 'ingreso'
                    ? 'Registrar venta de servicio o producto'
                    : 'Registrar gasto o salida de dinero'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isExchangeRateValid && (
                <div className="to-gray-150 flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 px-3 py-2 shadow-sm">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    USD: {formatDual(dolar, false)}
                  </span>
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
                    {/* Campo de numeración manual (siempre visible) */}
                    <div className="md:col-span-2">
                      <div className="mb-4">
                        <Label className="mb-2 block font-medium text-gray-700">
                          Numeración Manual
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Automático: {numeroUltimaComanda}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-2">
                            <Hash className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {tipo === 'ingreso' ? '01' : '02'}-
                            </span>
                          </div>
                          <Input
                            value={numeroManual}
                            onChange={(e) => {
                              const valor = e.target.value.replace(/\D/g, '');
                              setNumeroManual(valor);
                              if (errores.numeroManual) {
                                setErrores((prev) => {
                                  return prev;
                                });
                              }
                            }}
                            placeholder="0001"
                            maxLength={4}
                            className={`text-center ${
                              errores.numeroManual
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          {numeroManual && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Número completo:
                              </span>
                              <Badge
                                variant={
                                  validarNumeroManual(numeroManual)
                                    ? 'default'
                                    : 'destructive'
                                }
                                className="text-xs"
                              >
                                {tipo === 'ingreso' ? '01' : '02'}-
                                {numeroManual.padStart(4, '0')}
                              </Badge>
                            </div>
                          )}
                          {errores.numeroManual && (
                            <p className="mt-1 text-xs text-red-600">
                              {errores.numeroManual}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

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
                                const señaARS =
                                  cliente.señasDisponibles.ars || 0;
                                const señaUSD =
                                  cliente.señasDisponibles.usd || 0;

                                // Si hay seña disponible, activarla automáticamente
                                if (señaARS > 0 || señaUSD > 0) {
                                  setSeñaActiva(true);

                                  // Seleccionar automáticamente las monedas disponibles
                                  const monedasDisponibles: string[] = [];
                                  if (señaARS > 0)
                                    monedasDisponibles.push('ARS');
                                  if (señaUSD > 0)
                                    monedasDisponibles.push('USD');
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
                      />
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
                      {tipo === 'ingreso' && (
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
                      onChange={(metodos) => setMetodosPago(metodos)}
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
                <TransactionSummary
                  items={items}
                  tipo={tipo}
                  descuentosActivos={descuentosActivos}
                  señaActiva={señaActiva}
                  onSeñaToggle={setSeñaActiva}
                  cliente={clienteSeleccionado}
                  señaMonedas={señaMonedas}
                  onSeñaMonedasChange={setSeñaMonedas}
                />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={guardando}
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
                        Guardar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
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
                            {producto.tipo === 'PRODUCTO'
                              ? 'Producto'
                              : 'Servicio'}
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
