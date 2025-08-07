'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/services/unidadNegocio.service';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import ClienteSelector from '@/components/comandas/ClienteSelector';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ItemPaymentForm from './ItemPaymentForm';
import TransactionSummary from './TransactionSummary';
import { MONEDAS, METODOS_PAGO } from '@/lib/constants';

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
  const { cargarClientes } = useClientesStore();
  const { handleError } = useErrorHandler();

  const {
    isExchangeRateValid,
    formatARS,
    formatUSD,
    formatDual,
    formatARSFromNative,
  } = useCurrencyConverter();

  const [dolar, setDolar] = useState(0);
  const { lastDolar } = useExchangeRateStore();
  const [comandaState, setComandaState] = useState<ComandaNew | undefined>(
    undefined
  );

  const { getTipoCambio, cargando } = useExchangeRateStore();
  const { user } = useAuth();

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

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
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
      metodosPago: [initialPaymentMethod], // Inicializar con método de pago por defecto
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

  // Form validation
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!clienteProveedor.trim()) {
      nuevosErrores.clienteProveedor = 'El cliente es requerido';
      toast.error('El cliente es requerido');
      return false;
    }

    if (
      items.every((item) => item.responsablesIds?.length === 0) &&
      tipo === 'ingreso'
    ) {
      toast.error('Debe seleccionar un responsable por item', {
        position: 'top-center',
      });
      nuevosErrores.responsable = 'Debe seleccionar un responsable por item';
      return false;
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

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Save transaction
  const handleSave = async () => {
    console.log('guardando COMANDA');
    if (!validarFormulario()) return;
    console.log('validado');
    setGuardando(true);

    try {
      const numeroTransaccion = numeroManual.trim()
        ? '01-' + numeroManual
        : numeroUltimaComanda;

        console.log(items, "nuevaComandaNewItems");
       
      // Convert items with payment methods to the format expected by the backend
      const itemsWithPaymentMethods = items.map((item) => {
        const itemPaymentMethods = (item as any).metodosPago || [];
        
        console.log('=== CONVERTIENDO ITEM ===');
        console.log('Item original:', item);
        console.log('Payment methods encontrados:', itemPaymentMethods);
        
        return {
          productoServicioId: item.productoServicio?.id!,
          nombre: item.nombre!,
          tipo: tipo === 'ingreso' ? TipoItemNew.INGRESO : TipoItemNew.EGRESO,
          precio: item.precio!,
          cantidad: item.cantidad!,
          descuento: item.descuento!,
          trabajadorId: item.responsablesIds?.[0] || '',
          subtotal: item.subtotal!,
          // Include payment method information if available
          metodosPago: itemPaymentMethods
        } as any; // Type assertion to match DTO structure
      });
        
        console.log('=== ITEMS CONVERTIDOS ===');
        console.log('Items originales:', items);
        console.log('Items convertidos:', itemsWithPaymentMethods);
        console.log('Estructura de cada item:');
        itemsWithPaymentMethods.forEach((item, index) => {
          console.log(`Item ${index}:`, {
            productoServicioId: item.productoServicioId,
            nombre: item.nombre,
            tipo: item.tipo,
            precio: item.precio,
            cantidad: item.cantidad,
            descuento: item.descuento,
            trabajadorId: item.trabajadorId,
            subtotal: item.subtotal,
            metodosPago: item.metodosPago
          });
        });
        
        console.log('=== VERIFICACIÓN MÉTODOS DE PAGO ===');
        itemsWithPaymentMethods.forEach((item, index) => {
          console.log(`Item ${index} - Métodos de pago:`, item.metodosPago);
          console.log(`Item ${index} - Cantidad de métodos:`, item.metodosPago?.length || 0);
          
          // Verificar si es split payment
          if (item.metodosPago && item.metodosPago.length > 1) {
            console.log(`Item ${index} - ES SPLIT PAYMENT`);
            console.log(`Item ${index} - Primer método:`, item.metodosPago[0]);
            console.log(`Item ${index} - Segundo método:`, item.metodosPago[1]);
          }
        });

        const nuevaComandaNew: ComandaCreateNew = {
          clienteId: clienteSeleccionado?.id,
          creadoPorId: user?.id,
          numero: numeroTransaccion.toString(),
          tipoDeComanda:
            tipo === 'ingreso'
              ? TipoDeComandaNew.INGRESO
              : TipoDeComandaNew.EGRESO,
          estadoDeComanda: EstadoDeComandaNew.PENDIENTE,
          valorDolar: parseFloat(getTipoCambio().valorVenta.toString()),
          caja: CajaNew.CAJA_1,
          descuentosAplicados: [],
          items: itemsWithPaymentMethods,
        };

        const descuentos = nuevaComandaNew.items?.flatMap(item => {
          const itemWithPayment = item as any;
          const paymentMethods = itemWithPayment.metodosPago || [];
          
          // Si hay split payment (más de un método de pago), crear un solo descuento
          if (paymentMethods.length > 1) {
            // Usar el primer método de pago para obtener el tipo y porcentaje de descuento
            const firstPaymentMethod = paymentMethods[0];
            const subtotal = item.subtotal || 0;
            const descuentoAplicado = firstPaymentMethod.descuentoAplicado || 0;
            const efectivo = item.metodosPago?.some((mp: any) => mp.tipo === METODOS_PAGO.EFECTIVO);
            const transferencia = item.metodosPago?.some((mp: any) => mp.tipo === METODOS_PAGO.TRANSFERENCIA);
            const porcentaje = efectivo ? 10 : transferencia ? 5 : 0;
            
            // Calcular el porcentaje basado en el descuento aplicado
            const discountPercentage = subtotal > 0 ? (descuentoAplicado / subtotal) * 100 : 0;
            const montoFijo = descuentoAplicado; // El monto fijo es el descuento aplicado
            
            return [{
              nombre: NombreDescuentoNew.DESCUENTO_POR_METODO_PAGO,
              descripcion: 'Descuento por método de pago (split payment)',
              porcentaje: porcentaje,
              montoFijo: subtotal * (porcentaje / 100),
            }];
          } else {
            // Para pagos normales (un solo método), mantener la lógica original
            return paymentMethods.map((mp: any) => {
              return {
                nombre: NombreDescuentoNew.DESCUENTO_POR_METODO_PAGO,
                descripcion: 'Descuento por método de pago',
                porcentaje: mp.descuentoGlobalPorcentaje || 0,
                montoFijo: 0,
              };
            });
          }
        }) || [];

        nuevaComandaNew.descuentosAplicados = descuentos;
        
        // Calculate totals from payment methods in items
        nuevaComandaNew.precioDolar = nuevaComandaNew.items?.reduce((sum, item) => {
          const itemWithPayment = item as any;
          return sum + (itemWithPayment.metodosPago || []).reduce((itemSum: number, mp: any) => {
            return itemSum + (mp.moneda === MonedaNew.USD ? mp.montoFinal || 0 : 0);
          }, 0);
        }, 0) || 0;
        
        nuevaComandaNew.precioPesos = nuevaComandaNew.items?.reduce((sum, item) => {
          const itemWithPayment = item as any;
          return sum + (itemWithPayment.metodosPago || []).reduce((itemSum: number, mp: any) => {
            return itemSum + (mp.moneda === MonedaNew.ARS ? mp.montoFinal || 0 : 0);
          }, 0);
        }, 0) || 0;

        nuevaComandaNew.items?.forEach((item, index) => {
          console.log(`Item ${index}:`, {
            productoServicioId: item.productoServicioId,
            nombre: item.nombre,
            tipo: item.tipo,
            precio: item.precio,
            cantidad: item.cantidad,
            descuento: item.descuento,
            trabajadorId: item.trabajadorId,
            subtotal: item.subtotal,
            metodosPago: (item as any).metodosPago
          });
        });

      if (!comandaId) {
        const existe = await existeComanda(numeroTransaccion.toString());
        if (existe) {
          toast.error('El número de comanda ya existe');
          return;
        }
      }

      console.log(nuevaComandaNew, "nuevaComandaNew");

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
    setNumeroManual('');
    setNumeroUltimaComanda('');
    setGuardando(false);
    setErrores({});
    setMostrarBuscador(false);
    setBusqueda('');
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
                            } else {
                              setClienteProveedor('');
                              setTelefono('');
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
                      <ItemPaymentForm
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
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <TransactionSummary
                  items={items}
                  tipo={tipo}
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