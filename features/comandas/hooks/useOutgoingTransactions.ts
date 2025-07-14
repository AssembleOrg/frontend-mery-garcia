import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { useComandas } from '@/features/comandas/store/comandaStore';
import { useFiltrosComanda } from '@/features/comandas/store/comandaStore';
import { usePaginacion } from './usePaginacion';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import {
  exportComandasToCSV,
  exportComandasToPDF,
  exportComandasToExcel,
} from '@/lib/exportUtils';

export function useOutgoingTransactions(dateRange?: DateRange) {
  const { comandas } = useComandas();
  const { filters, actualizarFiltros } = useFiltrosComanda();
  const { exchangeRate } = useCurrencyConverter();

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

  // Filter outgoing transactions
  const filteredData = useMemo(() => {
    return comandas.filter((comanda) => {
      // Filter by type
      if (comanda.tipo !== 'egreso') return false;

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
    const totalOutgoing = filteredData.reduce(
      (sum, comanda) => sum + comanda.totalFinal,
      0
    );
    const transactionCount = filteredData.length;
    // Fix: Use cliente.nombre instead of cliente.id since Cliente doesn't have id
    const providerCount = new Set(
      filteredData.map((c) => c.cliente?.nombre).filter(Boolean)
    ).size;
    const average = transactionCount > 0 ? totalOutgoing / transactionCount : 0;

    return {
      total: totalOutgoing,
      count: transactionCount,
      average,
      totalOutgoing,
      transactionCount,
      providerCount,
    };
  }, [filteredData]);

  return {
    data: pagination.datosPaginados,
    statistics,
    pagination,
    filters,
    actualizarFiltros,

    // Actions
    handleDelete: (id: string) => {
      logger.debug('Delete outgoing transaction:', id);
      // TODO: Implement delete functionality
    },

    handleView: (id: string) => {
      logger.debug('View outgoing transaction:', id);
      // TODO: Implement view functionality
    },

    // Export functions
    exportToPDF: () => {
      logger.debug('Export outgoing transactions to PDF');
      const validDateRange =
        dateRange?.from && dateRange?.to
          ? {
              from: dateRange.from,
              to: dateRange.to,
            }
          : undefined;

      exportComandasToPDF(filteredData, exchangeRate, {
        // ← Corregir llamada
        filename: `egresos_${new Date().toISOString().split('T')[0]}`,
        dateRange: validDateRange,
        filters,
      });
    },

    exportToExcel: () => {
      logger.debug('Export outgoing transactions to Excel');
      const validDateRange =
        dateRange?.from && dateRange?.to
          ? {
              from: dateRange.from,
              to: dateRange.to,
            }
          : undefined;

      exportComandasToExcel(filteredData, {
        filename: `egresos_${new Date().toISOString().split('T')[0]}`,
        dateRange: validDateRange,
        filters,
      });
    },

    exportToCSV: () => {
      logger.debug('Export outgoing transactions to CSV');
      const validDateRange =
        dateRange?.from && dateRange?.to
          ? {
              from: dateRange.from,
              to: dateRange.to,
            }
          : undefined;

      exportComandasToCSV(filteredData, {
        filename: `egresos_${new Date().toISOString().split('T')[0]}`,
        dateRange: validDateRange,
        filters,
      });
    },
  };
}
