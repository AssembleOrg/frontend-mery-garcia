import { useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { useComandas } from '@/features/comandas/store/comandaStore';
import { useFiltrosComanda } from '@/features/comandas/store/comandaStore';
import { usePaginacion } from '@/features/comandas/hooks/usePaginacion';
import { logger } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { exportComandasToCSV, exportComandasToPDF } from '@/lib/exportUtils';

type TransactionType = 'ingreso' | 'egreso' | 'all';

interface UseTransactionsOptions {
  type: TransactionType;
  dateRange?: DateRange;
  itemsPorPagina?: number;
}

export function useTransactions({
  type,
  dateRange,
  itemsPorPagina = 10,
}: UseTransactionsOptions) {
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

  // Filter transactions by type and other criteria
  const filteredData = useMemo(() => {
    return comandas.filter((comanda) => {
      // Filter by type (skip if 'all')
      if (type !== 'all' && comanda.tipo !== type) return false;

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
  }, [comandas, filters, isDateInRange, type]);

  // Use pagination hook
  const pagination = usePaginacion({
    data: filteredData,
    itemsPorPagina,
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredData.reduce(
      (sum, comanda) => sum + comanda.totalFinal,
      0
    );
    const transactionCount = filteredData.length;
    const uniqueClients = new Set(
      filteredData.map((c) => c.cliente?.nombre).filter(Boolean)
    ).size;
    const average = transactionCount > 0 ? total / transactionCount : 0;

    // Provide different naming based on type for backward compatibility
    const typeSpecificStats = {
      ...(type === 'ingreso' && {
        totalIncoming: total,
        clientCount: uniqueClients,
      }),
      ...(type === 'egreso' && {
        totalOutgoing: total,
        providerCount: uniqueClients,
      }),
      ...(type === 'all' && {
        totalIncoming: filteredData
          .filter((c) => c.tipo === 'ingreso')
          .reduce((sum, c) => sum + c.totalFinal, 0),
        totalOutgoing: filteredData
          .filter((c) => c.tipo === 'egreso')
          .reduce((sum, c) => sum + c.totalFinal, 0),
        clientCount: uniqueClients,
        providerCount: uniqueClients,
      }),
    };

    return {
      total,
      count: transactionCount,
      average,
      transactionCount,
      ...typeSpecificStats,
    };
  }, [filteredData, type]);

  // Generate filename based on type
  const getFilename = (extension: string) => {
    const typePrefix =
      type === 'all'
        ? 'transacciones'
        : type === 'ingreso'
          ? 'ingresos'
          : 'egresos';
    const date = new Date().toISOString().split('T')[0];
    return `${typePrefix}_${date}.${extension}`;
  };

  // Prepare export options
  const getExportOptions = () => {
    const validDateRange =
      dateRange?.from && dateRange?.to
        ? {
            from: dateRange.from,
            to: dateRange.to,
          }
        : undefined;

    return {
      dateRange: validDateRange,
      filters,
    };
  };

  return {
    data: pagination.datosPaginados,
    statistics,
    pagination,
    filters,
    actualizarFiltros,

    // Actions
    handleDelete: (id: string) => {
      logger.debug(`Delete ${type} transaction:`, id);
      // TODO: Implement delete functionality
    },

    handleView: (id: string) => {
      logger.debug(`View ${type} transaction:`, id);
      // TODO: Implement view functionality
    },

    // Export functions
    exportToPDF: () => {
      logger.debug(`Export ${type} transactions to PDF`);
      const options = getExportOptions();

      exportComandasToPDF(filteredData, exchangeRate, {
        filename: getFilename('pdf'),
        ...options,
      });
    },

    exportToCSV: () => {
      logger.debug(`Export ${type} transactions to CSV`);
      const options = getExportOptions();

      exportComandasToCSV(filteredData, {
        filename: getFilename('csv'),
        ...options,
      });
    },
  };
}

// Convenience hooks for backward compatibility
export function useIncomingTransactions(dateRange?: DateRange) {
  return useTransactions({ type: 'ingreso', dateRange });
}

export function useOutgoingTransactions(dateRange?: DateRange) {
  return useTransactions({ type: 'egreso', dateRange });
}
