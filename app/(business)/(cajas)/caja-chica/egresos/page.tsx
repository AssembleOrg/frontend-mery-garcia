'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import TransactionsTable from '@/components/cajas/TransactionsTableTanStack';
import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnaCaja, Comanda } from '@/types/caja';
import { Pagination } from '@/components/ui/pagination';
import { DateRangePicker } from '@/components/ui/date-range-picker';
// import { DateShortcuts } from '@/components/ui/date-shortcuts';
import { DateRange } from 'react-day-picker';
import ClientOnly from '@/components/common/ClientOnly';
import Spinner from '@/components/common/Spinner';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import ModalEgreso from '@/components/cajas/ModalEgreso';
import EgresosTotalsDisplay from '@/components/cajas/EgresosTotalsDisplay';
import useComandaStore from '@/features/comandas/store/comandaStore';
import { EstadoDeComandaNew } from '@/services/unidadNegocio.service';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Egresos' },
];

// Column configuration for outgoing transactions
const initialColumns: ColumnaCaja[] = [
  {
    key: 'createdAt',
    label: 'Fecha',
    visible: true,
    sortable: true,
    width: '100px',
  },
  {
    key: 'numero',
    label: 'Número',
    visible: true,
    sortable: true,
    width: '100px',
  },
  {
    key: 'creadoPor',
    label: 'Creador',
    visible: true,
    sortable: true,
    width: '120px',
  },
];

