'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { useActivityStore } from '@/features/activity/store/activityStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { MONEDAS } from '@/lib/constants';
import { usePersonal } from '@/features/personal/hooks/usePersonal';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Comanda, ItemComanda, UnidadNegocio, Cliente } from '@/types/caja';
import {
  useInitializeComandaStore,
  generateUniqueId,
} from '@/hooks/useInitializeComandaStore';
import { DiscountControls } from './DiscountControls';
import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';
import { useMetodosPago } from '@/hooks/useMetodosPago';
import { useAuth } from '@/features/auth/hooks/useAuth';
import useTrabajadoresStore from '@/features/personal/store/trabajadoresStore';
import {
  ComandaCreateNew,
  EstadoDeComandaNew,
  RolTrabajadorNew,
  TipoDeComandaNew,
  ProductoServicioNew,
  TipoPagoNew,
  MonedaNew,
  TipoItemNew,
  NombreDescuentoNew,
  CajaNew,
} from '@/services/unidadNegocio.service';
import { RolTrabajador } from '@/types/trabajador';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import ClienteSelector from '@/components/comandas/ClienteSelector';
import { toast } from 'sonner';

interface ModalTransaccionUnificadoProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'ingreso' | 'egreso';
}

interface ItemTransaccion {
  id: string;
  productoServicioId: string;
  nombre: string;
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
  // Responsables asignados a este item
  responsablesIds: string[];
  // Estado para mostrar/ocultar el selector de responsables
  mostrarSelectorResponsables?: boolean;
}

