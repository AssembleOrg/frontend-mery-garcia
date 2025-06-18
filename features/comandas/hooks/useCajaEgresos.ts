import { useMemo } from 'react';
import {
  useComandas,
  useResumenCaja,
  useFiltrosComanda,
} from '../store/comandaStore';
import { Encomienda } from '@/types/caja';
import { usePaginacion } from './usePaginacion';
import { DateRange } from 'react-day-picker';

// Formatear monto una sola vez
const formatearMonto = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

export function useCajaEgresos(dateRange?: DateRange) {
  const { comandas } = useComandas();
  const { filtros, actualizarFiltros } = useFiltrosComanda();
  const { resumen } = useResumenCaja();

  // Función para verificar si una fecha está en el rango
  const estaEnRangoFecha = useMemo(() => {
    return (fecha: Date | string) => {
      if (!dateRange?.from) return true;

      const fechaComanda = new Date(fecha);
      const fechaInicio = new Date(dateRange.from);
      const fechaFin = dateRange.to
        ? new Date(dateRange.to)
        : new Date(dateRange.from);

      // Normalizar fechas a medianoche para comparación
      fechaComanda.setHours(0, 0, 0, 0);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);

      return fechaComanda >= fechaInicio && fechaComanda <= fechaFin;
    };
  }, [dateRange]);

  // Memoizar filtrado de egresos con filtro de fecha
  const egresosData = useMemo(() => {
    return comandas.filter(
      (comanda) => comanda.tipo === 'egreso' && estaEnRangoFecha(comanda.fecha)
    );
  }, [comandas, estaEnRangoFecha]);

  // Memoizar conversión a formato legacy (optimizado)
  const datosEgresos = useMemo((): Encomienda[] => {
    return egresosData.map((comanda) => ({
      id: comanda.id,
      fecha: comanda.fecha,
      numero: comanda.numero,
      cliente: comanda.cliente.nombre,
      telefono: comanda.cliente.telefono,
      servicios: comanda.items,
      subtotal: comanda.subtotal,
      descuentoTotal: comanda.totalDescuentos,
      iva: Math.round(comanda.totalFinal * 0.13 * 100) / 100, // IVA redondeado
      total: comanda.totalFinal,
      metodoPago:
        comanda.metodosPago.length === 1
          ? comanda.metodosPago[0].tipo
          : 'mixto',
      observaciones: comanda.observaciones || '',
      vendedor: comanda.personalPrincipal.nombre,
      estado: comanda.estado,
      tipo: comanda.tipo,
    }));
  }, [egresosData]);

  // Memoizar estadísticas (optimizado)
  const estadisticas = useMemo(() => {
    const cantidadTransacciones = datosEgresos.length;
    const cantidadProveedores = new Set(
      datosEgresos.map((item) => item.cliente)
    ).size;

    // Optimizar cálculo de conceptos más frecuentes
    const conceptosMasFrecuentes = datosEgresos.reduce(
      (acc, item) => {
        item.servicios.forEach((servicio) => {
          const key = servicio.nombre;
          acc[key] = (acc[key] || 0) + (servicio.cantidad || 1);
        });
        return acc;
      },
      {} as Record<string, number>
    );

    const conceptoTop = Object.entries(conceptosMasFrecuentes).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['Sin conceptos', 0]
    );

    return {
      totalEgresos: resumen.totalEgresos,
      cantidadTransacciones,
      cantidadProveedores,
      conceptoTop: {
        nombre: conceptoTop[0],
        cantidad: conceptoTop[1],
      },
    };
  }, [datosEgresos, resumen.totalEgresos]);

  // Función optimizada para formatear montos
  const formatearMontoOptimizado = useMemo(() => {
    return (monto: number) => formatearMonto.format(monto);
  }, []);

  // Implementar orden descendente (más reciente arriba)
  const datosOrdenados = useMemo(() => {
    return [...datosEgresos].sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return fechaB - fechaA; // Orden descendente
    });
  }, [datosEgresos]);

  // Implementar paginación
  const paginacion = usePaginacion({
    data: datosOrdenados,
    itemsPorPagina: 10,
  });

  return {
    // Datos
    datosEgresos: paginacion.datosPaginados,
    estadisticas,

    // Paginación
    paginacion,

    // Filtros
    filtros,
    actualizarFiltros,

    // Utilidades
    formatearMonto: formatearMontoOptimizado,

    // Acciones para futuro
    manejarEditar: (id: string) => {
      console.log('Editar egreso:', id);
      // TODO: Implementar cuando esté el backend
    },

    manejarEliminar: (id: string) => {
      console.log('Eliminar egreso:', id);
      // TODO: Implementar cuando esté el backend
    },

    manejarVer: (id: string) => {
      console.log('Ver egreso:', id);
      // TODO: Implementar cuando esté el backend
    },
  };
}
