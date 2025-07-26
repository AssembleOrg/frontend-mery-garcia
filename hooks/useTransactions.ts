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
  validatedOnly?: boolean; // Nueva opción para caja-grande
}

export function useTransactions({
  type,
  dateRange,
  itemsPorPagina = 10,
  validatedOnly = false,
}: UseTransactionsOptions) {
  const { comandas } = useComandas();
  const { filters, actualizarFiltros, limpiarFiltros } = useFiltrosComanda();
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

      // Filter by payment method
      if (filters.metodoPago && filters.metodoPago !== 'todos') {
        const hasPaymentMethod = comanda.metodosPago.some((mp) => {
          if (filters.metodoPago === 'mixto') {
            // For mixed payments, check if there are multiple payment methods
            return comanda.metodosPago.length > 1;
          }
          return mp.tipo === filters.metodoPago;
        });
        if (!hasPaymentMethod) return false;
      }

      // Filter by currency (ARS/USD)
      if (filters.moneda && filters.moneda !== 'todos') {
        const hasCurrency = comanda.metodosPago.some(
          (mp) => mp.moneda === filters.moneda
        );
        if (!hasCurrency) return false;
      }

      return true;
    });
  }, [comandas, filters, isDateInRange, type]);

  // Use pagination hook
  const pagination = usePaginacion({
    data: filteredData,
    itemsPorPagina,
  });

  // Filter commands based on validation status
  const dataForCalculations = useMemo(() => {
    if (validatedOnly) {
      // For caja-grande: only include validated commands
      return filteredData.filter(
        (comanda) => comanda.estadoValidacion === 'validado'
      );
    } else {
      // For caja-chica: exclude validated commands but include manual movements for caja-chica
      return filteredData.filter((comanda) => {
        // Include non-validated commands (normal transactions)
        if (comanda.estadoValidacion !== 'validado') {
          return true;
        }
        
        // For manual movements, include only those that belong to caja-chica
        if (comanda.cliente.nombre === 'Movimiento Manual' && comanda.metadata) {
          // Include ingresos that have caja-chica as destination
          if (comanda.tipo === 'ingreso' && comanda.metadata.cajaDestino === 'caja_1') {
            return true;
          }
          // Include egresos that have caja-chica as origin (and destination for direct operations)
          if (comanda.tipo === 'egreso' && 
              (comanda.metadata.cajaOrigen === 'caja_1' || comanda.metadata.cajaDestino === 'caja_1')) {
            return true;
          }
        }
        
        return false;
      });
    }
  }, [filteredData, validatedOnly]);

  // Calculate dual currency statistics
  const calculateDualCurrencyTotals = useMemo(() => {
    return (comandas: typeof filteredData) => {
      const totals = {
        totalUSD: 0,
        totalARS: 0,
        detallesPorMoneda: {
          USD: { total: 0, transacciones: 0 },
          ARS: { total: 0, transacciones: 0 },
        },
      };

      comandas.forEach((comanda) => {
        // Separar los métodos de pago por moneda
        const metodosUSD = comanda.metodosPago.filter(
          (mp) => mp.moneda === 'USD'
        );
        const metodosARS = comanda.metodosPago.filter(
          (mp) => mp.moneda === 'ARS'
        );

        if (metodosUSD.length > 0) {
          const totalUSDComanda = metodosUSD.reduce(
            (sum, mp) => sum + mp.monto,
            0
          );
          totals.totalUSD += totalUSDComanda;
          totals.detallesPorMoneda.USD.total += totalUSDComanda;
          totals.detallesPorMoneda.USD.transacciones += 1;
        }

        if (metodosARS.length > 0) {
          const totalARSComanda = metodosARS.reduce(
            (sum, mp) => {
              // Usar valores ARS tal como están almacenados (ya son nativos)
              return sum + mp.monto;
            },
            0
          );
          totals.totalARS += totalARSComanda;
          totals.detallesPorMoneda.ARS.total += totalARSComanda;
          totals.detallesPorMoneda.ARS.transacciones += 1;
        }

      });


      return totals;
    };
  }, []);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = dataForCalculations.reduce(
      (sum, comanda) => sum + comanda.totalFinal,
      0
    );
    const transactionCount = dataForCalculations.length;
    const uniqueClients = new Set(
      dataForCalculations.map((c) => c.cliente?.nombre).filter(Boolean)
    ).size;
    const average = transactionCount > 0 ? total / transactionCount : 0;

    // Calculate dual currency totals
    const dualCurrencyTotals = calculateDualCurrencyTotals(dataForCalculations);

    // Provide different naming based on type for backward compatibility
    const typeSpecificStats = {
      ...(type === 'ingreso' && {
        totalIncoming: total,
        clientCount: uniqueClients,
        // Add dual currency totals for incoming transactions
        totalIncomingUSD: dualCurrencyTotals.totalUSD,
        totalIncomingARS: dualCurrencyTotals.totalARS,
        dualCurrencyDetails: dualCurrencyTotals.detallesPorMoneda,
      }),
      ...(type === 'egreso' && {
        totalOutgoing: total,
        providerCount: uniqueClients,
        // Add dual currency totals for outgoing transactions
        totalOutgoingUSD: dualCurrencyTotals.totalUSD,
        totalOutgoingARS: dualCurrencyTotals.totalARS,
        dualCurrencyDetails: dualCurrencyTotals.detallesPorMoneda,
      }),
      ...(type === 'all' && {
        totalIncoming: dataForCalculations
          .filter((c) => c.tipo === 'ingreso')
          .reduce((sum, c) => sum + c.totalFinal, 0),
        totalOutgoing: dataForCalculations
          .filter((c) => c.tipo === 'egreso')
          .reduce((sum, c) => sum + c.totalFinal, 0),
        clientCount: uniqueClients,
        providerCount: uniqueClients,
        // Add dual currency totals for all transactions
        incomingDualCurrency: calculateDualCurrencyTotals(
          dataForCalculations.filter((c) => c.tipo === 'ingreso')
        ),
        outgoingDualCurrency: calculateDualCurrencyTotals(
          dataForCalculations.filter((c) => c.tipo === 'egreso')
        ),
      }),
    };

    return {
      total,
      count: transactionCount,
      average,
      transactionCount,
      ...typeSpecificStats,
    };
  }, [dataForCalculations, type, calculateDualCurrencyTotals]);

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
    limpiarFiltros,

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

      exportComandasToCSV(filteredData, exchangeRate, {
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
