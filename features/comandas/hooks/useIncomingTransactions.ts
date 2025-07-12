import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { useComandas } from '@/features/comandas/store/comandaStore';
import { useFiltrosComanda } from '@/features/comandas/store/comandaStore';
import { usePaginacion } from './usePaginacion';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter'; // ← Agregar import
import {
  exportComandasToCSV,
  exportComandasToPDF,
  exportComandasToExcel,
} from '@/lib/exportUtils';

export function useIncomingTransactions(dateRange?: DateRange) {
  const { comandas } = useComandas();
  const { filters, updateFilters } = useFiltrosComanda();
  const { exchangeRate } = useCurrencyConverter(); // ← Agregar hook

  // Check if date is in range
  const isDateInRange = useMemo(() => {
    return (date: Date | string) => {
      if (!dateRange?.from) return true;

      const transactionDate = new Date(date);
      const startDate = new Date(dateRange.from);
      const endDate = dateRange.to
        ? new Date(dateRange.to)
        : new Date(dateRange.from);

      return transactionDate >= startDate && transactionDate <= endDate;
    };
  }, [dateRange]);

  // Filter incoming transactions
  const filteredData = useMemo(() => {
    return comandas.filter((comanda) => {
      // Filter by type
      if (comanda.tipo !== 'ingreso') return false;

      // Filter by date range
      if (!isDateInRange(comanda.fecha)) return false;

      // Apply other filters
      if (
        filters.cliente &&
        !comanda.cliente?.nombre
          ?.toLowerCase()
          .includes(filters.cliente.toLowerCase())
      ) {
        return false;
      }

      if (filters.personalId && comanda.mainStaff?.id !== filters.personalId) {
        return false;
      }

      if (
        filters.businessUnit &&
        comanda.businessUnit !== filters.businessUnit
      ) {
        return false;
      }

      if (filters.estado && comanda.estado !== filters.estado) {
        return false;
      }

      return true;
    });
  }, [comandas, filters, isDateInRange]);

  // Use pagination hook
  const pagination = usePaginacion({
    data: filteredData,
    itemsPorPagina: 10,
  });

  // Calculate statistics with correct property names
  const statistics = useMemo(() => {
    const totalIncoming = filteredData.reduce(
      (sum, comanda) => sum + comanda.totalFinal,
      0
    );
    const transactionCount = filteredData.length;
    const clientCount = new Set(
      filteredData.map((c) => c.cliente?.nombre).filter(Boolean)
    ).size;
    const average = transactionCount > 0 ? totalIncoming / transactionCount : 0;

    return {
      total: totalIncoming,
      count: transactionCount,
      average,
      totalIncoming,
      transactionCount,
      clientCount,
    };
  }, [filteredData]);

  return {
    data: pagination.datosPaginados,
    statistics,
    pagination,
    filters,
    updateFilters,

    // Actions
    handleDelete: (id: string) => {
      logger.debug('Delete incoming transaction:', id);
      // TODO: Implement delete functionality
    },

    handleView: (id: string) => {
      logger.debug('View incoming transaction:', id);
      // TODO: Implement view functionality
    },

    // Export functions
    exportToPDF: () => {
      logger.debug('Export incoming transactions to PDF');
      const validDateRange =
        dateRange?.from && dateRange?.to
          ? {
              from: dateRange.from,
              to: dateRange.to,
            }
          : undefined;

      exportComandasToPDF(filteredData, exchangeRate, {
        // ← Corregir llamada
        filename: `ingresos_${new Date().toISOString().split('T')[0]}`,
        dateRange: validDateRange,
        filters,
      });
    },

    exportToExcel: () => {
      logger.debug('Export incoming transactions to Excel');
      const validDateRange =
        dateRange?.from && dateRange?.to
          ? {
              from: dateRange.from,
              to: dateRange.to,
            }
          : undefined;

      exportComandasToExcel(filteredData, {
        filename: `ingresos_${new Date().toISOString().split('T')[0]}`,
        dateRange: validDateRange,
        filters,
      });
    },

    exportToCSV: () => {
      logger.debug('Export incoming transactions to CSV');
      const validDateRange =
        dateRange?.from && dateRange?.to
          ? {
              from: dateRange.from,
              to: dateRange.to,
            }
          : undefined;

      exportComandasToCSV(filteredData, {
        filename: `ingresos_${new Date().toISOString().split('T')[0]}`,
        dateRange: validDateRange,
        filters,
      });
    },
  };
}
