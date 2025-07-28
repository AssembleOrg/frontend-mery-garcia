'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MetodosPagoSection from './MetodosPagoSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Save,
  X,
  TrendingUp,
  Calculator,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Hash,
  Scissors,
  Edit,
  GraduationCap,
  Package,
  User,
  DollarSign,
  Lock,
} from 'lucide-react';
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { useActivityStore } from '@/features/activity/store/activityStore';
import { MONEDAS } from '@/lib/constants';
import { usePersonal } from '@/features/personal/hooks/usePersonal';
import { useProductosServicios } from '@/features/productos-servicios/hooks/useProductosServicios';
import { useCliente } from '@/features/clientes/hooks/useCliente';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import {
  Comanda,
  ItemComanda,
  UnidadNegocio,
  ProductoServicio,
  Cliente,
} from '@/types/caja';
import {
  useInitializeComandaStore,
  generateUniqueId,
} from '@/hooks/useInitializeComandaStore';
import { DiscountControls } from './DiscountControls';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';
import { useMetodosPago } from '@/hooks/useMetodosPago';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ModalTransaccionUnificadoProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'ingreso' | 'egreso';
}

interface ItemTransaccion {
  id: string;
  productoServicioId: string;
  nombre: string;
  businessUnit: UnidadNegocio;
  precio: number;
  cantidad: number;
  descuentoPorcentaje: number;
  descuento: number;
  subtotal: number;
  descripcion?: string;
  // Campos para precios congelados (ingresos)
  esPrecioCongelado?: boolean;
  precioFijoARS?: number;
  // Campo para egresos con monto fijo en ARS
  esMontoFijoARS?: boolean;
}

