import { useMemo } from 'react';
import { useComandas, useFiltrosComanda } from '../store/comandaStore';
import { Encomienda } from '@/types/caja';
import { usePaginacion } from './usePaginacion';
import { DateRange } from 'react-day-picker';
import { logger } from '@/lib/utils';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

export function useIncomingTransactions(dateRange?: DateRange) {
  const { comandas } = useComandas();
  const { filters, updateFilters } = useFiltrosComanda();

  // Check if date is in range
  const isDateInRange = useMemo(() => {
    return (date: Date | string) => {
      if (!dateRange?.from) return true;

      const transactionDate = new Date(date);
      const startDate = new Date(dateRange.from);
      const endDate = dateRange.to
        ? new Date(dateRange.to)
        : new Date(dateRange.from);

      // Normalize dates for comparison
      transactionDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      return transactionDate >= startDate && transactionDate <= endDate;
    };
  }, [dateRange]);

  // Filter incoming transactions
  const incomingTransactions = useMemo(() => {
    return comandas.filter(
      (comanda) => comanda.tipo === 'ingreso' && isDateInRange(comanda.fecha)
    );
  }, [comandas, isDateInRange]);

  // Convert to legacy format for compatibility
  const transactionsData = useMemo((): Encomienda[] => {
    return incomingTransactions.map((comanda) => {
      // Ensure consistent staff mapping
      const staffName = comanda.mainStaff?.nombre || 'Sin asignar';

      return {
        id: comanda.id,
        fecha: comanda.fecha,
        numero: comanda.numero,
        cliente: comanda.cliente.nombre,
        telefono: comanda.cliente.telefono,
        servicios: comanda.items,
        subtotal: comanda.subtotal,
        descuentoTotal: comanda.totalDescuentos,
        iva: Math.round(comanda.totalFinal * 0.13 * 100) / 100,
        total: comanda.totalFinal,
        metodoPago:
          comanda.metodosPago.length === 1
            ? comanda.metodosPago[0].tipo
            : 'mixto',
        metodosPago: comanda.metodosPago,
        observaciones: comanda.observaciones || '',
        vendedor: staffName,
        estado: comanda.estado,
        tipo: comanda.tipo,
        estadoNegocio: comanda.estadoNegocio || 'pendiente',
        estadoValidacion: comanda.estadoValidacion || 'no_validado',
      };
    });
  }, [incomingTransactions]);

  // Apply filters to the data
  const filteredData = useMemo(() => {
    let filtered = transactionsData;

    // Apply search/text filters
    if (filters.busqueda) {
      const searchTerm = filters.busqueda.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.cliente.toLowerCase().includes(searchTerm) ||
          item.numero.toLowerCase().includes(searchTerm) ||
          item.vendedor.toLowerCase().includes(searchTerm) ||
          item.servicios.some((servicio) =>
            servicio.nombre.toLowerCase().includes(searchTerm)
          )
      );
    }

    // Apply staff filter (vendedor)
    if (filters.vendedor && filters.vendedor !== 'todos') {
      filtered = filtered.filter((item) => {
        if (filters.vendedor === 'sin-asignar') {
          return item.vendedor === 'Sin asignar';
        }
        return item.vendedor === filters.vendedor;
      });
    }

    // Apply payment method filter
    if (filters.metodoPago && filters.metodoPago !== 'todos') {
      filtered = filtered.filter(
        (item) => item.metodoPago === filters.metodoPago
      );
    }

    // Apply status filter
    if (filters.estado && filters.estado !== 'todos') {
      filtered = filtered.filter((item) => item.estado === filters.estado);
    }

    return filtered;
  }, [transactionsData, filters]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const transactionCount = filteredData.length;
    const clientCount = new Set(filteredData.map((item) => item.cliente)).size;

    // Calculate top service
    const serviceCounts = filteredData.reduce(
      (acc, item) => {
        item.servicios.forEach((servicio) => {
          const key = servicio.nombre;
          acc[key] = (acc[key] || 0) + (servicio.cantidad || 1);
        });
        return acc;
      },
      {} as Record<string, number>
    );

    const topService = Object.entries(serviceCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['No services', 0]
    );

    // Calculate staff performance
    const staffStats = filteredData.reduce(
      (acc, item) => {
        const staff = item.vendedor;
        if (!acc[staff]) {
          acc[staff] = { count: 0, total: 0 };
        }
        acc[staff].count += 1;
        acc[staff].total += item.total;
        return acc;
      },
      {} as Record<string, { count: number; total: number }>
    );

    const topStaff = Object.entries(staffStats).reduce(
      (a, b) => (a[1].total > b[1].total ? a : b),
      ['Sin datos', { count: 0, total: 0 }]
    );

    return {
      totalIncoming: filteredData.reduce((sum, item) => sum + item.total, 0),
      transactionCount,
      clientCount,
      topService: {
        name: topService[0],
        count: topService[1],
      },
      topStaff: {
        name: topStaff[0],
        transactions: topStaff[1].count,
        total: topStaff[1].total,
      },
    };
  }, [filteredData]);

  // Format amount utility
  const formatAmount = useMemo(() => {
    return (amount: number) => currencyFormatter.format(amount);
  }, []);

  // Sort by date (newest first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return dateB - dateA;
    });
  }, [filteredData]);

  // Pagination
  const pagination = usePaginacion({
    data: sortedData,
    itemsPorPagina: 10,
  });

  return {
    // Data
    data: pagination.datosPaginados,
    allData: sortedData, // For exports or other uses
    statistics,

    // Pagination
    pagination,

    // Filters
    filters,
    updateFilters,

    // Utilities
    formatAmount,

    // Actions
    handleEdit: (id: string) => {
      logger.info(`📝 Editando transacción de ingreso: ${id}`);
      // TODO: Implement edit functionality
      logger.debug('Edit incoming transaction:', id);
    },

    handleDelete: (id: string) => {
      logger.info(`🗑️ Eliminando transacción de ingreso: ${id}`);
      // TODO: Implement delete functionality
      logger.debug('Delete incoming transaction:', id);
    },

    handleView: (id: string) => {
      logger.info(`👁️ Viendo detalles de transacción de ingreso: ${id}`);
      // TODO: Implement view functionality
      logger.debug('View incoming transaction:', id);
    },

    handleChangeStatus: (id: string) => {
      logger.info(`🔄 Cambiando estado de transacción de ingreso: ${id}`);
      // TODO: Implement status change functionality
      logger.debug('Change status incoming transaction:', id);
    },

    // Export functions
    exportToPDF: () => {
      logger.info('📄 Exportando ingresos a PDF');
      // TODO: Implement PDF export
      logger.debug('Export incoming transactions to PDF');
    },

    exportToExcel: () => {
      logger.info('📊 Exportando ingresos a Excel');
      // TODO: Implement Excel export
      logger.debug('Export incoming transactions to Excel');
    },

    exportToCSV: () => {
      logger.info('📋 Exportando ingresos a CSV');
      // TODO: Implement CSV export
      logger.debug('Export incoming transactions to CSV');
    },
  };
}
