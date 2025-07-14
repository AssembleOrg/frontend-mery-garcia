import { useState, useEffect } from 'react';
import {
  UnidadNegocio,
  Cliente,
  Personal,
  ItemComanda,
  ProductoServicio,
  Seña,
  MetodoPago,
  Comanda,
} from '@/types/caja';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

export function useComandaForm() {
  // Datos del store
  const {
    personal,
    tipoCambio,
    obtenerPersonalPorUnidad,
    buscarProductosServicios,
  } = useDatosReferencia();

  const { arsToUsd, usdToArs, formatDual } = useCurrencyConverter();

  // Estados del formulario
  const [numeroComanda, setNumeroComanda] = useState('');
  const [unidadNegocio, setUnidadNegocio] = useState<UnidadNegocio | ''>('');
  const [personalPrincipal, setPersonalPrincipal] = useState<Personal | null>(
    null
  );
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    cuit: '',
    telefono: '',
  });
  const [items, setItems] = useState<ItemComanda[]>([]);
  const [seña, setSeña] = useState<Seña | null>(null);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [observaciones, setObservaciones] = useState('');

  // Estados para descuentos globales
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(0);

  // Estados para selección de productos/servicios
  const [mostrarSelectorItems, setMostrarSelectorItems] = useState(false);
  const [busquedaItems, setBusquedaItems] = useState('');
  const [itemsDisponibles, setItemsDisponibles] = useState<ProductoServicio[]>(
    []
  );

  // Personal disponible según unidad de negocio
  const [personalDisponible, setPersonalDisponible] = useState<Personal[]>([]);

  // Actualizar personal disponible global
  useEffect(() => {
    const todos = obtenerPersonalPorUnidad(); // devuelve lista global
    setPersonalDisponible(todos);
    if (todos.length === 1) {
      setPersonalPrincipal(todos[0]);
    }
  }, [obtenerPersonalPorUnidad]);

  // Actualizar items disponibles para búsqueda
  useEffect(() => {
    const items = buscarProductosServicios(
      busquedaItems,
      unidadNegocio || undefined
    );
    setItemsDisponibles(items);
  }, [busquedaItems, unidadNegocio, buscarProductosServicios]);

  // Cálculos en PESOS (moneda base)
  const subtotal = items.reduce(
    (sum, item) => sum + item.precio * item.cantidad,
    0
  );
  const totalDescuentos = items.reduce(
    (sum, item) => sum + (item.descuento || 0),
    0
  );
  const subtotalConDescuentos = subtotal - totalDescuentos;

  // Seña siempre convertida a pesos
  const montoSeña = seña
    ? seña.moneda === 'dolares'
      ? usdToArs(seña.monto)
      : seña.monto
    : 0;

  const saldoPendiente = subtotalConDescuentos - montoSeña;

  // Total final correcto
  const totalFinal = subtotalConDescuentos - montoSeña;

  // Equivalentes en USD para mostrar
  const subtotalUSD = arsToUsd(subtotal);
  const totalFinalUSD = arsToUsd(totalFinal);

  // Acciones
  const agregarItem = (productoServicio: ProductoServicio) => {
    const precioEnARS = usdToArs(productoServicio.precio);

    const nuevoItem: ItemComanda = {
      productoServicioId: productoServicio.id,
      nombre: productoServicio.nombre,
      tipo: productoServicio.tipo,
      precio: precioEnARS,
      precioOriginalUSD: productoServicio.precio,
      cantidad: 1,
      descuento: 0,
      descuentoPorcentaje: 0,
      subtotal: precioEnARS,
    };

    setItems([...items, nuevoItem]);
    setMostrarSelectorItems(false);
    setBusquedaItems('');
  };

  const actualizarItem = (
    index: number,
    campo: keyof ItemComanda,
    valor: string | number | undefined
  ) => {
    const nuevosItems = [...items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };

    // Recalcular subtotal y monto de descuento si cambia alguna dependencia
    if (
      campo === 'cantidad' ||
      campo === 'precio' ||
      campo === 'descuentoPorcentaje'
    ) {
      const item = nuevosItems[index];
      const precioBase = item.precio * item.cantidad;

      // Asegurar que el porcentaje sea un número válido entre 0 y 100
      const porcentaje = Math.max(
        0,
        Math.min(100, item.descuentoPorcentaje ?? 0)
      );
      const descuentoCalculado = (precioBase * porcentaje) / 100;

      item.descuentoPorcentaje = porcentaje;
      item.descuento = descuentoCalculado;
      item.subtotal = precioBase - descuentoCalculado;
    }

    setItems(nuevosItems);
  };

  // Nueva función para aplicar descuento a un ítem específico
  const aplicarDescuentoItem = (index: number, porcentaje: number) => {
    const nuevosItems = [...items];
    const item = nuevosItems[index];
    const precioBase = item.precio * item.cantidad;
    const descuentoCalculado = (precioBase * porcentaje) / 100;

    nuevosItems[index] = {
      ...item,
      descuentoPorcentaje: porcentaje,
      descuento: descuentoCalculado,
      subtotal: precioBase - descuentoCalculado,
    };

    setItems(nuevosItems);
  };

  // Nueva función para eliminar descuento de un ítem específico
  const eliminarDescuentoItem = (index: number) => {
    const nuevosItems = [...items];
    const item = nuevosItems[index];
    const precioBase = item.precio * item.cantidad;

    nuevosItems[index] = {
      ...item,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: precioBase,
    };

    setItems(nuevosItems);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const agregarSeña = () => {
    setSeña({
      monto: 0,
      moneda: 'pesos',
      fecha: new Date(),
      observaciones: '',
    });
  };

  const eliminarSeña = () => {
    setSeña(null);
  };

  const actualizarSeña = (campo: keyof Seña, valor: string | number | Date) => {
    if (seña) {
      setSeña({ ...seña, [campo]: valor });
    }
  };

  // Gestión de métodos de pago
  const agregarMetodoPago = () => {
    const nuevoMetodo: MetodoPago = {
      tipo: 'efectivo',
      monto: 0,
    };
    setMetodosPago([...metodosPago, nuevoMetodo]);
  };

  const actualizarMetodoPago = (
    index: number,
    campo: keyof MetodoPago,
    valor: string | number
  ) => {
    const nuevosMetodos = [...metodosPago];
    nuevosMetodos[index] = { ...nuevosMetodos[index], [campo]: valor };

    setMetodosPago(nuevosMetodos);
  };

  const eliminarMetodoPago = (index: number) => {
    setMetodosPago(metodosPago.filter((_, i) => i !== index));
  };

  // Función mejorada para aplicar descuento global
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
    setDescuentoGlobalPorcentaje(0); // Limpiar el input
  };

  // Función para aplicar descuento a todos los items (legacy)
  const aplicarDescuentoATodos = () => {
    aplicarDescuentoGlobal(descuentoGlobalPorcentaje);
  };

  const limpiarDescuentos = () => {
    const itemsSinDescuento = items.map((item) => ({
      ...item,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: item.precio * item.cantidad,
    }));
    setItems(itemsSinDescuento);
    setDescuentoGlobalPorcentaje(0);
  };

  const validarFormulario = () => {
    const tieneItemsConMetodosPago = items.length > 0 && metodosPago.length > 0;
    const montosPagoCoinciden =
      Math.abs(
        metodosPago.reduce((sum, mp) => sum + mp.monto, 0) - saldoPendiente
      ) < 0.01; // Tolerancia para decimales

    const personalRequerido = personalDisponible.length > 0;

    return !!(
      numeroComanda &&
      unidadNegocio &&
      (!personalRequerido || personalPrincipal) &&
      cliente.nombre &&
      tieneItemsConMetodosPago &&
      montosPagoCoinciden
    );
  };

  const crearComanda = (): Comanda => {
    return {
      id: `comanda-${Date.now()}`,
      numero: numeroComanda,
      fecha: new Date(),
      businessUnit: unidadNegocio as UnidadNegocio,
      mainStaff: personalPrincipal!,
      cliente,
      items,
      seña: seña || undefined,
      metodosPago,
      observaciones,
      estado: 'pendiente',
      subtotal: subtotal,
      totalDescuentos,
      totalSeña: montoSeña,
      totalFinal: totalFinal,
      tipo: 'ingreso',
    };
  };

  const limpiarFormulario = () => {
    setNumeroComanda('');
    setUnidadNegocio('');
    setPersonalPrincipal(null);
    setCliente({ nombre: '', cuit: '', telefono: '' });
    setItems([]);
    setSeña(null);
    setMetodosPago([]);
    setObservaciones('');
    setDescuentoGlobalPorcentaje(0);
  };

  const formatearMonto = (monto: number, mostrarUSD = false) => {
    return formatDual(monto, mostrarUSD);
  };

  return {
    // Estados
    numeroComanda,
    unidadNegocio,
    personalPrincipal,
    cliente,
    items,
    seña,
    metodosPago,
    observaciones,
    mostrarSelectorItems,
    busquedaItems,
    itemsDisponibles,
    personalDisponible,
    tipoCambio,
    descuentoGlobalPorcentaje,

    // Cálculos en PESOS
    subtotal,
    totalDescuentos,
    subtotalConDescuentos,
    montoSeña,
    saldoPendiente,
    totalFinal,

    // Equivalentes en USD
    subtotalUSD,
    totalFinalUSD,

    // Setters
    setNumeroComanda,
    setUnidadNegocio,
    setPersonalPrincipal,
    setCliente,
    setObservaciones,
    setMostrarSelectorItems,
    setBusquedaItems,
    setDescuentoGlobalPorcentaje,

    // Acciones
    agregarItem,
    actualizarItem,
    eliminarItem,
    aplicarDescuentoItem,
    eliminarDescuentoItem,
    agregarSeña,
    eliminarSeña,
    actualizarSeña,
    agregarMetodoPago,
    actualizarMetodoPago,
    eliminarMetodoPago,
    aplicarDescuentoGlobal,
    aplicarDescuentoATodos,
    limpiarDescuentos,
    validarFormulario,
    crearComanda,
    limpiarFormulario,
    formatearMonto,
  };
}