export default function ModalTransaccionUnificado({
  isOpen,
  onClose,
  tipo,
}: ModalTransaccionUnificadoProps) {
  const { agregarComanda, obtenerProximoNumero, comandas, cargando } =
    useComandaStore();

  const { productosServicios } = useProductosServicios();
  const { personal } = usePersonal();
  const { clientes, buscarCliente, obtenerSeñasDisponibles, usarSeña } =
    useCliente();

  const {
    exchangeRate,
    isExchangeRateValid,
    formatARS,
    formatUSD,
    formatDual,
    formatARSFromNative,
    arsToUsd,
  } = useCurrencyConverter();

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

  const formatProductAmount = (producto: ProductoServicio) => {
    if (producto.esPrecioCongelado && producto.precioFijoARS) {
      return `🔒 ${formatARSFromNative(producto.precioFijoARS)}`;
    }
    return formatAmount(producto.precio);
  };

  const formatItemAmount = (item: ItemTransaccion) => {
    // Items con precio congelado (ingresos)
    if (item.esPrecioCongelado && item.precioFijoARS) {
      // Para items congelados: mostrar ARS fijo - descuentos (ambos en ARS)
      const totalARS = item.precioFijoARS * item.cantidad - item.descuento;
      return `🔒 ${formatARSFromNative(totalARS)}`;
    }
    // Items con monto fijo ARS (egresos)
    if (item.esMontoFijoARS && tipo === 'egreso') {
      // Para egresos con monto fijo ARS: mostrar precio en ARS nativo
      const totalARS = item.precio * item.cantidad - item.descuento;
      return `🔒 ${formatARSFromNative(totalARS)}`;
    }
    // Para items normales: usar lógica actual
    return formatAmount(item.subtotal);
  };

  const { tipoCambio } = useExchangeRate();
  const { user } = useAuth();
  const { logActivity } = useActivityStore();

  const obtenerIconoUnidad = (unidad: UnidadNegocio) => {
    switch (unidad) {
      case 'estilismo':
        return <Scissors className="h-4 w-4 text-[#8b5a6b]" />;
      case 'tattoo':
        return <Edit className="h-4 w-4 text-[#8b5a6b]" />;
      case 'formacion':
        return <GraduationCap className="h-4 w-4 text-[#8b5a6b]" />;
      default:
        return <Package className="h-4 w-4 text-[#8b5a6b]" />;
    }
  };

  useInitializeComandaStore();

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [clienteProveedor, setClienteProveedor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [montoSeñaAplicada, setMontoSeñaAplicada] = useState(0);
  const [monedaSeñaAplicada, setMonedaSeñaAplicada] = useState<
    'ars' | 'usd' | null
  >(null);
  const [mostrarSelectorCliente, setMostrarSelectorCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [unidadNegocio, setUnidadNegocio] =
    useState<UnidadNegocio>('estilismo');
  const [responsableId, setResponsableId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemTransaccion[]>([]);
  // Removemos el estado local de metodosPago ya que ahora usamos el hook
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(0);

  // Detectar si hay items con precio congelado en ARS (ingresos) o monto fijo ARS (egresos)
  const hayItemsCongelados = useMemo(() => {
    if (tipo === 'ingreso') {
      return items.some((item) => item.esPrecioCongelado);
    } else {
      // Para egresos: detectar items con monto fijo en ARS
      return items.some((item) => item.esMontoFijoARS);
    }
  }, [items, tipo]);

  const {
    metodosPago,
    agregarMetodoPago: agregarMetodoPagoBase,
    eliminarMetodoPago,
    actualizarMetodoPago,
    resetMetodosPago,
    validarMetodosPago,
    convertirParaPersistencia,
    obtenerResumenDual,
  } = useMetodosPago(tipo === 'ingreso', hayItemsCongelados); // Solo aplicar descuentos en ingresos

  // Wrapper para forzar ARS cuando hay items congelados
  const agregarMetodoPago = () => {
    agregarMetodoPagoBase();
    if (hayItemsCongelados && metodosPago.length >= 0) {
      // Forzar moneda ARS en el nuevo método de pago
      const ultimoIndex = metodosPago.length;
      setTimeout(() => {
        actualizarMetodoPago(ultimoIndex, 'moneda', MONEDAS.ARS);
      }, 0);
    }
  };

  // Auto-switch payment methods to ARS when frozen items are detected
  useEffect(() => {
    if (hayItemsCongelados && metodosPago.length > 0) {
      // Convert all USD payment methods to ARS
      metodosPago.forEach((metodo, index) => {
        if (metodo.moneda === MONEDAS.USD) {
          actualizarMetodoPago(index, 'moneda', MONEDAS.ARS);
        }
      });
    }
  }, [hayItemsCongelados]);

  const [numeroManual, setNumeroManual] = useState('');

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useModalScrollLock(isOpen);

  const validarNumeroManual = (numero: string): boolean => {
    if (!numero.trim()) return false;

    // Validar que sea solo números
    if (!/^\d+$/.test(numero)) return false;

    // Generar el número completo con prefijo
    const prefijo = tipo === 'ingreso' ? '01' : '02';
    const numeroCompleto = `${prefijo}-${numero.padStart(4, '0')}`;

    // Verificar que no exista ya
    const existe = comandas.some((c) => c.numero === numeroCompleto);
    return !existe;
  };

  const generarNumeroComanda = (): string => {
    if (numeroManual.trim()) {
      const prefijo = tipo === 'ingreso' ? '01' : '02';
      return `${prefijo}-${numeroManual.padStart(4, '0')}`;
    }
    return obtenerProximoNumero(tipo);
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

  // Filtrar clientes para el selector
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return clientes;
    return buscarCliente(busquedaCliente);
  }, [busquedaCliente, clientes, buscarCliente]);

  // Manejar selección de cliente
  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setClienteProveedor(cliente.nombre);
    setTelefono(cliente.telefono || '');
    setMostrarSelectorCliente(false);
    setBusquedaCliente('');
    // Resetear seña al cambiar de cliente
    setMontoSeñaAplicada(0);
    setMonedaSeñaAplicada(null);
  };

  // Manejar aplicación de seña
  const handleAplicarSeña = (moneda: 'ars' | 'usd') => {
    if (clienteSeleccionado) {
      const señas = obtenerSeñasDisponibles(clienteSeleccionado.id);
      const montoSeña = señas[moneda];

      if (montoSeña > 0) {
        setMontoSeñaAplicada(montoSeña);
        setMonedaSeñaAplicada(moneda);
      } else {
        logger.info(
          `El cliente no tiene señas disponibles en ${moneda.toUpperCase()}.`
        );
      }
    }
  };

  const handleQuitarSeña = () => {
    setMontoSeñaAplicada(0);
    setMonedaSeñaAplicada(null);
  };

  const productosServiciosFiltrados = useMemo(() => {
    if (tipo === 'egreso') {
      return productosServicios.filter((p: ProductoServicio) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Para ingresos, agrupar por unidad de negocio
    const productosPorUnidad = productosServicios.reduce(
      (acc, producto) => {
        if (
          producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
          producto.activo
        ) {
          if (!acc[producto.businessUnit]) {
            acc[producto.businessUnit] = [];
          }
          acc[producto.businessUnit].push(producto);
        }
        return acc;
      },
      {} as Record<UnidadNegocio, ProductoServicio[]>
    );

    return productosPorUnidad;
  }, [productosServicios, busqueda, tipo]);

  const agregarItem = () => {
    const nuevoItem: ItemTransaccion = {
      id: `temp-${Date.now()}`,
      productoServicioId: '',
      nombre: '',
      businessUnit: tipo === 'ingreso' ? unidadNegocio : 'estilismo',
      precio: 0,
      cantidad: 1,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: 0,
      descripcion: '',
    };
    setItems([...items, nuevoItem]);
  };

  const agregarDesdeProducto = (producto: ProductoServicio) => {
    // Para productos congelados: NO convertir, usar precio ARS como base
    // Para productos normales: mantener lógica USD actual
    let precioBase = producto.precio;
    let subtotalBase = producto.precio;

    if (producto.esPrecioCongelado && producto.precioFijoARS) {
      // Items congelados: usar ARS fijo, sin conversiones
      precioBase = producto.precioFijoARS;
      subtotalBase = producto.precioFijoARS;
    }

    const nuevoItem: ItemTransaccion = {
      id: `temp-${Date.now()}`,
      productoServicioId: producto.id,
      nombre: producto.nombre,
      businessUnit: producto.businessUnit,
      precio: precioBase,
      cantidad: 1,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: subtotalBase,
      descripcion: producto.descripcion || '',
      // Propagar campos de precio congelado
      esPrecioCongelado: producto.esPrecioCongelado,
      precioFijoARS: producto.precioFijoARS,
    };
    setItems([...items, nuevoItem]);
    setMostrarBuscador(false);
    setBusqueda('');
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Update item
  const actualizarItem = (
    id: string,
    campo: keyof ItemTransaccion,
    valor: string | number | boolean
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [campo]: valor };

          // Recalcular subtotal y descuento
          if (
            campo === 'cantidad' ||
            campo === 'precio' ||
            campo === 'descuentoPorcentaje' ||
            campo === 'esMontoFijoARS'
          ) {
            let precioBase;

            // Para items congelados (ingresos): trabajar solo en ARS, sin conversiones
            if (updatedItem.esPrecioCongelado && updatedItem.precioFijoARS) {
              // Items congelados: usar ARS nativo multiplicado por cantidad
              precioBase = updatedItem.precioFijoARS * updatedItem.cantidad;
            } 
            // Para items con monto fijo ARS (egresos): trabajar en ARS nativo
            else if (updatedItem.esMontoFijoARS && tipo === 'egreso') {
              // Items egresos ARS: usar precio como ARS nativo
              precioBase = updatedItem.precio * updatedItem.cantidad;
            } 
            else {
              // Para items normales: usar el cálculo dinámico USD
              precioBase = updatedItem.precio * updatedItem.cantidad;
            }

            const porcentaje = Math.max(
              0,
              Math.min(100, updatedItem.descuentoPorcentaje)
            );
            const descuentoCalculado = (precioBase * porcentaje) / 100;

            updatedItem.descuentoPorcentaje = porcentaje;
            updatedItem.descuento = descuentoCalculado;
            updatedItem.subtotal = precioBase - descuentoCalculado;
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Aplicar descuento a un ítem específico
  const aplicarDescuentoItem = (id: string, porcentaje: number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const precioBase = item.precio * item.cantidad;
          const descuentoCalculado = (precioBase * porcentaje) / 100;

          return {
            ...item,
            descuentoPorcentaje: porcentaje,
            descuento: descuentoCalculado,
            subtotal: precioBase - descuentoCalculado,
          };
        }
        return item;
      })
    );
  };

  // Eliminar descuento de un ítem específico
  const eliminarDescuentoItem = (id: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const precioBase = item.precio * item.cantidad;

          return {
            ...item,
            descuentoPorcentaje: 0,
            descuento: 0,
            subtotal: precioBase,
          };
        }
        return item;
      })
    );
  };

  // Aplicar descuento global
  const aplicarDescuentoGlobal = (porcentaje: number) => {
    if (porcentaje <= 0 || items.length === 0) return;

    const itemsConDescuento = items.map((item) => {
      const precioBase = item.precio * item.cantidad;
      const descuentoCalculado = (precioBase * porcentaje) / 100;

      return {
        ...item,
        descuentoPorcentaje: porcentaje,
        descuento: descuentoCalculado,
        subtotal: precioBase - descuentoCalculado,
      };
    });

    setItems(itemsConDescuento);
    setDescuentoGlobalPorcentaje(0);
  };

  const limpiarDescuentos = () => {
    const itemsSinDescuento = items.map((item) => {
      let subtotal;

      if (item.esPrecioCongelado && item.precioFijoARS) {
        // Para items congelados (ingresos): usar ARS nativo, sin conversiones
        subtotal = item.precioFijoARS * item.cantidad;
      } else if (item.esMontoFijoARS && tipo === 'egreso') {
        // Para items egresos con monto fijo ARS: usar precio como ARS nativo
        subtotal = item.precio * item.cantidad;
      } else {
        // Para items normales: usar precio USD
        subtotal = item.precio * item.cantidad;
      }

      return {
        ...item,
        descuentoPorcentaje: 0,
        descuento: 0,
        subtotal,
      };
    });
    setItems(itemsSinDescuento);
    setDescuentoGlobalPorcentaje(0);
  };

  // Función para calcular total ARS respetando items congelados/monto fijo
  const calcularTotalARS = () => {
    if (tipo === 'ingreso') {
      // Lógica original para ingresos con items congelados
      const itemsCongelados = items.filter(
        (item) => item.esPrecioCongelado && item.precioFijoARS
      );

      if (itemsCongelados.length > 0) {
        // Solo calcular total de items congelados
        return itemsCongelados.reduce((sum, item) => {
          const subtotalARS = item.precioFijoARS! * item.cantidad;
          return sum + subtotalARS - item.descuento;
        }, 0);
      } else {
        // Si no hay items congelados, usar conversión normal
        return items.reduce((sum, item) => {
          const subtotalUSD = item.precio * item.cantidad - item.descuento;
          return sum + subtotalUSD * tipoCambio.valorVenta;
        }, 0);
      }
    } else {
      // Lógica para egresos con items de monto fijo ARS
      const itemsARSFijo = items.filter((item) => item.esMontoFijoARS);

      if (itemsARSFijo.length > 0) {
        // Calcular total solo de items con monto fijo en ARS
        return itemsARSFijo.reduce((sum, item) => {
          const subtotalARS = item.precio * item.cantidad;
          return sum + subtotalARS - item.descuento;
        }, 0);
      } else {
        // Si no hay items ARS fijo, usar conversión normal
        return items.reduce((sum, item) => {
          const subtotalUSD = item.precio * item.cantidad - item.descuento;
          return sum + subtotalUSD * tipoCambio.valorVenta;
        }, 0);
      }
    }
  };

  // Función específica para egresos con monto fijo ARS - NO convierte a USD
  const calcularTotalesARS = () => {
    if (tipo === 'egreso' && hayItemsCongelados) {
      // Para egresos con items ARS fijo: trabajar en ARS nativo
      const subtotalBaseARS = items.reduce((sum, item) => {
        if (item.esMontoFijoARS) {
          // Items ARS fijo: usar valor nativo sin conversión
          return sum + item.precio * item.cantidad;
        } else {
          // Items normales: convertir USD a ARS para consistencia
          return sum + (item.precio * item.cantidad) * tipoCambio.valorVenta;
        }
      }, 0);

      const totalDescuentosARS = items.reduce((sum, item) => {
        if (item.esMontoFijoARS) {
          // Descuentos en ARS nativo
          return sum + item.descuento;
        } else {
          // Descuentos en USD convertidos a ARS
          return sum + item.descuento * tipoCambio.valorVenta;
        }
      }, 0);

      const subtotalConDescuentosARS = subtotalBaseARS - totalDescuentosARS;

      // Para egresos ARS fijo: usar directamente totalPagado que ya está en ARS nativo
      const totalPagadoARS = metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0);

      // Seña en ARS
      const montoSeñaARS = monedaSeñaAplicada === 'ars' ? montoSeñaAplicada : 
                          (monedaSeñaAplicada === 'usd' ? montoSeñaAplicada * tipoCambio.valorVenta : 0);

      const totalFinalARS = subtotalConDescuentosARS - montoSeñaARS;
      const diferenciaARS = totalPagadoARS - totalFinalARS;

      return {
        subtotalBase: subtotalBaseARS,
        totalDescuentos: totalDescuentosARS,
        subtotalConDescuentosItems: subtotalConDescuentosARS,
        totalFinal: totalFinalARS,
        totalPagadoConDescuentos: totalPagadoARS,
        diferencia: diferenciaARS,
        descuentosPorMetodo: 0, // Los descuentos por método ya están incluidos en totalPagadoARS
        montoSeñaAplicada,
        totalARSRespetandoCongelados: totalFinalARS,
        esCalculoARS: true, // Flag para identificar que son valores en ARS
      };
    }
    
    // Fallback a lógica normal para todos los otros casos
    return calcularTotales();
  };

  const calcularTotales = () => {
    const subtotalBase = items.reduce((sum, item) => {
      if (item.esPrecioCongelado && item.precioFijoARS) {
        // Para items congelados (ingresos): usar ARS nativo sin convertir
        // Solo para compatibilidad interna, pero el display real será en ARS
        return sum + (item.precioFijoARS * item.cantidad) / 1000; // Valor nominal para cálculos
      } else if (item.esMontoFijoARS && tipo === 'egreso') {
        // Para items egresos con monto fijo ARS: usar valor nominal para cálculos
        return sum + (item.precio * item.cantidad) / 1000; // Valor nominal para cálculos
      } else {
        // Para items normales: usar el cálculo dinámico actual
        return sum + item.precio * item.cantidad;
      }
    }, 0);
    const totalDescuentos = items.reduce(
      (sum, item) => sum + item.descuento,
      0
    );
    const subtotalConDescuentosItems = subtotalBase - totalDescuentos;

    // El total pagado ya incluye los descuentos aplicados (está en montoFinal)
    const totalPagadoConDescuentos = metodosPago.reduce(
      (sum, metodo) => sum + metodo.montoFinal,
      0
    );

    // Calcular descuentos por método de pago (solo para mostrar)
    const descuentosPorMetodo = metodosPago.reduce(
      (sum, metodo) => sum + metodo.descuentoAplicado,
      0
    );

    // El total final debe ser el subtotal menos la seña menos los descuentos por método de pago
    // para que coincida con lo que realmente se debe pagar
    const montoSeñaEnUSD =
      monedaSeñaAplicada === 'ars'
        ? arsToUsd(montoSeñaAplicada)
        : montoSeñaAplicada;

    const totalSeñaUSD = monedaSeñaAplicada === 'usd' ? montoSeñaAplicada : 0;
    const totalSeñaARS = monedaSeñaAplicada === 'ars' ? montoSeñaAplicada : 0;

    // Los totales están en USD, convertir seña ARS a USD solo para el cálculo
    const montoSeñaARestar =
      monedaSeñaAplicada === 'ars'
        ? arsToUsd(montoSeñaAplicada)
        : montoSeñaAplicada;

    const totalFinalConDescuentos =
      subtotalConDescuentosItems - montoSeñaARestar - descuentosPorMetodo;

    const diferencia = totalPagadoConDescuentos - totalFinalConDescuentos;

    // Calcular total ARS respetando items congelados
    const totalARSRespetandoCongelados = calcularTotalARS();

    return {
      subtotalBase,
      totalDescuentos,
      subtotalConDescuentosItems,
      totalFinal: totalFinalConDescuentos,
      totalPagadoConDescuentos,
      diferencia,
      descuentosPorMetodo,
      montoSeñaAplicada,
      totalARSRespetandoCongelados,
    };
  };

  // Form validation (actualizada)
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!clienteProveedor.trim()) {
      nuevosErrores.clienteProveedor =
        'El nombre del cliente/proveedor es requerido';
    }

    if (!responsableId && tipo === 'ingreso') {
      nuevosErrores.responsable = 'Debe seleccionar un responsable';
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
    }

    // Validar items
    items.forEach((item, index) => {
      if (!item.nombre.trim()) {
        nuevosErrores[`item-${index}-nombre`] = 'El nombre es requerido';
      }
      if (item.precio <= 0) {
        nuevosErrores[`item-${index}-precio`] = 'El precio debe ser mayor a 0';
      }
      if (item.cantidad <= 0) {
        nuevosErrores[`item-${index}-cantidad`] =
          'La cantidad debe ser mayor a 0';
      }
    });

    const totales = calcularTotalesARS();
    const validacionMetodos = validarMetodosPago(totales.totalFinal);
    if (!validacionMetodos.esValido && validacionMetodos.error) {
      nuevosErrores.pagos = validacionMetodos.error;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Save transaction
  const handleSave = async () => {
    if (!validarFormulario()) return;

    setGuardando(true);

    try {
      const totales = calcularTotalesARS();
      const numeroTransaccion = generarNumeroComanda();

      const itemsComanda: ItemComanda[] = items.map((item) => ({
        productoServicioId: item.productoServicioId,
        nombre: item.nombre,
        tipo: tipo === 'ingreso' ? 'servicio' : 'producto',
        businessUnit: item.businessUnit,
        precio: item.precio,
        precioOriginalUSD: item.precio,
        cantidad: item.cantidad,
        descuento: 0,
        subtotal: item.subtotal,
        // Propagar campos de precio congelado (ingresos)
        esPrecioCongelado: item.esPrecioCongelado,
        precioFijoARS: item.precioFijoARS,
        // Propagar campo de monto fijo ARS (egresos)
        esMontoFijoARS: item.esMontoFijoARS,
      }));

      // USAR LA FUNCIÓN UNIFICADA PARA PERSISTENCIA
      const metodosPagoComanda = convertirParaPersistencia();

      // Para egresos, usar el usuario logueado como responsable automáticamente
      let responsable;
      if (tipo === 'egreso' && user) {
        responsable = {
          id: user.id,
          nombre: user.nombre,
          activo: true,
          unidadesDisponibles: ['estilismo'],
          fechaIngreso: new Date(),
        };
      } else {
        responsable = personal.find((p) => p.id === responsableId);
      }

      const nuevaComanda: Comanda = {
        id: generateUniqueId(tipo === 'ingreso' ? 'ing' : 'egr', Date.now()),
        numero: numeroTransaccion,
        tipo,
        fecha: new Date(),
        cliente: {
          id: `cliente-${Date.now()}`,
          nombre: clienteProveedor,
          telefono: telefono || undefined,
          email: undefined,
          cuit: undefined,
          señasDisponibles: { ars: 0, usd: 0 },
          fechaRegistro: new Date(),
        },
        mainStaff: responsable
          ? {
              id: responsable.id,
              nombre: responsable.nombre,
              activo: true,
              unidadesDisponibles: [
                tipo === 'ingreso' ? unidadNegocio : 'estilismo',
              ],
              fechaIngreso: new Date(),
            }
          : {
              id: 'default',
              nombre: 'Sistema',
              activo: true,
              unidadesDisponibles: [
                tipo === 'ingreso' ? unidadNegocio : 'estilismo',
              ],
              fechaIngreso: new Date(),
            },
        items: itemsComanda,
        metodosPago: metodosPagoComanda,
        subtotal: totales.subtotalConDescuentosItems,
        totalDescuentos: totales.totalDescuentos,
        // Guardar seña siguiendo el patrón de métodos de pago
        seña:
          monedaSeñaAplicada && montoSeñaAplicada > 0
            ? {
                monto: montoSeñaAplicada,
                moneda: monedaSeñaAplicada.toUpperCase() as 'USD' | 'ARS',
                fecha: new Date(),
              }
            : undefined,
        // Mantener campos legacy para compatibilidad
        totalSeña:
          monedaSeñaAplicada === 'ars'
            ? arsToUsd(montoSeñaAplicada)
            : montoSeñaAplicada,
        totalSeñaUSD: monedaSeñaAplicada === 'usd' ? montoSeñaAplicada : 0,
        totalSeñaARS: monedaSeñaAplicada === 'ars' ? montoSeñaAplicada : 0,
        montoSeñaAplicadaArs:
          monedaSeñaAplicada === 'ars' ? montoSeñaAplicada : 0,
        totalFinal: totales.totalFinal,
        estado: 'pendiente',
        observaciones: observaciones || undefined,
        estadoNegocio: 'pendiente',
        estadoValidacion: 'no_validado',
        tipoCambioAlCrear: {
          valorCompra: tipoCambio.valorCompra,
          valorVenta: tipoCambio.valorVenta,
          fecha: tipoCambio.fecha,
          fuente: tipoCambio.fuente,
          modoManual: tipoCambio.modoManual,
        },
      };

      if (clienteSeleccionado && monedaSeñaAplicada && montoSeñaAplicada > 0) {
        usarSeña(clienteSeleccionado.id, montoSeñaAplicada, monedaSeñaAplicada);
      }

      logger.info(`Guardando ${tipo}:`, nuevaComanda);
      agregarComanda(nuevaComanda);

      // Registrar actividad en auditoría
      logActivity(
        'Crear',
        'Caja Chica',
        `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} creado: ${nuevaComanda.numero} por ${formatAmount(nuevaComanda.totalFinal)} ${nuevaComanda.moneda}`,
        {
          comandaId: nuevaComanda.id,
          numero: nuevaComanda.numero,
          tipo: tipo,
          monto: nuevaComanda.totalFinal,
          moneda: nuevaComanda.moneda,
          cliente: clienteSeleccionado?.nombre || clienteProveedor,
        }
      );

      resetForm();
      onClose();
    } catch (error) {
      logger.error(`Error al guardar ${tipo}:`, error);
      setErrores({
        general: `Error al guardar el ${tipo}. Intente nuevamente.`,
      });
    } finally {
      setGuardando(false);
    }
  };

  // Reset form (actualizada)
  const resetForm = () => {
    setClienteSeleccionado(null);
    setClienteProveedor('');
    setTelefono('');
    setMontoSeñaAplicada(0);
    setMonedaSeñaAplicada(null);
    setMostrarSelectorCliente(false);
    setBusquedaCliente('');
    setUnidadNegocio('estilismo');
    setResponsableId('');
    setObservaciones('');
    setItems([]);
    resetMetodosPago();
    setDescuentoGlobalPorcentaje(0);
    setNumeroManual('');
    setErrores({});
    setMostrarBuscador(false);
    setBusqueda('');
  };

  const totales = calcularTotalesARS();

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
        <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3]">
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
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    USD: {formatDual(exchangeRate, false)}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Info */}
              <Card className="border border-gray-200 bg-white">
                <CardHeader>
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
                            Automático: {obtenerProximoNumero(tipo)}
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
                        <Label className="text-gray-700">Cliente *</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={clienteProveedor}
                              onChange={(e) =>
                                setClienteProveedor(e.target.value)
                              }
                              placeholder="Nombre del cliente"
                              className={
                                errores.clienteProveedor
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setMostrarSelectorCliente(
                                  !mostrarSelectorCliente
                                )
                              }
                              className="border-[#f9bbc4] text-[#8b5a6b] hover:bg-[#f9bbc4]/10"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Selector de clientes existentes */}
                          {mostrarSelectorCliente && (
                            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                              <div className="mb-2">
                                <Input
                                  value={busquedaCliente}
                                  onChange={(e) =>
                                    setBusquedaCliente(e.target.value)
                                  }
                                  placeholder="Buscar cliente..."
                                  className="text-sm"
                                />
                              </div>
                              <div className="max-h-32 space-y-1 overflow-y-auto">
                                {clientesFiltrados.map((cliente) => (
                                  <div
                                    key={cliente.id}
                                    onClick={() =>
                                      handleSeleccionarCliente(cliente)
                                    }
                                    className="cursor-pointer rounded p-2 text-sm hover:bg-gray-50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">
                                        {cliente.nombre}
                                      </span>
                                      {(cliente.señasDisponibles.ars > 0 ||
                                        cliente.señasDisponibles.usd > 0) && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          <DollarSign className="mr-1 h-3 w-3" />
                                          ARS: {cliente.señasDisponibles.ars} /
                                          USD: {cliente.señasDisponibles.usd}
                                        </Badge>
                                      )}
                                    </div>
                                    {cliente.telefono && (
                                      <div className="text-gray-500">
                                        {cliente.telefono}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {clientesFiltrados.length === 0 && (
                                  <div className="p-2 text-center text-sm text-gray-500">
                                    No se encontraron clientes
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Información de señas disponibles */}
                          {clienteSeleccionado &&
                            (clienteSeleccionado.señasDisponibles.ars > 0 ||
                              clienteSeleccionado.señasDisponibles.usd > 0) && (
                              <div className="space-y-3 rounded-lg bg-green-50 p-3">
                                <div>
                                  <p className="mb-2 text-sm font-medium text-green-800">
                                    Señas disponibles:
                                  </p>
                                  <div className="flex items-center gap-4">
                                    {clienteSeleccionado.señasDisponibles.ars >
                                      0 && (
                                      <div className="flex items-center gap-2">
                                        <Badge color="blue">ARS</Badge>
                                        <span className="font-semibold">
                                          {formatARSFromNative(
                                            clienteSeleccionado.señasDisponibles
                                              .ars
                                          )}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleAplicarSeña('ars')
                                          }
                                          disabled={
                                            monedaSeñaAplicada === 'usd'
                                          }
                                        >
                                          Aplicar
                                        </Button>
                                      </div>
                                    )}
                                    {clienteSeleccionado.señasDisponibles.usd >
                                      0 && (
                                      <div className="flex items-center gap-2">
                                        <Badge color="green">USD</Badge>
                                        <span className="font-semibold">
                                          {formatUSD(
                                            clienteSeleccionado.señasDisponibles
                                              .usd
                                          )}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleAplicarSeña('usd')
                                          }
                                          disabled={
                                            monedaSeñaAplicada === 'ars'
                                          }
                                        >
                                          Aplicar
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {montoSeñaAplicada > 0 && (
                                  <div className="mt-2 flex items-center justify-between rounded bg-green-100 p-2">
                                    <div>
                                      <p className="text-sm font-medium text-green-800">
                                        Seña aplicada:{' '}
                                        {monedaSeñaAplicada === 'ars'
                                          ? formatARSFromNative(
                                              montoSeñaAplicada
                                            )
                                          : formatUSD(montoSeñaAplicada)}
                                      </p>
                                      <p className="text-xs text-green-600">
                                        {monedaSeñaAplicada === 'ars'
                                          ? `Equivale a ${formatUSD(arsToUsd(montoSeñaAplicada))}`
                                          : `Equivale a ${formatARSFromNative(montoSeñaAplicada * tipoCambio.valorVenta)}`}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={handleQuitarSeña}
                                    >
                                      Quitar
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}

                          {errores.clienteProveedor && (
                            <p className="text-xs text-red-600">
                              {errores.clienteProveedor}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Campo de proveedor para egresos */}
                    {tipo === 'egreso' && (
                      <div>
                        <Label className="text-gray-700">Proveedor *</Label>
                        <Input
                          value={clienteProveedor}
                          onChange={(e) => setClienteProveedor(e.target.value)}
                          placeholder="Nombre del proveedor"
                          className={
                            errores.clienteProveedor
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }
                        />
                        {errores.clienteProveedor && (
                          <p className="mt-1 text-xs text-red-600">
                            {errores.clienteProveedor}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label className="text-gray-700">Teléfono</Label>
                      <Input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Teléfono"
                        className="border-gray-300"
                      />
                    </div>

                    {/* {tipo === 'ingreso' && (
                      <div>
                        <Label className="text-gray-700">
                          Unidad de Negocio *
                        </Label>
                        <Select
                          value={unidadNegocio}
                          onValueChange={(value) =>
                            setUnidadNegocio(value as UnidadNegocio)
                          }
                        >
                          <SelectTrigger className="border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            <SelectItem value="tattoo">Tattoo</SelectItem>
                            <SelectItem value="estilismo">Estilismo</SelectItem>
                            <SelectItem value="formacion">Formación</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )} */}

                    {tipo === 'ingreso' && (
                      <div>
                        <Label className="text-gray-700">Responsable *</Label>
                        <Select
                          value={responsableId}
                          onValueChange={setResponsableId}
                        >
                          <SelectTrigger
                            className={
                              errores.responsableId
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }
                          >
                            <SelectValue placeholder="Seleccionar responsable" />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            {personal.map((persona) => (
                              <SelectItem key={persona.id} value={persona.id}>
                                {persona.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errores.responsable && (
                          <p className="mt-1 text-xs text-red-600">
                            {errores.responsable}
                          </p>
                        )}
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

              {/* Items */}
              <Card className="border border-gray-200 bg-white">
                <CardHeader>
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
                          Buscar
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={agregarItem}
                        className="border-[#f9bbc4] bg-[#f9bbc4] font-medium text-white hover:bg-[#e292a3]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Descuento Global - Solo para ingresos */}
                  {items.length > 0 && tipo === 'ingreso' && (
                    <div className="mb-6 rounded-lg bg-gray-50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Descuento Global
                        </h4>
                        {totales.totalDescuentos > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={limpiarDescuentos}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Limpiar todos
                          </Button>
                        )}
                      </div>
                      <DiscountControls
                        descuentoPorcentaje={descuentoGlobalPorcentaje}
                        montoDescuento={0}
                        precioBase={totales.subtotalBase}
                        onAplicarDescuento={aplicarDescuentoGlobal}
                        onEliminarDescuento={() =>
                          setDescuentoGlobalPorcentaje(0)
                        }
                        label="Aplicar descuento a todos los items"
                        maxDescuento={50}
                      />
                    </div>
                  )}

                  {items.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {tipo === 'ingreso'
                          ? 'No hay servicios agregados'
                          : 'No hay conceptos agregados'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Haga clic en &quot;Agregar&quot; para comenzar
                      </p>
                    </div>
                  ) : (
                    items.map((item, index) => {
                      const precioBase = item.precio * item.cantidad;

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-gray-200 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <Badge variant="outline" className="text-gray-700">
                              {(item.esPrecioCongelado || item.esMontoFijoARS) && '🔒 '}
                              {tipo === 'ingreso' ? 'Servicio' : 'Concepto'} #
                              {index + 1}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarItem(item.id)}
                              className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                              <Label className="text-gray-700">Nombre *</Label>
                              <Input
                                value={item.nombre}
                                onChange={(e) =>
                                  actualizarItem(
                                    item.id,
                                    'nombre',
                                    e.target.value
                                  )
                                }
                                placeholder="Nombre del item"
                                className={
                                  errores[`item-${index}-nombre`]
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                }
                              />
                              {errores[`item-${index}-nombre`] && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errores[`item-${index}-nombre`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-700">Precio *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precio || ''}
                                onChange={(e) =>
                                  actualizarItem(
                                    item.id,
                                    'precio',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                                className={
                                  errores[`item-${index}-precio`]
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                }
                              />
                              {errores[`item-${index}-precio`] && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errores[`item-${index}-precio`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-700">
                                Cantidad *
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.cantidad || ''}
                                onChange={(e) =>
                                  actualizarItem(
                                    item.id,
                                    'cantidad',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className={
                                  errores[`item-${index}-cantidad`]
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                }
                              />
                              {errores[`item-${index}-cantidad`] && (
                                <p className="mt-1 text-xs text-red-600">
                                  {errores[`item-${index}-cantidad`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-700">Subtotal</Label>
                              <div className="flex h-10 items-center justify-between rounded-md border border-gray-300 bg-gray-50 px-3">
                                <span className="text-sm font-medium text-green-600">
                                  {formatItemAmount(item)}
                                </span>
                                {!item.esPrecioCongelado &&
                                  !item.esMontoFijoARS &&
                                  isExchangeRateValid &&
                                  item.subtotal > 0 && (
                                    <span className="text-xs text-gray-600">
                                      {formatARS(item.subtotal)}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>

                          {/* Checkbox para monto fijo en ARS - Solo para egresos */}
                          {tipo === 'egreso' && (
                            <div className="mt-4 border-t pt-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`monto-fijo-ars-${item.id}`}
                                  checked={item.esMontoFijoARS || false}
                                  onCheckedChange={(checked) =>
                                    actualizarItem(
                                      item.id,
                                      'esMontoFijoARS',
                                      checked === true
                                    )
                                  }
                                />
                                <Label 
                                  htmlFor={`monto-fijo-ars-${item.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-orange-600" />
                                    <span>Monto fijo en ARS (solo facturar en pesos argentinos)</span>
                                  </div>
                                </Label>
                              </div>
                              {item.esMontoFijoARS && (
                                <p className="mt-2 text-xs text-orange-600">
                                  💡 Este item se facturará únicamente en pesos argentinos sin conversión de tipo de cambio.
                                </p>
                              )}
                            </div>
                          )}

                          {/* Descuento por Item - Solo para ingresos */}
                          {tipo === 'ingreso' && (
                            <div className="mt-4 border-t pt-4">
                              <DiscountControls
                                descuentoPorcentaje={item.descuentoPorcentaje}
                                montoDescuento={item.descuento}
                                precioBase={precioBase}
                                onAplicarDescuento={(porcentaje) =>
                                  aplicarDescuentoItem(item.id, porcentaje)
                                }
                                onEliminarDescuento={() =>
                                  eliminarDescuentoItem(item.id)
                                }
                                label="Descuento individual"
                                size="sm"
                                maxDescuento={50}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {errores.items && (
                    <p className="text-sm text-red-600">{errores.items}</p>
                  )}
                </CardContent>
              </Card>

              {/* Warning para items con precio congelado */}
              {hayItemsCongelados && (
                <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-orange-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        🔒 Items con {tipo === 'ingreso' ? 'precio fijo' : 'monto fijo en ARS'} detectados
                      </h3>
                      <div className="mt-1 text-sm text-orange-700">
                        Esta comanda contiene items con {tipo === 'ingreso' ? 'precios congelados' : 'montos fijos'} en
                        ARS.
                        <strong>
                          {' '}
                          Solo se permite pago en pesos argentinos.
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <MetodosPagoSection
                metodosPago={metodosPago}
                totalPagado={totales.totalPagadoConDescuentos}
                montoTotal={totales.totalFinal}
                onAgregarMetodo={agregarMetodoPago}
                onEliminarMetodo={eliminarMetodoPago}
                onActualizarMetodo={actualizarMetodoPago}
                obtenerResumenDual={obtenerResumenDual}
                hayItemsCongelados={hayItemsCongelados}
              />

              {errores.pagos && (
                <div className="mt-2">
                  <p className="text-sm text-red-600">{errores.pagos}</p>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <Card className="border border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {/* Subtotal base */}
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="text-sm text-gray-700">
                          Subtotal base
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatAmountForARSFixed(totales.subtotalBase, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)}
                          </div>
                          {isExchangeRateValid && totales.subtotalBase > 0 && (
                            <div className="text-xs text-gray-600">
                              {hayItemsCongelados
                                ? formatARSFromNative(
                                    totales.totalARSRespetandoCongelados
                                  )
                                : formatARS(totales.subtotalBase)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descuentos por ítem */}
                      {totales.totalDescuentos > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                          <div className="text-sm text-orange-700">
                            Descuentos por ítem
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-orange-700">
                              -{formatAmountForARSFixed(totales.totalDescuentos, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)}
                            </div>
                            {isExchangeRateValid &&
                              totales.totalDescuentos > 0 && (
                                <div className="text-xs text-orange-600">
                                  -{formatARS(totales.totalDescuentos)}
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Seña aplicada */}
                      {montoSeñaAplicada > 0 && monedaSeñaAplicada && (
                        <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                          <div className="text-sm text-purple-700">
                            Seña aplicada ({monedaSeñaAplicada.toUpperCase()})
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-purple-700">
                              -{' '}
                              {monedaSeñaAplicada === 'ars'
                                ? formatARSFromNative(montoSeñaAplicada)
                                : formatUSD(montoSeñaAplicada)}
                            </div>
                            {isExchangeRateValid && (
                              <div className="text-xs text-purple-600">
                                -{' '}
                                {formatAmount(
                                  monedaSeñaAplicada === 'ars'
                                    ? arsToUsd(montoSeñaAplicada)
                                    : montoSeñaAplicada
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Descuentos por método de pago */}
                      {totales.descuentosPorMetodo > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                          <div className="text-sm text-green-700">
                            Descuentos por método de pago
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-700">
                              -{formatAmountForARSFixed(totales.descuentosPorMetodo, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)}
                            </div>
                            {isExchangeRateValid &&
                              totales.descuentosPorMetodo > 0 && (
                                <div className="text-xs text-green-600">
                                  -{formatARS(totales.descuentosPorMetodo)}
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Total a pagar (después de descuentos por ítem y seña) */}
                      <div className="flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
                        <div className="text-sm font-medium text-blue-900">
                          Total a pagar
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-blue-900">
                            {formatAmountForARSFixed(totales.totalFinal, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)}
                          </div>
                          {isExchangeRateValid && totales.totalFinal > 0 && (
                            <div className="text-sm text-blue-700">
                              {hayItemsCongelados
                                ? formatARSFromNative(
                                    totales.totalARSRespetandoCongelados
                                  )
                                : formatARS(totales.totalFinal)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total efectivamente pagado */}
                      <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                        <div className="text-sm text-green-700">
                          Total pagado
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-700">
                            {formatAmountForARSFixed(totales.totalPagadoConDescuentos, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)}
                          </div>
                          {isExchangeRateValid &&
                            totales.totalPagadoConDescuentos > 0 && (
                              <div className="text-xs text-green-600">
                                {formatARS(totales.totalPagadoConDescuentos)}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Diferencia/Balance */}
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="text-sm text-gray-700">Balance</div>
                        <div className="text-right">
                          <div
                            className={`text-sm font-semibold ${
                              Math.abs(totales.diferencia) < 0.01
                                ? 'text-green-600'
                                : totales.diferencia > 0
                                  ? 'text-blue-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {Math.abs(totales.diferencia) < 0.01
                              ? '✓ Balanceado'
                              : totales.diferencia > 0
                                ? `+${formatAmountForARSFixed(totales.diferencia, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)} (exceso)`
                                : `${formatAmountForARSFixed(totales.diferencia, !!(totales as {esCalculoARS?: boolean}).esCalculoARS)} (faltante)`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="border border-gray-200 bg-white">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Button
                        onClick={handleSave}
                        disabled={guardando || cargando}
                        className="w-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] font-medium text-white hover:from-[#e292a3] hover:to-[#d4a7ca]"
                      >
                        {guardando ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                        variant="outline"
                        onClick={onClose}
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </Button>
                    </div>

                    {errores.general && (
                      <p className="mt-3 text-center text-sm text-red-600">
                        {errores.general}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Search Modal */}
      {mostrarBuscador && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-2xl">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Buscar Productos/Servicios
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarBuscador(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-4">
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="border-gray-300"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-6">
                {tipo === 'ingreso' ? (
                  // Vista agrupada para ingresos
                  Object.entries(
                    productosServiciosFiltrados as Record<
                      UnidadNegocio,
                      ProductoServicio[]
                    >
                  ).map(([unidad, productos]) => (
                    <div key={unidad}>
                      <div className="mb-3 flex items-center gap-3">
                        {obtenerIconoUnidad(unidad as UnidadNegocio)}
                        <h4 className="font-medium text-gray-900 capitalize">
                          {unidad}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {productos.length} items
                        </Badge>
                      </div>
                      <div className="ml-6 space-y-2">
                        {productos.map((producto: ProductoServicio) => (
                          <div
                            key={producto.id}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                            onClick={() => agregarDesdeProducto(producto)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {producto.nombre}
                              </div>
                              <div className="text-sm text-gray-600">
                                {producto.tipo} -{' '}
                                {formatProductAmount(producto)}
                              </div>
                              {producto.descripcion && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {producto.descripcion}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#f9bbc4] text-[#8b5a6b] hover:bg-[#f9bbc4] hover:text-white"
                            >
                              Agregar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Vista simple para egresos (comportamiento actual)
                  <div className="space-y-2">
                    {(productosServiciosFiltrados as ProductoServicio[]).map(
                      (producto: ProductoServicio) => (
                        <div
                          key={producto.id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                          onClick={() => agregarDesdeProducto(producto)}
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {producto.nombre}
                            </div>
                            <div className="text-sm text-gray-600">
                              {producto.tipo} - {formatProductAmount(producto)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                          >
                            Agregar
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                )}
                {((tipo === 'ingreso' &&
                  Object.keys(productosServiciosFiltrados).length === 0) ||
                  (tipo === 'egreso' &&
                    (productosServiciosFiltrados as ProductoServicio[])
                      .length === 0)) && (
                  <div className="py-8 text-center text-gray-500">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p>No se encontraron productos/servicios</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
