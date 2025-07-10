import { useState, useEffect } from 'react';
import {
  UnidadNegocio,
  Cliente,
  Personal,
  ItemComanda,
  ProductoServicio,
  Seña,
  MetodoPago,
  Comision,
  Comanda,
} from '@/types/caja';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

export function useComandaForm() {
  // Datos del store
  const {
    personal,
    tipoCambio,
    configuracionRecargos,
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
  const [aplicarDescuentoGlobal, setAplicarDescuentoGlobal] = useState(false);

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

  // Aplicar descuento global cuando se activa
  useEffect(() => {
    if (aplicarDescuentoGlobal && descuentoGlobalPorcentaje > 0) {
      const itemsConDescuento = items.map((item) => {
        const descuentoCalculado =
          (item.precio * item.cantidad * descuentoGlobalPorcentaje) / 100;
        return {
          ...item,
          descuentoPorcentaje: descuentoGlobalPorcentaje,
          descuento: descuentoCalculado,
          subtotal: item.precio * item.cantidad - descuentoCalculado,
        };
      });
      setItems(itemsConDescuento);
    }
  }, [aplicarDescuentoGlobal, descuentoGlobalPorcentaje, items]);

  // Cálculos en PESOS (moneda base)
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDescuentos = items.reduce((sum, item) => sum + item.descuento, 0);
  const totalSinSeña = subtotal - totalDescuentos;

  // Seña siempre convertida a pesos
  const montoSeña = seña
    ? seña.moneda === 'dolares'
      ? usdToArs(seña.monto)
      : seña.monto
    : 0;

  const saldoPendiente = totalSinSeña - montoSeña;

  // Calcular recargos por métodos de pago - CORREGIDO
  const totalRecargos = metodosPago.reduce(
    (sum, mp) => sum + (mp.monto * mp.recargoPorcentaje) / 100,
    0
  );

  // CORRECCIÓN: El total final debe incluir el subtotal base más los recargos
  const totalFinal = subtotal + totalRecargos - totalDescuentos - montoSeña;

  // Equivalentes en USD para mostrar
  const subtotalUSD = arsToUsd(subtotal);
  const totalFinalUSD = arsToUsd(totalFinal);

  // Acciones
  const agregarItem = (productoServicio: ProductoServicio) => {
    const nuevoItem: ItemComanda = {
      productoServicioId: productoServicio.id,
      nombre: productoServicio.nombre,
      tipo: productoServicio.tipo,
      precio: productoServicio.precio,
      cantidad: 1,
      descuento: 0,
      descuentoPorcentaje: 0,
      subtotal: productoServicio.precio,
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

      // Asegurar que el porcentaje sea un número válido entre 0 y 100
      const porcentaje = item.descuentoPorcentaje ?? 0;
      const descuentoCalculado =
        (item.precio * item.cantidad * porcentaje) / 100;

      item.descuento = descuentoCalculado;
      item.subtotal = item.precio * item.cantidad - descuentoCalculado;
    }

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
      recargoPorcentaje: 0,
      montoFinal: 0,
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

    // Calcular recargo automáticamente
    if (campo === 'tipo' || campo === 'monto') {
      const metodo = nuevosMetodos[index];
      const configRecargo = configuracionRecargos.find(
        (c) => c.metodoPago === metodo.tipo && c.activo
      );

      if (configRecargo && metodo.tipo !== 'efectivo') {
        metodo.recargoPorcentaje = configRecargo.porcentaje;
        metodo.montoFinal = metodo.monto * (1 + configRecargo.porcentaje / 100);
      } else {
        metodo.recargoPorcentaje = 0;
        metodo.montoFinal = metodo.monto;
      }
    }

    setMetodosPago(nuevosMetodos);
  };

  const eliminarMetodoPago = (index: number) => {
    setMetodosPago(metodosPago.filter((_, i) => i !== index));
  };

  // Función para aplicar descuento a todos los items
  const aplicarDescuentoATodos = () => {
    if (!descuentoGlobalPorcentaje || descuentoGlobalPorcentaje <= 0) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        const descuentoCalculado =
          (item.precio * item.cantidad * descuentoGlobalPorcentaje) / 100;
        const nuevoSubtotal = item.precio * item.cantidad - descuentoCalculado;

        return {
          ...item,
          descuentoPorcentaje: descuentoGlobalPorcentaje,
          descuento: descuentoCalculado,
          subtotal: nuevoSubtotal,
        };
      })
    );

    // Limpiar el valor del descuento global después de aplicar
    setDescuentoGlobalPorcentaje(0);
  };

  const limpiarDescuentos = () => {
    const itemsSinDescuento = items.map((item) => ({
      ...item,
      descuentoPorcentaje: 0,
      descuento: 0,
      subtotal: item.precio * item.cantidad,
    }));
    setItems(itemsSinDescuento);
    setAplicarDescuentoGlobal(false);
    setDescuentoGlobalPorcentaje(0);
  };

  const calcularComisiones = (): Comision[] => {
    const comisiones: Comision[] = [];

    items.forEach((item, index) => {
      if (item.personalId) {
        const personalEncontrado = personal.find(
          (p: Personal) => p.id === item.personalId
        );
        if (personalEncontrado) {
          const montoBase = item.subtotal;
          const montoComision =
            montoBase * (personalEncontrado.comisionPorcentaje / 100);

          comisiones.push({
            personalId: personalEncontrado.id,
            personalNombre: personalEncontrado.nombre,
            itemComandaId: `item-${index}`,
            montoBase,
            porcentaje: personalEncontrado.comisionPorcentaje,
            montoComision,
          });
        }
      }
    });

    return comisiones;
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
      subtotal: subtotal, // Subtotal SIN recargos
      totalDescuentos,
      totalRecargos, // Recargos calculados correctamente
      totalSeña: montoSeña,
      totalFinal: subtotal + totalRecargos - totalDescuentos - montoSeña, // Total CORRECTO
      comisiones: calcularComisiones(),
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
    setAplicarDescuentoGlobal(false);
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
    configuracionRecargos,
    descuentoGlobalPorcentaje,
    aplicarDescuentoGlobal,

    // Cálculos en PESOS
    subtotal,
    totalDescuentos,
    totalSinSeña,
    montoSeña,
    saldoPendiente,
    totalRecargos,
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
    setAplicarDescuentoGlobal,

    // Acciones
    agregarItem,
    actualizarItem,
    eliminarItem,
    agregarSeña,
    eliminarSeña,
    actualizarSeña,
    agregarMetodoPago,
    actualizarMetodoPago,
    eliminarMetodoPago,
    aplicarDescuentoATodos,
    limpiarDescuentos,
    validarFormulario,
    crearComanda,
    limpiarFormulario,
    formatearMonto,
  };
}