export default function ModalTransaccionUnificado({
  isOpen,
  onClose,
  tipo,
}: ModalTransaccionUnificadoProps) {
  // Store hooks
  const {
    agregarComanda,
    cargarComandasPaginadas,
    getComandasPaginadas,
    comandasPaginadas,
    getUltimaComanda,
    existeComanda,
  } = useComandaStore();

  const { productosServicios, loadProductosServicios } =
    useProductosServiciosStore();
  const { trabajadores, loadTrabajadores } = useTrabajadoresStore();
  const personal = trabajadores;
  const { cargarClientes } = useClientesStore();

  const {
    exchangeRate,
    isExchangeRateValid,
    formatARS,
    formatUSD,
    formatDual,
    formatARSFromNative,
    arsToUsd,
  } = useCurrencyConverter();

  const [dolar, setDolar] = useState(0);
  const { lastDolar } = useExchangeRateStore();

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

  // Helper function para items en comanda con precio congelado
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

  const { getTipoCambio, cargando } = useExchangeRateStore();
  const { user } = useAuth();

  useInitializeComandaStore();

  // Form state
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [clienteProveedor, setClienteProveedor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [montoSeñaAplicada, setMontoSeñaAplicada] = useState(0);
  const [monedaSeñaAplicada, setMonedaSeñaAplicada] = useState<
    'ars' | 'usd' | null
  >(null);
  const [unidadNegocio, setUnidadNegocio] =
    useState<UnidadNegocio>('estilismo');
  const [responsableId, setResponsableId] = useState('');
  const [responsablesIds, setResponsablesIds] = useState<string[]>([]);
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

  // Hook para métodos de pago con descuentos automáticos
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

  useEffect(() => {
    cargarComandasPaginadas({
      page: 1,
      limit: 20,
      orderBy: 'numero',
      order: 'DESC',
      search: '',
      tipoDeComanda: tipo === 'ingreso' ? TipoDeComandaNew.INGRESO : TipoDeComandaNew.EGRESO,
    });

    lastDolar().then((dolarR) => {
      if(dolar === 0) {
        setDolar(dolarR.venta);
      }
    }).catch((error) => {
      toast.error('Error al obtener el último dólar');
    });
  }, []);

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
  const [numeroUltimaComanda, setNumeroUltimaComanda] = useState('');

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarMetodosPago, setMostrarMetodosPago] = useState(false);
  const [mostrarSelectorResponsables, setMostrarSelectorResponsables] =
    useState(false);
  const [cambiosTemporales, setCambiosTemporales] = useState<{
    metodosPago: any[];
    montoSeñaAplicada: number;
    monedaSeñaAplicada: 'ars' | 'usd' | null;
  }>({
    metodosPago: [],
    montoSeñaAplicada: 0,
    monedaSeñaAplicada: null,
  });
  const [alreadyNotified, setAlreadyNotified] = useState(false);

  useModalScrollLock(isOpen);

  const validarNumeroManual = (numero: string): boolean => {
    if (!numero.trim()) return false;

    // Validar que sea solo números
    if (!/^\d+$/.test(numero)) return false;

    // Generar el número completo con prefijo
    const prefijo = tipo === 'ingreso' ? '01' : '02';
    const numeroCompleto = `${prefijo}-${numero.padStart(4, '0')}`;

    // Verificar que no exista ya
    // const existe = comandas.some((c) => c.numero === numeroCompleto);
    // return !existe;
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
    setAlreadyNotified(false);
    const dolar = getTipoCambio().valorVenta;
    console.log('dolar', dolar);
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
    loadTrabajadores();
    cargarClientes();
    loadProductosServicios();
    console.log(productosServicios, 'TEST1');
  }, [loadTrabajadores, cargarClientes, loadProductosServicios]);

  // Debug useEffect para el modal de búsqueda
  useEffect(() => {
    if (mostrarBuscador) {
      console.log(
        'Modal de búsqueda abierto, productosServicios:',
        productosServicios.length
      );
    }
  }, [mostrarBuscador, productosServicios.length]);

  // useEffect para cerrar selector de responsables al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.responsables-selector')) {
        setMostrarSelectorResponsables(false);
      }
    };

    if (mostrarSelectorResponsables) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarSelectorResponsables]);

  // Manejar aplicación de seña
  const handleAplicarSeña = (moneda: 'ars' | 'usd') => {
    if (clienteSeleccionado && clienteSeleccionado.señasDisponibles) {
      const señas = clienteSeleccionado.señasDisponibles;
      const montoSeña = señas[moneda] || 0;

      if (montoSeña > 0) {
        setMontoSeñaAplicada(montoSeña);
        setMonedaSeñaAplicada(moneda);
        toast.success(`Seña aplicada: ${moneda.toUpperCase()} ${montoSeña}`);
      } else {
        toast.error(
          `El cliente no tiene señas disponibles en ${moneda.toUpperCase()}.`
        );
      }
    } else {
      toast.error('Debe seleccionar un cliente para aplicar señas.');
    }
  };

  // Función directa para aplicar seña USD como ARS
  const handleAplicarSeñaUSDComoARS = () => {
    if (clienteSeleccionado && clienteSeleccionado.señasDisponibles) {
      const montoUSD = clienteSeleccionado.señasDisponibles.usd;
      if (montoUSD > 0) {
        const tipoCambio = getTipoCambio();
        const montoARS = montoUSD * tipoCambio.valorVenta;
        setMontoSeñaAplicada(montoARS);
        setMonedaSeñaAplicada('ars');
        toast.success(
          `Seña aplicada: ARS ${montoARS.toFixed(2)} (convertida desde USD ${montoUSD})`
        );
      }
    }
  };

  const handleQuitarSeña = () => {
    setMontoSeñaAplicada(0);
    setMonedaSeñaAplicada(null);
    toast.info('Seña removida');
  };

  // Validar exceso de pago
  const validarExcesoPago = (totalPagado: number, totalFinal: number) => {
    const diferencia = totalPagado - totalFinal;
    if (diferencia > 0.01) {
      const exceso = Math.abs(diferencia);
      toast.warning(
        `⚠️ Estás cobrando $${formatAmountForARSFixed(exceso, (totales as any).esCalculoARS)} más del total a pagar.`
      );
      return false;
    }
    return true;
  };

  // Aplicar cambios temporales
  const aplicarCambiosTemporales = () => {
    // Aplicar métodos de pago
    if (cambiosTemporales.metodosPago.length > 0) {
      // Aquí necesitaríamos una función para actualizar los métodos de pago
      // Por ahora usamos el hook directamente
    }

    // Aplicar seña
    if (cambiosTemporales.montoSeñaAplicada > 0) {
      setMontoSeñaAplicada(cambiosTemporales.montoSeñaAplicada);
      setMonedaSeñaAplicada(cambiosTemporales.monedaSeñaAplicada);
    }

    // Limpiar cambios temporales
    setCambiosTemporales({
      metodosPago: [],
      montoSeñaAplicada: 0,
      monedaSeñaAplicada: null,
    });

    toast.success('Cambios aplicados correctamente');
  };

  const agregarItem = () => {
    const nuevoItem: ItemTransaccion = {
      id: `temp-${Date.now()}`,
      productoServicioId: '',
      nombre: '',
      precio: 0,
      cantidad: 1,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: 0,
      descripcion: '',
      responsablesIds: [],
      mostrarSelectorResponsables: false,
    };
    setItems([...items, nuevoItem]);
  };

  const agregarDesdeProducto = (producto: ProductoServicioNew) => {
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
      precio: precioBase,
      cantidad: 1,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: subtotalBase,
      descripcion: producto.descripcion || '',
      // Propagar campos de precio congelado
      esPrecioCongelado: producto.esPrecioCongelado,
      precioFijoARS: producto.precioFijoARS,
      responsablesIds: [],
      mostrarSelectorResponsables: false,
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
    valor: string | number | boolean | string[]
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
            } else {
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
          return sum + subtotalUSD * getTipoCambio().valorVenta;
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
          return sum + subtotalUSD * getTipoCambio().valorVenta;
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
          return sum + item.precio * item.cantidad * getTipoCambio().valorVenta;
        }
      }, 0);

      const totalDescuentosARS = items.reduce((sum, item) => {
        if (item.esMontoFijoARS) {
          // Descuentos en ARS nativo
          return sum + item.descuento;
        } else {
          // Descuentos en USD convertidos a ARS
          return sum + item.descuento * getTipoCambio().valorVenta;
        }
      }, 0);

      const subtotalConDescuentosARS = subtotalBaseARS - totalDescuentosARS;

      // Para egresos ARS fijo: usar directamente totalPagado que ya está en ARS nativo
      const totalPagadoARS = metodosPago.reduce(
        (sum, mp) => sum + mp.montoFinal,
        0
      );

      // Seña en ARS
      const montoSeñaARS =
        monedaSeñaAplicada === 'ars'
          ? montoSeñaAplicada
          : monedaSeñaAplicada === 'usd'
            ? montoSeñaAplicada * getTipoCambio().valorVenta
            : 0;

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

    if (
      items.every((item) => item.responsablesIds.length === 0) &&
      tipo === 'ingreso'
    ) {
      toast.error('Debe seleccionar al menos un responsable', {
        position: 'top-center',
      });
      nuevosErrores.responsable = 'Debe seleccionar al menos un responsable';
    }

    // if (responsablesIds.length === 0 && tipo === 'ingreso') {
    // nuevosErrores.responsable = 'Debe seleccionar al menos un responsable';
    // }

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

    console.table(nuevosErrores);
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Calcular faltante cuando se termina de cargar el método de pago
  const calcularFaltante = () => {
    if (metodosPago.length === 0) return;

    const totales = calcularTotalesARS();
    const totalFinal = totales.totalFinal;
    const totalPagado = metodosPago.reduce((sum, mp) => sum + mp.montoFinal, 0);
    const faltante = totalFinal - totalPagado;

    // Si hay faltante, mostrar toast informativo
    if (faltante > 0.01) {
      setAlreadyNotified(false);
      // toast.info(`Faltante a pagar: ${formatAmountForARSFixed(faltante, (totales as any).esCalculoARS)}`);
    } else if (faltante < -0.01) {
      setAlreadyNotified(false);
      toast.info(
        `Excedente: ${formatAmountForARSFixed(Math.abs(faltante), (totales as any).esCalculoARS)}`
      );
    } else {
      // if (!alreadyNotified) {
      //   setAlreadyNotified(true);
      //   toast.success('Pago completo');
      // }
    }
  };

  // useEffect para calcular faltante cuando cambian los métodos de pago
  useEffect(() => {
    if (metodosPago.length > 0 && metodosPago.some((mp) => mp.monto > 0)) {
      calcularFaltante();
    }
  }, [metodosPago, calcularFaltante]);

  // Save transaction
  const handleSave = async () => {
    console.log('guardando COMANDA');
    if (!validarFormulario()) return;
    console.log('validado');
    setGuardando(true);

    try {
      const totales = calcularTotalesARS();
      const numeroTransaccion = numeroManual.trim()
        ? '01-' + numeroManual
        : numeroUltimaComanda;
      console.warn('numeroTransaccion', numeroTransaccion);
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
        metodosPago: metodosPago.map((m) => {
          return {
            tipo: m.tipo as TipoPagoNew,
            monto: m.monto,
            montoFinal: m.montoFinal,
            descuentoGlobalPorcentaje: 100 - (m.montoFinal / m.monto) * 100,
            moneda: m.moneda as MonedaNew,
            recargoPorcentaje: 0,
          };
        }),
        descuentosAplicados: [],
        items: items.map((item) => {
          return {
            productoServicioId: item.productoServicioId,
            nombre: item.nombre,
            tipo: tipo === 'ingreso' ? TipoItemNew.INGRESO : TipoItemNew.EGRESO,
            precio: item.precio,
            cantidad: item.cantidad,
            descuento: item.descuento,
            trabajadorId: item.responsablesIds[0],
            subtotal: item.subtotal,
          };
        }),
      };

      const descuentos = nuevaComandaNew.metodosPago?.map((mp) => {
        return {
          nombre: NombreDescuentoNew.DESCUENTO_POR_METODO_PAGO,
          descripcion: 'Descuento por método de pago',
          porcentaje: mp.descuentoGlobalPorcentaje,
          montoFijo: 0,
        };
      });
      const seña =
        monedaSeñaAplicada === 'ars'
          ? (clienteSeleccionado?.señasDisponibles?.ars ?? 0)
          : 0;
      const señaUSD =
        monedaSeñaAplicada === 'usd'
          ? (clienteSeleccionado?.señasDisponibles?.usd ?? 0)
          : 0;

      console.log(
        'seña',
        seña,
        señaUSD,
        monedaSeñaAplicada,
        monedaSeñaAplicada === 'ars',
        monedaSeñaAplicada === 'usd',
        clienteSeleccionado?.señasDisponibles
      );

      nuevaComandaNew.descuentosAplicados = descuentos;
      nuevaComandaNew.precioDolar =
        (nuevaComandaNew.metodosPago?.reduce((sum, mp) => {
          return mp.moneda === MonedaNew.USD ? sum + mp.montoFinal! : sum;
        }, 0) ?? 0) + señaUSD;
      nuevaComandaNew.precioPesos =
        (nuevaComandaNew.metodosPago?.reduce((sum, mp) => {
          return mp.moneda === MonedaNew.ARS ? sum + mp.montoFinal! : sum;
        }, 0) ?? 0) + seña;
      nuevaComandaNew.usuarioConsumePrepago = seña > 0 || señaUSD > 0;

      const existe = await existeComanda(numeroTransaccion.toString());
      if (existe) {
        toast.error('El número de comanda ya existe');
        return;
      }

      console.log(nuevaComandaNew, items, nuevaComandaNew.items);

      await agregarComanda(nuevaComandaNew);
      resetForm();
      onClose();
      await cargarComandasPaginadas({
        page: 1,
        limit: 20,
        orderBy: 'numero',
        order: 'DESC',
        search: '',
        tipoDeComanda: tipo === 'ingreso' ? TipoDeComandaNew.INGRESO : TipoDeComandaNew.EGRESO,
      });
  
    } catch (error) {
      logger.error(`Error al guardar ${tipo}:`, error);
      setErrores({
        general: 'Error al guardar la transacción. Intente nuevamente.',
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
    setUnidadNegocio('estilismo');
    setResponsableId('');
    setResponsablesIds([]);
    setObservaciones('');
    setItems([]);
    setDescuentoGlobalPorcentaje(0);
    setMontoSeñaAplicada(0);
    setMonedaSeñaAplicada(null);
    setNumeroManual('');
    setNumeroUltimaComanda('');
    setGuardando(false);
    setErrores({});
    setMostrarBuscador(false);
    setBusqueda('');
    setMostrarMetodosPago(false);
    setMostrarSelectorResponsables(false);
    setCambiosTemporales({
      metodosPago: [],
      montoSeñaAplicada: 0,
      monedaSeñaAplicada: null,
    });

    resetMetodosPago();
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
                              // Resetear seña al cambiar de cliente
                              setMontoSeñaAplicada(0);
                              setMonedaSeñaAplicada(null);
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

                    {/* Campo de proveedor para egresos */}
                    {/* {tipo === 'egreso' && (
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
                    )} */}

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
                  {/* {items.length > 0 && tipo === 'ingreso' && (
                    <div className="mb-6 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-200 p-4 shadow-sm">
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
                  )} */}

                  {items.length === 0 ? (
                    <div className="to-gray-150 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-100 p-8 text-center shadow-sm">
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
                          className="rounded-lg border-2 border-gray-300 bg-gradient-to-r from-white to-gray-50 p-4 shadow-md"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <Badge variant="outline" className="text-gray-700">
                              {(item.esPrecioCongelado ||
                                item.esMontoFijoARS) &&
                                '🔒 '}
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
                              <div className="to-gray-150 flex h-10 items-center justify-between rounded-md border-2 border-gray-300 bg-gradient-to-r from-gray-100 px-3">
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
                                  className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-orange-600" />
                                    <span>
                                      Monto fijo en ARS (solo facturar en pesos
                                      argentinos)
                                    </span>
                                  </div>
                                </Label>
                              </div>
                              {item.esMontoFijoARS && (
                                <p className="mt-2 text-xs text-orange-600">
                                  💡 Este item se facturará únicamente en pesos
                                  argentinos sin conversión de tipo de cambio.
                                </p>
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
                                <div className="relative">
                                  <div
                                    onClick={() => {
                                      const newItems = items.map((i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              mostrarSelectorResponsables:
                                                !i.mostrarSelectorResponsables,
                                            }
                                          : {
                                              ...i,
                                              mostrarSelectorResponsables:
                                                false,
                                            }
                                      );
                                      setItems(newItems);
                                    }}
                                    className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:border-gray-400"
                                  >
                                    <span
                                      className={
                                        item.responsablesIds.length > 0
                                          ? 'text-gray-900'
                                          : 'text-gray-500'
                                      }
                                    >
                                      {(() => {
                                        console.log(
                                          'Renderizando selector para item:',
                                          item.id,
                                          'responsablesIds:',
                                          item.responsablesIds
                                        );
                                        if (item.responsablesIds.length > 0) {
                                          const persona = personal.find(
                                            (p) =>
                                              p.id === item.responsablesIds[0]
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

                                  {item.mostrarSelectorResponsables && (
                                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                      <div className="max-h-48 overflow-y-auto p-2">
                                        {personal.map((persona) => (
                                          <div
                                            key={persona.id}
                                            onClick={() => {
                                              console.log(
                                                'Seleccionando responsable:',
                                                persona.nombre,
                                                'para item:',
                                                item.id
                                              );
                                              // Actualizar el item con el responsable seleccionado y cerrar el selector
                                              setItems(
                                                items.map((i) =>
                                                  i.id === item.id
                                                    ? {
                                                        ...i,
                                                        responsablesIds: [
                                                          persona.id,
                                                        ],
                                                        mostrarSelectorResponsables:
                                                          false,
                                                      }
                                                    : i
                                                )
                                              );
                                              console.log(
                                                'Responsable seleccionado. Nuevo estado:',
                                                [persona.id]
                                              );
                                            }}
                                            className="flex cursor-pointer items-center space-x-2 rounded px-2 py-1 hover:bg-gray-100"
                                          >
                                            <span className="text-sm">
                                              {persona.nombre}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {item.responsablesIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      const persona = personal.find(
                                        (p) => p.id === item.responsablesIds[0]
                                      );
                                      return persona ? (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {persona.nombre}
                                          <X
                                            className="ml-1 h-3 w-3 cursor-pointer"
                                            onClick={() => {
                                              actualizarItem(
                                                item.id,
                                                'responsablesIds',
                                                []
                                              );
                                            }}
                                          />
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Descuento por Item - Solo para ingresos */}
                          {tipo === 'ingreso' && (
                            <div className="mt-4 border-t pt-4">
                              <DiscountControls
                                descuentoPorcentaje={item.descuentoPorcentaje}
                                montoDescuento={item.descuento}
                                precioBase={item.precio * item.cantidad}
                                onAplicarDescuento={(porcentaje) =>
                                  aplicarDescuentoItem(item.id, porcentaje)
                                }
                                onEliminarDescuento={() =>
                                  eliminarDescuentoItem(item.id)
                                }
                                label={`Descuento para ${item.nombre}`}
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
                <div className="rounded-lg border-l-4 border-orange-400 bg-gradient-to-r from-orange-100 to-orange-200 p-4 shadow-md">
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
                        🔒 Items con{' '}
                        {tipo === 'ingreso'
                          ? 'precio fijo'
                          : 'monto fijo en ARS'}{' '}
                        detectados
                      </h3>
                      <div className="mt-1 text-sm text-orange-700">
                        Esta comanda contiene items con{' '}
                        {tipo === 'ingreso'
                          ? 'precios congelados'
                          : 'montos fijos'}{' '}
                        en ARS.
                        <strong>
                          {' '}
                          Solo se permite pago en pesos argentinos.
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Métodos de Pago */}
              {tipo === 'ingreso' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Métodos de Pago
                    </h3>
                    <div className="flex gap-2">
                      {/* Botones de selección rápida para métodos de pago */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          agregarMetodoPago();
                          // Actualizar el último método agregado con efectivo
                          const ultimoIndex = metodosPago.length;
                          actualizarMetodoPago(ultimoIndex, 'tipo', 'efectivo');
                        }}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        💰 Efectivo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          agregarMetodoPago();
                          const ultimoIndex = metodosPago.length;
                          actualizarMetodoPago(ultimoIndex, 'tipo', 'tarjeta');
                        }}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        💳 Tarjeta
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          agregarMetodoPago();
                          const ultimoIndex = metodosPago.length;
                          actualizarMetodoPago(
                            ultimoIndex,
                            'tipo',
                            'transferencia'
                          );
                        }}
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        📱 Transferencia
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          agregarMetodoPago();
                          const ultimoIndex = metodosPago.length;
                          actualizarMetodoPago(ultimoIndex, 'tipo', 'giftcard');
                        }}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        🎁 Gift Card
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          agregarMetodoPago();
                          const ultimoIndex = metodosPago.length;
                          actualizarMetodoPago(ultimoIndex, 'tipo', 'qr');
                        }}
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      >
                        📱 QR
                      </Button>
                    </div>
                  </div>

                  {/* Sección de métodos de pago - Siempre visible */}
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
                </div>
              )}

              {errores.pagos && (
                <div className="mt-2">
                  <p className="text-sm text-red-600">{errores.pagos}</p>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <Card className="border border-gray-300 bg-white shadow-md">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="text-lg text-gray-900">
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {/* Subtotal base */}
                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
                        <div className="text-sm text-gray-700">
                          Subtotal base
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatAmountForARSFixed(
                              totales.subtotalBase,
                              (totales as any).esCalculoARS
                            )}
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
                        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-100 to-orange-200 p-3 shadow-sm">
                          <div className="text-sm text-orange-700">
                            Descuentos por ítem
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-orange-700">
                              -
                              {formatAmountForARSFixed(
                                totales.totalDescuentos,
                                (totales as any).esCalculoARS
                              )}
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
                        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 p-3 shadow-sm">
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

                      {/* Señas disponibles del cliente */}
                      {tipo === 'ingreso' &&
                        clienteSeleccionado &&
                        clienteSeleccionado.señasDisponibles && (
                          <div className="rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-200 p-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="text-sm font-medium text-blue-900">
                                💰 Señas disponibles
                              </div>
                              {montoSeñaAplicada > 0 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleQuitarSeña}
                                  className="border-red-300 text-red-700 hover:bg-red-100"
                                >
                                  Quitar
                                </Button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {clienteSeleccionado.señasDisponibles.ars > 0 && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAplicarSeña('ars')}
                                    disabled={montoSeñaAplicada > 0}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    ARS
                                  </Button>
                                  <span className="text-xs text-blue-600">
                                    {formatARSFromNative(
                                      clienteSeleccionado.señasDisponibles.ars
                                    )}
                                  </span>
                                </div>
                              )}
                              {clienteSeleccionado.señasDisponibles.usd > 0 && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAplicarSeña('usd')}
                                    disabled={montoSeñaAplicada > 0}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                  >
                                    USD
                                  </Button>
                                  <span className="text-xs text-blue-600">
                                    {formatUSD(
                                      clienteSeleccionado.señasDisponibles.usd
                                    )}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAplicarSeñaUSDComoARS}
                                    disabled={montoSeñaAplicada > 0}
                                    className="border-green-300 text-xs text-green-700 hover:bg-green-100"
                                    title={`Convertir a ARS: ${formatARSFromNative(clienteSeleccionado.señasDisponibles.usd * getTipoCambio().valorVenta)}`}
                                  >
                                    ARS
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Descuentos por método de pago */}
                      {totales.descuentosPorMetodo > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-100 to-green-200 p-3 shadow-sm">
                          <div className="text-sm text-green-700">
                            Descuentos por método de pago
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-700">
                              -
                              {formatAmountForARSFixed(
                                totales.descuentosPorMetodo,
                                (totales as any).esCalculoARS
                              )}
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
                      <div className="flex items-center justify-between rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-200 p-3 shadow-md">
                        <div className="text-sm font-medium text-blue-900">
                          Total a pagar
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-blue-900">
                            {formatAmountForARSFixed(
                              totales.totalFinal,
                              (totales as any).esCalculoARS
                            )}
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
                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-100 to-green-200 p-3 shadow-sm">
                        <div className="text-sm text-green-700">
                          Total pagado
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-700">
                            {formatAmountForARSFixed(
                              totales.totalPagadoConDescuentos,
                              (totales as any).esCalculoARS
                            )}
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
                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
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
                                ? `+${formatAmountForARSFixed(totales.diferencia, (totales as any).esCalculoARS)} (exceso)`
                                : `${formatAmountForARSFixed(totales.diferencia, (totales as any).esCalculoARS)} (faltante)`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="border border-gray-300 bg-white shadow-md">
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
          <div className="w-full max-w-3xl rounded-lg border border-gray-100 bg-white shadow-2xl">
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
                  <div className="space-y-2">
                    {productosServicios
                      .filter(
                        (producto) =>
                          producto.nombre
                            .toLowerCase()
                            .includes(busqueda.toLowerCase()) && producto.activo
                      )
                      .map((producto) => (
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
                              {producto.tipo} - {producto.precio} USD
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
                ) : (
                  // Vista simple para egresos
                  <div className="space-y-2">
                    {productosServicios
                      .filter(
                        (producto) =>
                          producto.nombre
                            .toLowerCase()
                            .includes(busqueda.toLowerCase()) && producto.activo
                      )
                      .map((producto) => (
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
                              {producto.tipo} - {producto.precio} USD
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
                      ))}
                  </div>
                )}

                {productosServicios.filter(
                  (producto) =>
                    producto.nombre
                      .toLowerCase()
                      .includes(busqueda.toLowerCase()) && producto.activo
                ).length === 0 && (
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