export default function EgresosPage() {
  const { isInitialized } = useCurrencyConverter();
  const { getEgresosPaginados, comandasPaginadas } = useComandaStore();

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);

  // Local UI state
  const [columns, setColumns] = useState<ColumnaCaja[]>(initialColumns);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>('');

    useEffect(() => {
      setColumns(
        initialColumns.filter(column => column.key !== 'servicios')
      )
    }, []);

  // Load egresos data
  const loadEgresos = async () => {
    setLoading(true);
    try {
      // Preparar fechas para el backend
      let fechaDesde: string | undefined;
      let fechaHasta: string | undefined;

      if (dateRange?.from) {
        // Establecer la fecha desde al inicio del día (00:00:00)
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        fechaDesde = fromDate.toISOString();
      }

      if (dateRange?.to) {
        // Establecer la fecha hasta al final del día (23:59:59)
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        fechaHasta = toDate.toISOString();
      }

      await getEgresosPaginados({
        page: currentPage,
        limit: itemsPerPage,
        orderBy: 'createdAt',
        order: 'DESC',
        search: '',
        estadoDeComanda: EstadoDeComandaNew.VALIDADO,
        // Add date range filters if needed
        ...(fechaDesde && { fechaDesde }),
        ...(fechaHasta && { fechaHasta }),
      });
    } catch (error) {
      console.error('Error loading egresos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadEgresos();
  }, [currentPage, itemsPerPage, dateRange]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Get the selected transaction for the modal
  const selectedTransaction = comandasPaginadas?.data?.find(
    (t) => t.id === selectedTransactionId
  );

  // Handle transaction actions
  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete transaction:', id);
  };

  const onEditTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setShowEditModal(true);
  };

  const onViewTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setShowViewModal(true);
  };

  const onChangeStatus = (id: string) => {
    setSelectedTransactionId(id);
    setShowChangeStatusModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const hiddenColumns = columns.filter((c) => !c.visible).map((c) => c.key);

  // const agruparTransaccionesConTraspasos = () => {
  //   const grupos: Array<{
  //     tipo: 'transacciones';
  //     fecha: string;
  //     data: Comanda[];
  //     key: string;
  //   }> = [];

  //   // Crear un Set para evitar duplicados de fechas de transacciones
  //   const fechasTransaccionesProcesadas = new Set<string>();

  //   // Filtrar transacciones: mostrar solo las que corresponden a caja-chica
  //   const transaccionesFiltradas = transactions.filter(transaction => {
  //     // Si es un movimiento manual, verificar que sea un egreso real de caja-chica
  //     if (transaction.cliente.nombre === 'Movimiento Manual') {
  //       // Solo mostrar egresos reales de caja-chica (no ingresos de transferencias)
  //       return transaction.tipo === 'egreso' && 
  //              transaction.metadata?.cajaOrigen === 'caja_1';
  //     }
  //     // Las transacciones normales se muestran siempre
  //     return true;
  //   });

  //   // Agrupar transacciones filtradas por fecha
  //   const transaccionesPorFecha = transaccionesFiltradas.reduce(
  //     (acc, transaction) => {
  //       const fechaStr = formatDate(transaction.fecha);
  //       if (!acc[fechaStr]) {
  //         acc[fechaStr] = [];
  //       }
  //       acc[fechaStr].push(transaction);
  //       return acc;
  //     },
  //     {} as Record<string, typeof transaccionesFiltradas>
  //   );

  //   // Ordenar transacciones dentro de cada fecha: no validadas primero, validadas al final
  //   Object.keys(transaccionesPorFecha).forEach(fecha => {
  //     transaccionesPorFecha[fecha].sort((a, b) => {
  //       // Primero ordenar por estado de validación (no validadas primero)
  //       const aValidada = a.estadoValidacion === 'validado' ? 1 : 0;
  //       const bValidada = b.estadoValidacion === 'validado' ? 1 : 0;
  //       if (aValidada !== bValidada) {
  //         return aValidada - bValidada;
  //       }
  //       // Luego por fecha descendente (más recientes primero) como criterio secundario
  //       return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  //     });
  //   });

  //   Object.entries(transaccionesPorFecha).forEach(
  //     ([fecha, transaccionesDeLaFecha]) => {
  //       if (!fechasTransaccionesProcesadas.has(fecha)) {
  //         grupos.push({
  //           tipo: 'transacciones',
  //           fecha,
  //           data: transaccionesDeLaFecha,
  //           key: `transacciones-${fecha}`,
  //         });
  //         fechasTransaccionesProcesadas.add(fecha);
  //       }
  //     }
  //   );

  //   // Ordenar por fecha descendente (más recientes primero)
  //   return grupos.sort((a, b) => {
  //     return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  //   });
  // };

  // const gruposOrdenados = agruparTransaccionesConTraspasos();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        {/* Banner */}
        <StandardPageBanner title="Transacciones de Egreso - Caja Chica" />

        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

        {/* Breadcrumbs */}
        <ClientOnly>
          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Header with statistics */}
              <div className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Title and statistics */}
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-[#4a3540]">
                      ✨ Gestión de Transacciones de Egreso
                    </h1>
                    {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <SummaryCardDual
                        title="💰 Total Egresos"
                        totalUSD={statistics.totalOutgoingUSD ?? 0}
                        totalARS={statistics.totalOutgoingARS ?? 0}
                        valueClassName="text-red-600"
                        showTransactionCount={true}
                        transactionCountUSD={
                          statistics.dualCurrencyDetails?.USD?.transacciones ??
                          0
                        }
                        transactionCountARS={
                          statistics.dualCurrencyDetails?.ARS?.transacciones ??
                          0
                        }
                      />
                      <SummaryCardCount
                        title="📊 Transacciones"
                        count={statistics.transactionCount ?? 0}
                        subtitle="comandas realizadas"
                        valueClassName="text-blue-600"
                      />
                      <SummaryCardCount
                        title="🏪 Proveedores"
                        count={statistics.providerCount ?? 0}
                        subtitle="proveedores únicos"
                        valueClassName="text-purple-600"
                      />
                      {ultimoResidual && (
                        <ResidualDisplay
                          residualUSD={ultimoResidual.montoResidualUSD || 0}
                          residualARS={ultimoResidual.montoResidualARS || 0}
                          fecha={ultimoResidual.fechaTraspaso}
                        />
                      )}
                    </div> */}
                  </div>

                  {/* Add transaction button */}
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] px-6 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-[#e292a3] hover:to-[#d4a7ca] hover:shadow-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transacción
                  </Button>
                </div>
              </div>

              {/* Filters and tools */}
              <div className="mb-6">
                <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
                      {/* Date filter */}
                      <div className="flex justify-center">
                        <DateRangePicker
                          dateRange={dateRange}
                          onDateRangeChange={setDateRange}
                          placeholder="Filtrar por fecha"
                          accentColor="#f9bbc4"
                        />
                      </div>
                    </div>

                    {/* Date shortcuts */}
                    {/* <div className="mt-4">
                      <DateShortcuts
                        onDateRangeChange={setDateRange}
                        accentColor="#f9bbc4"
                      />
                    </div> */}

                    {/* Totals display */}
                    {comandasPaginadas?.data && comandasPaginadas.data.length > 0 && (
                      <div className="mt-6">
                        <EgresosTotalsDisplay 
                          data={comandasPaginadas.data}
                          className="mb-6"
                        />
                      </div>
                    )}

                    {/* Active filter indicator */}
                    {dateRange && (
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-[#f9bbc4]/20 to-[#e292a3]/20 border border-[#f9bbc4]/30 p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f9bbc4] text-white">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#4a3540]">
                              Filtro de fechas activo
                            </span>
                            <span className="text-xs text-[#6b4c57]">
                              {dateRange.from?.toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              {dateRange.to && dateRange.to.getTime() !== dateRange.from?.getTime() && (
                                <>
                                  {' → '}
                                  {dateRange.to.toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateRange(undefined)}
                          className="h-6 w-6 p-0 text-[#6b4c57] hover:bg-[#f9bbc4]/20"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Transactions table */}
              <div className="mb-6">
                <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                  <CardContent className="p-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Spinner />
                      </div>
                    ) : comandasPaginadas?.data && comandasPaginadas.data.length > 0 ? (
                      <div className="space-y-4">
                        <TransactionsTable
                          data={comandasPaginadas.data}
                          onEdit={onEditTransaction}
                          onDelete={handleDelete}
                          onView={onViewTransaction}
                          onChangeStatus={onChangeStatus}
                          hiddenColumns={['servicios', 'cliente', 'subtotal', 'metodosPago']}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <div className="mb-4 text-6xl">📋</div>
                        <h3 className="mb-2 text-lg font-semibold">No hay egresos</h3>
                        <p className="text-sm">No se encontraron transacciones de egreso</p>
                      </div>
                    )}

                    {/* Pagination */}
                    {comandasPaginadas?.pagination && (
                      <div className="mt-6">
                        <Pagination
                          paginaActual={comandasPaginadas.pagination.page}
                          totalPaginas={comandasPaginadas.pagination.totalPages}
                          totalItems={comandasPaginadas.pagination.total}
                          itemsPorPagina={comandasPaginadas.pagination.limit}
                          itemInicio={(comandasPaginadas.pagination.page - 1) * comandasPaginadas.pagination.limit + 1}
                          itemFin={Math.min(
                            comandasPaginadas.pagination.page * comandasPaginadas.pagination.limit,
                            comandasPaginadas.pagination.total
                          )}
                          onCambiarPagina={handlePageChange}
                          onCambiarItemsPorPagina={handleItemsPerPageChange}
                          hayPaginaAnterior={comandasPaginadas.pagination.page > 1}
                          hayPaginaSiguiente={comandasPaginadas.pagination.page < comandasPaginadas.pagination.totalPages}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ClientOnly>

        {/* Modals */}
         <ModalEgreso
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            // Reload data after adding new egreso
            loadEgresos();
          }}
        />

       {/* <ModalCambiarEstado
          isOpen={showChangeStatusModal}
          onClose={() => {
            setShowChangeStatusModal(false);
            setSelectedTransactionId('');
          }}
          comandaId={selectedTransactionId}
          estadoActual={
            (selectedTransaction?.estadoValidacion === 'validado'
              ? 'completado'
              : selectedTransaction?.estado) || 'pendiente'
          }
          onSuccess={() => {
            setShowChangeStatusModal(false);
            setSelectedTransactionId('');
          }}
        />

        <ModalEditarTransaccion
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTransactionId('');
          }}
          comandaId={selectedTransactionId}
        />

        {/* ✅ ModalVerDetalles para VER detalles de transacciones */}
        <ModalVerDetalles
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTransactionId('');
          }}
          comandaId={selectedTransactionId}
        />
      </div>
    </MainLayout>
  );
}
