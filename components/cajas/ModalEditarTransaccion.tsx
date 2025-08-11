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
  Package,
  User,
  DollarSign,
  Lock,
  ChevronDown,
} from 'lucide-react';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { useExchangeRateStore } from '@/features/exchange-rate/store/exchangeRateStore';
import { MONEDAS } from '@/lib/constants';
import { usePersonal } from '@/features/personal/hooks/usePersonal';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { Comanda, ItemComanda, UnidadNegocio, Cliente } from '@/types/caja';
import { useInitializeComandaStore } from '@/hooks/useInitializeComandaStore';
import { useMetodosPago } from '@/hooks/useMetodosPago';
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
  CajaNew,
  ComandaNew,
  ClienteNew,
} from '@/services/unidadNegocio.service';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';
import { useClientesStore } from '@/features/clientes/store/clientesStore';
import ClienteSelector from '@/components/comandas/ClienteSelector';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ModalTransaccionUnificado from './ModalTransaccionUnificado';

interface ModalEditarTransaccionProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
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
  esPrecioCongelado?: boolean;
  precioFijoARS?: number;
  esMontoFijoARS?: boolean;
  responsablesIds: string[];
  mostrarSelectorResponsables?: boolean;
}

export default function ModalEditarTransaccion({
  isOpen,
  onClose,
  comandaId,
}: ModalEditarTransaccionProps) {
  // Store hooks
  const {
    actualizarComanda,
    obtenerComandaPorId,
  } = useComandaStore();

  const { productosServicios, loadProductosServicios } =
    useProductosServiciosStore();
  const { trabajadores, loadTrabajadores } = useTrabajadoresStore();
  const personal = trabajadores;
  const { cargarClientes } = useClientesStore();
  const { handleError } = useErrorHandler();

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

  const { getTipoCambio, cargando } = useExchangeRateStore();
  const { user } = useAuth();

  useInitializeComandaStore();

  // Estados
  const [comanda, setComanda] = useState<ComandaNew | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');

  // Form state
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteNew | null>(null);
  const [clienteProveedor, setClienteProveedor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemTransaccion[]>([]);
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(0);

  // UI state
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados adicionales para cargar todos los datos de la comanda
  const [montoSeñaAplicada, setMontoSeñaAplicada] = useState(0);
  const [monedaSeñaAplicada, setMonedaSeñaAplicada] = useState<'ars' | 'usd' | null>(null);
  const [numeroManual, setNumeroManual] = useState('');
  const [numeroUltimaComanda, setNumeroUltimaComanda] = useState('');
  const [cambiosTemporales, setCambiosTemporales] = useState<{
    metodosPago: any[];
    montoSeñaAplicada: number;
    monedaSeñaAplicada: 'ars' | 'usd' | null;
  }>({
    metodosPago: [],
    montoSeñaAplicada: 0,
    monedaSeñaAplicada: null,
  });

  // Detectar si hay items con precio congelado
  const hayItemsCongelados = useMemo(() => {
    if (tipo === 'ingreso') {
      return items.some((item) => item.esPrecioCongelado);
    } else {
      return items.some((item) => item.esMontoFijoARS);
    }
  }, [items, tipo]);

  // Hook para métodos de pago
  const {
    metodosPago,
    agregarMetodoPago: agregarMetodoPagoBase,
    eliminarMetodoPago,
    actualizarMetodoPago,
    resetMetodosPago,
    validarMetodosPago,
    obtenerResumenDual,
  } = useMetodosPago(tipo === 'ingreso', hayItemsCongelados);



//   const agregarMetodoPago = useCallback(() => {
//     agregarMetodoPagoBase();
//     if (hayItemsCongelados && metodosPago.length >= 0) {
//       const ultimoIndex = metodosPago.length;
//       setTimeout(() => {
//         actualizarMetodoPago(ultimoIndex, 'moneda', MONEDAS.ARS);
//       }, 0);
//     }
//   }, [agregarMetodoPagoBase, hayItemsCongelados, metodosPago.length, actualizarMetodoPago]);

//   // Función para manejar el cambio de monto en métodos de pago
//   const handleMontoMetodoPago = useCallback((index: number, monto: number) => {
//     // Si el usuario pone 450, automáticamente calcular el descuento
//     const metodo = metodosPago[index];
//     if (metodo && monto > 0) {
//       // Actualizar el monto y dejar que el hook calcule automáticamente el descuento
//       actualizarMetodoPago(index, 'monto', monto);
//     }
//   }, [metodosPago, actualizarMetodoPago]);

  // Calcular totales
  const calcularTotales = useCallback(() => {
    const subtotalBase = items.reduce((sum, item) => {
      return sum + (item.precio * item.cantidad);
    }, 0);
    
  const totalDescuentos = items.reduce(
    (sum, item) => sum + (item.descuento || 0),
    0
  );
    
    const subtotalConDescuentosItems = subtotalBase - totalDescuentos;
    const totalPagadoConDescuentos = metodosPago.reduce(
      (sum, metodo) => sum + (metodo.montoFinal || 0),
      0
    );
    
    const diferencia = totalPagadoConDescuentos - subtotalConDescuentosItems;

    return {
      subtotalBase,
      totalDescuentos,
      subtotalConDescuentosItems,
      totalFinal: subtotalConDescuentosItems,
      totalPagadoConDescuentos,
      diferencia,
      descuentosPorMetodo: 0,
    };
  }, [items, metodosPago]);

  // Validar exceso de pago
  const validarExcesoPago = useCallback((totalPagado: number, totalFinal: number) => {
    const diferencia = totalPagado - totalFinal;
    if (diferencia > 0.01) {
      const exceso = Math.abs(diferencia);
      toast.warning(
        `⚠️ Estás cobrando ${formatAmount(exceso)} más del total a pagar.`
      );
      return false;
    }
    return true;
  }, [formatAmount]);

  // Calcular faltante cuando se termina de cargar el método de pago
  const calcularFaltante = useCallback(() => {
    if (metodosPago.length === 0) return;

    const totales = calcularTotales();
    const totalFinal = totales.totalFinal;
    const totalPagado = metodosPago.reduce((sum, mp) => sum + (mp.montoFinal || 0), 0);
    const faltante = totalFinal - totalPagado;

    // Si hay faltante, mostrar toast informativo
    if (faltante > 0.01) {
      // toast.info(`Faltante a pagar: ${formatAmount(faltante)}`);
    } else if (faltante < -0.01) {
      toast.info(`Excedente: ${formatAmount(Math.abs(faltante))}`);
    } else {
      // toast.success('Pago completo');
    }
  }, [metodosPago, calcularTotales, formatAmount]);

//   useModalScrollLock(isOpen);

  // Cargar comanda al abrir el modal
  useEffect(() => {
    if (isOpen && comandaId) {
      cargarComanda();
    }
  }, [isOpen, comandaId]);

  // Cargar todos los datos de la comanda cuando se actualiza
  useEffect(() => {
    if (comanda) {
      setClienteSeleccionado(comanda.cliente || null);
      setClienteProveedor(comanda.cliente?.nombre || '');
      setTelefono(comanda.cliente?.telefono || '');
      setObservaciones(comanda.observaciones || '');
      setItems(comanda.items?.map((item) => {
        return {
          id: item.id || `temp-${Date.now()}`,
          productoServicioId: item.productoServicioId || '',
          nombre: item.nombre || '',
          precio: item.precio || 0,
          cantidad: item.cantidad || 1,
          descuentoPorcentaje: item.descuento || 0,
          descuento: item.descuento || 0,
          subtotal: item.subtotal || 0,
          responsablesIds: item.trabajadorId ? [item.trabajadorId] : [],
          mostrarSelectorResponsables: false,
        };
      }) || []);
      // Los métodos de pago se cargan a través del hook useMetodosPago
      setDescuentoGlobalPorcentaje(comanda.descuentosAplicados?.reduce((sum, descuento) => sum + (descuento.porcentaje || 0), 0) || 0);
      setMontoSeñaAplicada(comanda.metodosPago?.reduce((sum, mp) => {
        return mp.moneda === MonedaNew.ARS ? sum + (mp.montoFinal || 0) : sum;
      }, 0) ?? 0);
      setMonedaSeñaAplicada(comanda.metodosPago?.find((mp) => mp.moneda === MonedaNew.ARS)?.moneda === MonedaNew.ARS ? 'ars' : null);
      setNumeroManual(comanda.numero?.split('-')[1] || '');
      setNumeroUltimaComanda(comanda.numero?.split('-')[1] || '');
      setCambiosTemporales({
        metodosPago: comanda.metodosPago || [],
        montoSeñaAplicada: comanda.metodosPago?.reduce((sum, mp) => {
          return mp.moneda === MonedaNew.ARS ? sum + (mp.montoFinal || 0) : sum;
        }, 0) ?? 0,
        monedaSeñaAplicada: comanda.metodosPago?.find((mp) => mp.moneda === MonedaNew.ARS)?.moneda === MonedaNew.ARS ? 'ars' : null,
      });
    }
  }, [comanda]);

// //   // Cargar datos necesarios
// //   useEffect(() => {
// //     const loadData = async () => {
// //       try {
// //         await Promise.all([
// //           loadTrabajadores(),
// //           cargarClientes(),
// //           loadProductosServicios()
// //         ]);
// //       } catch (error) {
// //         handleError(error, 'cargar datos del modal');
// //       }
// //     };
    
// //     loadData();
// //   }, [loadTrabajadores, cargarClientes, loadProductosServicios, handleError]);

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

  // useEffect para calcular faltante cuando cambian los métodos de pago
  useEffect(() => {
    if (metodosPago.length > 0 && metodosPago.some((mp) => mp.monto > 0)) {
      calcularFaltante();
    }
  }, [metodosPago, calcularFaltante]);


  const cargarComanda = async () => {
    try {
      setIsLoading(true);
      const comandaData = await obtenerComandaPorId(comandaId);
      setComanda(comandaData);
      setTipo(comandaData.tipoDeComanda === TipoDeComandaNew.INGRESO ? 'ingreso' : 'egreso');
      
      // Cargar datos en el formulario
      setClienteSeleccionado(comandaData.cliente);
      setClienteProveedor(comandaData.cliente.nombre);
      setTelefono(comandaData.cliente.telefono || '');
      setObservaciones(comandaData.observaciones || '');
      
      // Convertir items
      const itemsConvertidos = comandaData.items.map(item => ({
        id: item.id || `temp-${Date.now()}`,
        productoServicioId: item.productoServicioId || '',
        nombre: item.nombre || '',
        precio: item.precio || 0,
        cantidad: item.cantidad || 1,
        descuentoPorcentaje: 0,
        descuento: item.descuento || 0,
        subtotal: item.subtotal || 0,
        responsablesIds: item.trabajadorId ? [item.trabajadorId] : [],
        mostrarSelectorResponsables: false,
      }));
      setItems(itemsConvertidos);

      // Cargar métodos de pago existentes
      if (comandaData.metodosPago && comandaData.metodosPago.length > 0) {
        // Resetear métodos de pago primero
        resetMetodosPago();
        
        // Cargar cada método de pago
        comandaData.metodosPago.forEach((metodo, index) => {
          if (index > 0) {
            // Agregar método adicional si no es el primero
            agregarMetodoPagoBase();
          }
          
          const metodoIndex = index;
          if (metodo.tipo) actualizarMetodoPago(metodoIndex, 'tipo', metodo.tipo);
          if (metodo.moneda) actualizarMetodoPago(metodoIndex, 'moneda', metodo.moneda);
          // Cargar el monto final (que ya incluye descuentos aplicados)
          actualizarMetodoPago(metodoIndex, 'monto', metodo.montoFinal || 0);
        });
      }
      
    } catch (error) {
      console.error('Error al cargar comanda:', error);
      toast.error('Error al cargar la comanda');
    } finally {
      setIsLoading(false);
    }
  };

//   if (!isOpen || !comanda) return null;

//   // Verificar si la comanda está validada (no se puede editar)
//   const esComandaValidada = comanda.estadoDeComanda === EstadoDeComandaNew.VALIDADO;

//   const agregarItem = () => {
//     const nuevoItem: ItemTransaccion = {
//       id: `temp-${Date.now()}`,
//       productoServicioId: '',
//       nombre: '',
//       precio: 0,
//       cantidad: 1,
//       descuentoPorcentaje: 0,
//       descuento: 0,
//       subtotal: 0,
//       descripcion: '',
//       responsablesIds: [],
//       mostrarSelectorResponsables: false,
//     };
//     setItems([...items, nuevoItem]);
//   };

//   const agregarDesdeProducto = (producto: ProductoServicioNew) => {
//     // Para productos congelados: NO convertir, usar precio ARS como base
//     // Para productos normales: mantener lógica USD actual
//     let precioBase = producto.precio;
//     let subtotalBase = producto.precio;

//     if (producto.esPrecioCongelado && producto.precioFijoARS) {
//       // Items congelados: usar ARS fijo, sin conversiones
//       precioBase = producto.precioFijoARS;
//       subtotalBase = producto.precioFijoARS;
//     }

//     const nuevoItem: ItemTransaccion = {
//       id: `temp-${Date.now()}`,
//       productoServicioId: producto.id,
//       nombre: producto.nombre,
//       precio: precioBase,
//       cantidad: 1,
//       descuentoPorcentaje: 0,
//       descuento: 0,
//       subtotal: subtotalBase,
//       descripcion: producto.descripcion || '',
//       // Propagar campos de precio congelado
//       esPrecioCongelado: producto.esPrecioCongelado,
//       precioFijoARS: producto.precioFijoARS,
//       responsablesIds: [],
//       mostrarSelectorResponsables: false,
//     };
//     setItems([...items, nuevoItem]);
//     setMostrarBuscador(false);
//     setBusqueda('');
//   };

//   const eliminarItem = (id: string) => {
//     setItems(items.filter((item) => item.id !== id));
//   };

//   const actualizarItem = (
//     id: string,
//     campo: keyof ItemTransaccion,
//     valor: string | number | boolean | string[]
//   ) => {
//     setItems(
//       items.map((item) => {
//         if (item.id === id) {
//           const updatedItem = { ...item, [campo]: valor };

//           // Recalcular subtotal y descuento
//           if (
//             campo === 'cantidad' ||
//             campo === 'precio' ||
//             campo === 'descuentoPorcentaje'
//           ) {
//             const precioBase = updatedItem.precio * updatedItem.cantidad;
//             const porcentaje = Math.max(0, Math.min(100, updatedItem.descuentoPorcentaje));
//             const descuentoCalculado = (precioBase * porcentaje) / 100;

//             updatedItem.descuentoPorcentaje = porcentaje;
//             updatedItem.descuento = descuentoCalculado;
//             updatedItem.subtotal = precioBase - descuentoCalculado;
//           }

//           return updatedItem;
//         }
//         return item;
//       })
//     );
//   };



//   // useEffect para calcular faltante cuando cambian los métodos de pago
//   useEffect(() => {
//     if (metodosPago.length > 0 && metodosPago.some((mp) => mp.monto > 0)) {
//       calcularFaltante();
//     }
//   }, [metodosPago, calcularFaltante]);

//   // Calcular totales
//   const totales = calcularTotales();

//   // Validar formulario
//   const validarFormulario = (): boolean => {
//     const nuevosErrores: Record<string, string> = {};

//     if (!clienteProveedor.trim()) {
//       nuevosErrores.clienteProveedor = 'El cliente es requerido';
//       toast.error('El cliente es requerido');
//       return false;
//     }

//     if (items.length === 0) {
//       nuevosErrores.items = 'Debe agregar al menos un item';
//       toast.error('Debe agregar al menos un item');
//       return false;
//     }

//     // Validar items
//     items.forEach((item, index) => {
//       if (!item.nombre.trim()) {
//         nuevosErrores[`item-${index}-nombre`] = 'El nombre es requerido';
//         return false;
//       }
//       if (item.precio <= 0) {
//         nuevosErrores[`item-${index}-precio`] = 'El precio debe ser mayor a 0';
//         return false;
//       }
//       if (item.cantidad <= 0) {
//         nuevosErrores[`item-${index}-cantidad`] = 'La cantidad debe ser mayor a 0';
//         return false;
//       }
//     });

//     const validacionMetodos = validarMetodosPago(totales.totalFinal);
//     if (!validacionMetodos.esValido && validacionMetodos.error) {
//       nuevosErrores.pagos = validacionMetodos.error;
//       return false;
//     }

//     setErrores(nuevosErrores);
//     return Object.keys(nuevosErrores).length === 0;
//   };

//   // Guardar cambios
//   const handleSave = async () => {
//     if (!validarFormulario()) return;
//     setGuardando(true);

//     try {
//       // Preparar datos para actualizar usando ComandaUpdateNew
//       const comandaUpdate: ComandaUpdateNew = {
//         clienteId: comanda.cliente.id,
//         observaciones,
//         items: items.map((item) => {
//             return {
//               productoServicioId: item.productoServicioId,
//               nombre: item.nombre,
//               tipo: tipo === 'ingreso' ? TipoItemNew.INGRESO : TipoItemNew.EGRESO,
//               precio: item.precio,
//               cantidad: item.cantidad,
//               descuento: item.descuento,
//               trabajadorId: item.responsablesIds[0],
//               subtotal: item.subtotal,
//             };
//           }),
//         metodosPago: metodosPago.map((m) => {
//             return {
//               tipo: m.tipo as TipoPagoNew,
//               monto: m.monto,
//               montoFinal: m.montoFinal,
//               descuentoGlobalPorcentaje: 100 - (m.montoFinal / m.monto) * 100,
//               moneda: m.moneda as MonedaNew,
//               recargoPorcentaje: 0,
//             };
//           }),
//       };

//       await actualizarComanda(comandaId, comandaUpdate);
//       toast.success('Transacción actualizada correctamente');
//       onClose();
//     } catch (error) {
//       console.error('Error al actualizar transacción:', error);
//       toast.error('Error al actualizar la transacción');
//     } finally {
//       setGuardando(false);
//     }
//   };

//   const handleOverlayClick = (e: React.MouseEvent) => {
//     if (e.target === e.currentTarget) {
//       onClose();
//     }
//   };

  useEffect(() => {
    if (isOpen) {
      cargarComanda();
    }
  }, [isOpen]);

  return (
    // <div
    //   className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    //   onClick={handleOverlayClick}
    // >
    //   <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-2xl">
    //     {/* Header */}
    //     <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm">
    //       <div className="flex items-center justify-between p-6">
    //         <div className="flex items-center gap-3">
    //           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] shadow-sm">
    //             {tipo === 'ingreso' ? (
    //               <ArrowUpCircle className="h-5 w-5 text-white" />
    //             ) : (
    //               <ArrowDownCircle className="h-5 w-5 text-white" />
    //             )}
    //           </div>
    //           <div>
    //             <h2 className="text-xl font-semibold text-gray-900">
    //               Editar {tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
    //             </h2>
    //             <p className="text-sm text-gray-600">
    //               Comanda #{comanda.numero} - {comanda.estadoDeComanda}
    //             </p>
    //           </div>
    //         </div>
    //         <div className="flex items-center gap-3">
    //           {isExchangeRateValid && (
    //             <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-100 to-gray-150 px-3 py-2 shadow-sm">
    //               <TrendingUp className="h-4 w-4 text-gray-600" />
    //               <span className="text-sm font-medium text-gray-800">
    //                 USD: {formatDual(0, false)}
    //               </span>
    //             </div>
    //           )}
    //           <Button
    //             variant="ghost"
    //             size="sm"
    //             onClick={onClose}
    //             className="text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    //           >
    //             <X className="h-5 w-5" />
    //           </Button>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Content */}
    //     <div className="bg-gradient-to-br from-gray-100/50 to-gray-50/30 p-6">
    //       <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    //         {/* Left Column - Form */}
    //         <div className="space-y-6 lg:col-span-2">
    //           {/* Basic Info */}
    //           <Card className="border border-gray-300 bg-white shadow-md">
    //             <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
    //               <CardTitle className="text-lg text-gray-900">
    //                 Información Básica
    //               </CardTitle>
    //             </CardHeader>
    //             <CardContent className="space-y-4">
    //               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    //                 {/* Número de comanda (solo lectura) */}
    //                 <div className="md:col-span-2">
    //                   <Label className="mb-2 block font-medium text-gray-700">
    //                     Número de Comanda
    //                   </Label>
    //                   <div className="flex items-center gap-2">
    //                     <div className="flex items-center gap-1 rounded-md border bg-gray-100 px-3 py-2">
    //                       <Hash className="h-4 w-4 text-gray-500" />
    //                       <span className="text-sm font-medium text-gray-700">
    //                         {comanda.numero}
    //                       </span>
    //                     </div>
    //                     <Badge variant="outline" className="text-xs">
    //                       {comanda.estadoDeComanda}
    //                     </Badge>
    //                   </div>
    //                 </div>

    //                 {/* Selector de cliente - Solo para ingresos */}
    //                 {tipo === 'ingreso' && (
    //                   <div className="md:col-span-2">
    //                     <ClienteSelector
    //                       clienteSeleccionado={clienteSeleccionado}
    //                       onClienteChange={(cliente) => {
    //                         setClienteSeleccionado(cliente);
    //                         if (cliente) {
    //                           setClienteProveedor(cliente.nombre);
    //                           setTelefono(cliente.telefono || '');
    //                         } else {
    //                           setClienteProveedor('');
    //                           setTelefono('');
    //                         }
    //                       }}
    //                       required={true}
    //                       disabled={!esComandaValidada}
    //                     />
    //                     {errores.clienteProveedor && (
    //                       <p className="mt-1 text-xs text-red-600">
    //                         {errores.clienteProveedor}
    //                       </p>
    //                     )}
    //                   </div>
    //                 )}

    //                 {tipo === 'ingreso' && (
    //                   <div>
    //                     <Label className="text-gray-700">Teléfono</Label>
    //                     <Input
    //                       value={telefono}
    //                       onChange={(e) => setTelefono(e.target.value)}
    //                       placeholder="Teléfono"
    //                       className="border-gray-300"
    //                       readOnly={!esComandaValidada}
    //                     />
    //                   </div>
    //                 )}

    //                 <div className="md:col-span-2">
    //                   <Label className="text-gray-700">Observaciones</Label>
    //                   <Textarea
    //                     value={observaciones}
    //                     onChange={(e) => setObservaciones(e.target.value)}
    //                     placeholder="Observaciones adicionales"
    //                     rows={3}
    //                     className="border-gray-300"
    //                     readOnly={!esComandaValidada}
    //                   />
    //                 </div>
    //               </div>
    //             </CardContent>
    //           </Card>

    //           {/* Items */}
    //           <Card className="border border-gray-300 bg-white shadow-md">
    //             <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
    //               <CardTitle className="flex items-center justify-between text-lg text-gray-900">
    //                 <span>
    //                   {tipo === 'ingreso'
    //                     ? 'Servicios y Productos'
    //                     : 'Conceptos del Egreso'}
    //                 </span>
    //                 <div className="flex gap-2">
    //                   {tipo === 'ingreso' && esComandaValidada && (
    //                     <Button
    //                       type="button"
    //                       variant="outline"
    //                       size="sm"
    //                       onClick={() => setMostrarBuscador(true)}
    //                       className="border-gray-300 text-gray-700 hover:bg-gray-50"
    //                     >
    //                       <Search className="mr-2 h-4 w-4" />
    //                       Buscar
    //                     </Button>
    //                   )}
    //                   {esComandaValidada && (
    //                     <Button
    //                       type="button"
    //                       variant="outline"
    //                       size="sm"
    //                       onClick={agregarItem}
    //                       className="border-[#f9bbc4] bg-[#f9bbc4] font-medium text-white hover:bg-[#e292a3]"
    //                     >
    //                       <Plus className="mr-2 h-4 w-4" />
    //                       Agregar
    //                     </Button>
    //                   )}
    //                 </div>
    //               </CardTitle>
    //             </CardHeader>
    //             <CardContent className="space-y-4">
    //               {items.length === 0 ? (
    //                 <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-100 to-gray-150 p-8 text-center shadow-sm">
    //                   <Calculator className="mx-auto h-12 w-12 text-gray-400" />
    //                   <p className="mt-2 text-sm text-gray-600">
    //                     {tipo === 'ingreso'
    //                       ? 'No hay servicios agregados'
    //                       : 'No hay conceptos agregados'}
    //                   </p>
    //                   <p className="text-xs text-gray-500">
    //                     Haga clic en &quot;Agregar&quot; para comenzar
    //                   </p>
    //                 </div>
    //               ) : (
    //                 items.map((item, index) => (
    //                   <div
    //                     key={item.id}
    //                     className="rounded-lg border-2 border-gray-300 bg-gradient-to-r from-white to-gray-50 p-4 shadow-md"
    //                   >
    //                     <div className="mb-3 flex items-center justify-between">
    //                       <Badge variant="outline" className="text-gray-700">
    //                         {tipo === 'ingreso' ? 'Servicio' : 'Concepto'} #{index + 1}
    //                       </Badge>
    //                       {esComandaValidada && (
    //                         <Button
    //                           type="button"
    //                           variant="ghost"
    //                           size="sm"
    //                           onClick={() => eliminarItem(item.id)}
    //                           className="text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    //                         >
    //                           <Trash2 className="h-4 w-4" />
    //                         </Button>
    //                       )}
    //                     </div>

    //                     <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
    //                       <div>
    //                         <Label className="text-gray-700">Nombre *</Label>
    //                         <Input
    //                           value={item.nombre}
    //                           onChange={(e) =>
    //                             actualizarItem(item.id, 'nombre', e.target.value)
    //                           }
    //                           placeholder="Nombre del item"
    //                           className={
    //                             errores[`item-${index}-nombre`]
    //                               ? 'border-red-500'
    //                               : 'border-gray-300'
    //                           }
    //                           readOnly={!esComandaValidada}
    //                         />
    //                         {errores[`item-${index}-nombre`] && (
    //                           <p className="mt-1 text-xs text-red-600">
    //                             {errores[`item-${index}-nombre`]}
    //                           </p>
    //                         )}
    //                       </div>

    //                       <div>
    //                         <Label className="text-gray-700">Precio *</Label>
    //                         <Input
    //                           type="number"
    //                           min="0"
    //                           step="0.01"
    //                           value={item.precio || ''}
    //                           onChange={(e) =>
    //                             actualizarItem(
    //                               item.id,
    //                               'precio',
    //                               parseFloat(e.target.value) || 0
    //                             )
    //                           }
    //                           placeholder="0.00"
    //                           className={
    //                             errores[`item-${index}-precio`]
    //                               ? 'border-red-500'
    //                               : 'border-gray-300'
    //                           }
    //                           readOnly={!esComandaValidada}
    //                         />
    //                         {errores[`item-${index}-precio`] && (
    //                           <p className="mt-1 text-xs text-red-600">
    //                             {errores[`item-${index}-precio`]}
    //                           </p>
    //                         )}
    //                       </div>

    //                       <div>
    //                         <Label className="text-gray-700">Cantidad *</Label>
    //                         <Input
    //                           type="number"
    //                           min="1"
    //                           value={item.cantidad || ''}
    //                           onChange={(e) =>
    //                             actualizarItem(
    //                               item.id,
    //                               'cantidad',
    //                               parseInt(e.target.value) || 1
    //                             )
    //                           }
    //                           className={
    //                             errores[`item-${index}-cantidad`]
    //                               ? 'border-red-500'
    //                               : 'border-gray-300'
    //                           }
    //                           readOnly={!esComandaValidada}
    //                         />
    //                         {errores[`item-${index}-cantidad`] && (
    //                           <p className="mt-1 text-xs text-red-600">
    //                             {errores[`item-${index}-cantidad`]}
    //                           </p>
    //                         )}
    //                       </div>

    //                       <div>
    //                         <Label className="text-gray-700">Subtotal</Label>
    //                         <div className="flex h-10 items-center justify-between rounded-md border-2 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-150 px-3">
    //                           <span className="text-xs text-gray-600">
    //                             {item.subtotal} (USD)
    //                           </span>
    //                         </div>
    //                       </div>
    //                     </div>
    //                   </div>
    //                 ))
    //               )}

    //               {errores.items && (
    //                 <p className="text-sm text-red-600">{errores.items}</p>
    //               )}
    //             </CardContent>
    //           </Card>

    //           {/* Métodos de Pago - Solo para ingresos */}
    //           {tipo === 'ingreso' && (
    //             <div className="space-y-4">
    //               <div className="flex items-center justify-between">
    //                 <h3 className="text-lg font-semibold text-gray-900">
    //                   Métodos de Pago
    //                 </h3>
    //               </div>

    //               <MetodosPagoSection
    //                 metodosPago={metodosPago}
    //                 totalPagado={totales.totalPagadoConDescuentos}
    //                 montoTotal={totales.totalFinal}
    //                 onAgregarMetodo={agregarMetodoPago}
    //                 onEliminarMetodo={eliminarMetodoPago}
    //                 onActualizarMetodo={actualizarMetodoPago}
    //                 obtenerResumenDual={obtenerResumenDual}
    //                 hayItemsCongelados={hayItemsCongelados}
    //               />
    //             </div>
    //           )}

    //           {errores.pagos && (
    //             <div className="mt-2">
    //               <p className="text-sm text-red-600">{errores.pagos}</p>
    //             </div>
    //           )}
    //         </div>

    //         {/* Right Column - Summary */}
    //         <div className="space-y-6">
    //           <div className="sticky top-24 space-y-6">
    //             <Card className="border border-gray-300 bg-white shadow-md">
    //               <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
    //                 <CardTitle className="text-lg text-gray-900">
    //                   Resumen
    //                 </CardTitle>
    //               </CardHeader>
    //               <CardContent className="space-y-4">
    //                 <div className="space-y-3">
    //                   {/* Subtotal base */}
    //                   <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
    //                     <div className="text-sm text-gray-700">
    //                       Subtotal base
    //                     </div>
    //                     <div className="text-right">
    //                       <div className="text-sm font-semibold text-gray-900">
    //                         {formatAmount(totales.subtotalBase)}
    //                       </div>
    //                       {isExchangeRateValid && totales.subtotalBase > 0 && (
    //                         <div className="text-xs text-gray-600">
    //                           {formatARS(totales.subtotalBase)}
    //                         </div>
    //                       )}
    //                     </div>
    //                   </div>

    //                   {/* Descuentos por ítem */}
    //                   {totales.totalDescuentos > 0 && (
    //                     <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-orange-100 to-orange-200 p-3 shadow-sm">
    //                       <div className="text-sm text-orange-700">
    //                         Descuentos por ítem
    //                       </div>
    //                       <div className="text-right">
    //                         <div className="text-sm font-semibold text-orange-700">
    //                           -{formatAmount(totales.totalDescuentos)}
    //                         </div>
    //                         {isExchangeRateValid && totales.totalDescuentos > 0 && (
    //                           <div className="text-xs text-orange-600">
    //                             -{formatARS(totales.totalDescuentos)}
    //                           </div>
    //                         )}
    //                       </div>
    //                     </div>
    //                   )}

    //                   {/* Total a pagar */}
    //                   <div className="flex items-center justify-between rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-200 p-3 shadow-md">
    //                     <div className="text-sm font-medium text-blue-900">
    //                       Total a pagar
    //                     </div>
    //                     <div className="text-right">
    //                       <div className="text-base font-bold text-blue-900">
    //                         {formatAmount(totales.totalFinal)}
    //                       </div>
    //                       {isExchangeRateValid && totales.totalFinal > 0 && (
    //                         <div className="text-sm text-blue-700">
    //                           {formatARS(totales.totalFinal)}
    //                         </div>
    //                       )}
    //                     </div>
    //                   </div>

    //                   {/* Total pagado */}
    //                   <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-100 to-green-200 p-3 shadow-sm">
    //                     <div className="text-sm text-green-700">
    //                       Total pagado
    //                     </div>
    //                     <div className="text-right">
    //                       <div className="text-sm font-semibold text-green-700">
    //                         {formatAmount(totales.totalPagadoConDescuentos)}
    //                       </div>
    //                       {isExchangeRateValid && totales.totalPagadoConDescuentos > 0 && (
    //                         <div className="text-xs text-green-600">
    //                           {formatARS(totales.totalPagadoConDescuentos)}
    //                         </div>
    //                       )}
    //                     </div>
    //                   </div>

    //                   {/* Diferencia/Balance */}
    //                   <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 p-3 shadow-sm">
    //                     <div className="text-sm text-gray-700">Balance</div>
    //                     <div className="text-right">
    //                       <div
    //                         className={`text-sm font-semibold ${
    //                           Math.abs(totales.diferencia) < 0.01
    //                             ? 'text-green-600'
    //                             : totales.diferencia > 0
    //                               ? 'text-blue-600'
    //                               : 'text-red-600'
    //                         }`}
    //                       >
    //                         {Math.abs(totales.diferencia) < 0.01
    //                           ? '✓ Balanceado'
    //                           : totales.diferencia > 0
    //                             ? `+${formatAmount(totales.diferencia)} (exceso)`
    //                             : `${formatAmount(totales.diferencia)} (faltante)`}
    //                       </div>
    //                       {isExchangeRateValid && Math.abs(totales.diferencia) > 0.01 && (
    //                         <div className="text-xs text-gray-600">
    //                           {totales.diferencia > 0 ? '+' : ''}{formatARS(totales.diferencia)}
    //                         </div>
    //                       )}
    //                     </div>
    //                   </div>
    //                 </div>
    //               </CardContent>
    //             </Card>

    //             {/* Actions */}
    //             <Card className="border border-gray-300 bg-white shadow-md">
    //               <CardContent className="pt-6">
    //                 <div className="space-y-3">
    //                   <Button
    //                     onClick={handleSave}
    //                     disabled={guardando || cargando || !esComandaValidada}
    //                     className="w-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] font-medium text-white hover:from-[#e292a3] hover:to-[#d4a7ca]"
    //                   >
    //                     {guardando ? (
    //                       <>
    //                         <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
    //                         Guardando...
    //                       </>
    //                     ) : (
    //                       <>
    //                         <Save className="mr-2 h-4 w-4" />
    //                         Guardar Cambios
    //                       </>
    //                     )}
    //                   </Button>

    //                   <Button
    //                     variant="outline"
    //                     onClick={onClose}
    //                     className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
    //                   >
    //                     Cancelar
    //                   </Button>
    //                 </div>

    //                 {errores.general && (
    //                   <p className="mt-3 text-center text-sm text-red-600">
    //                     {errores.general}
    //                   </p>
    //                 )}
    //               </CardContent>
    //             </Card>
    //           </div>
    //         </div>
    //                  </div>
    //      </div>
    //    </div>

    //    {/* Product Search Modal */}
    //    {mostrarBuscador && (
    //      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
    //        <div className="w-full max-w-3xl rounded-lg border border-gray-100 bg-white shadow-2xl">
    //          <div className="border-b p-4">
    //            <div className="flex items-center justify-between">
    //              <h3 className="text-lg font-semibold text-gray-900">
    //                Buscar Productos/Servicios
    //              </h3>
    //              <Button
    //                variant="ghost"
    //                size="sm"
    //                onClick={() => setMostrarBuscador(false)}
    //                className="text-gray-500 hover:text-gray-700"
    //              >
    //                <X className="h-5 w-5" />
    //              </Button>
    //            </div>
    //            <div className="mt-4">
    //              <Input
    //                value={busqueda}
    //                onChange={(e) => setBusqueda(e.target.value)}
    //                placeholder="Buscar por nombre..."
    //                className="border-gray-300"
    //                autoFocus
    //              />
    //            </div>
    //          </div>
    //          <div className="max-h-96 overflow-y-auto p-4">
    //            <div className="space-y-6">
    //              {tipo === 'ingreso' ? (
    //                // Vista agrupada para ingresos
    //                <div className="space-y-2">
    //                  {productosServicios
    //                    .filter(
    //                      (producto) =>
    //                        producto.nombre
    //                          .toLowerCase()
    //                          .includes(busqueda.toLowerCase()) && producto.activo
    //                    )
    //                    .map((producto) => (
    //                      <div
    //                        key={producto.id}
    //                        className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
    //                        onClick={() => agregarDesdeProducto(producto)}
    //                      >
    //                        <div className="flex-1">
    //                          <div className="flex items-center gap-2 font-medium text-gray-900">
    //                            {producto.nombre}
    //                            {producto.esPrecioCongelado && (
    //                              <Badge variant="outline" className="text-xs">
    //                                🔒 Precio fijo
    //                              </Badge>
    //                            )}
    //                          </div>
    //                          <div className="text-sm text-gray-600">
    //                            {producto.tipo} -{' '}
    //                            {producto.esPrecioCongelado &&
    //                            producto.precioFijoARS
    //                              ? `${formatARSFromNative(producto.precioFijoARS)} ARS`
    //                              : `${producto.precio} USD`}
    //                          </div>
    //                          {producto.descripcion && (
    //                            <div className="mt-1 text-xs text-gray-500">
    //                              {producto.descripcion}
    //                            </div>
    //                          )}
    //                        </div>
    //                        <Button
    //                          size="sm"
    //                          variant="outline"
    //                          className="border-[#f9bbc4] text-[#8b5a6b] hover:bg-[#f9bbc4] hover:text-white"
    //                        >
    //                          Agregar
    //                        </Button>
    //                      </div>
    //                    ))}
    //                </div>
    //              ) : (
    //                // Vista simple para egresos
    //                <div className="space-y-2">
    //                  {productosServicios
    //                    .filter(
    //                      (producto) =>
    //                        producto.nombre
    //                          .toLowerCase()
    //                          .includes(busqueda.toLowerCase()) && producto.activo
    //                    )
    //                    .map((producto) => (
    //                      <div
    //                        key={producto.id}
    //                        className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
    //                        onClick={() => agregarDesdeProducto(producto)}
    //                      >
    //                        <div>
    //                          <div className="flex items-center gap-2 font-medium text-gray-900">
    //                            {producto.nombre}
    //                            {producto.esPrecioCongelado && (
    //                              <Badge variant="outline" className="text-xs">
    //                                🔒 Precio fijo
    //                              </Badge>
    //                            )}
    //                          </div>
    //                          <div className="text-sm text-gray-600">
    //                            {producto.tipo} -{' '}
    //                            {producto.esPrecioCongelado &&
    //                            producto.precioFijoARS
    //                              ? `${formatARSFromNative(producto.precioFijoARS)} ARS`
    //                              : `${producto.precio} USD`}
    //                          </div>
    //                        </div>
    //                        <Button
    //                          size="sm"
    //                          variant="outline"
    //                          className="border-gray-300"
    //                        >
    //                          Agregar
    //                        </Button>
    //                      </div>
    //                    ))}
    //                </div>
    //              )}

    //              {productosServicios.filter(
    //                (producto) =>
    //                  producto.nombre
    //                    .toLowerCase()
    //                    .includes(busqueda.toLowerCase()) && producto.activo
    //              ).length === 0 && (
    //                <div className="py-8 text-center text-gray-500">
    //                  <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
    //                  <p>No se encontraron productos/servicios</p>
    //                  <p className="mt-1 text-sm text-gray-400">
    //                    Intenta con otros términos de búsqueda
    //                  </p>
    //                </div>
    //              )}
    //            </div>
    //          </div>
    //        </div>
    //      </div>
    //    )}
    //  </div>
    <ModalTransaccionUnificado
      isOpen={isOpen}
      onClose={onClose}
      comandaId={comandaId}
      tipo={tipo}
    />
   );
 } 