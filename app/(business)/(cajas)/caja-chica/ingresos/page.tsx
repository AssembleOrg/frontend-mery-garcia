'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import TableFilters from '@/components/cajas/TableFilters';
import TransactionsTable from '@/components/cajas/TransactionsTable';
import ModalCambiarEstado from '@/components/validacion/ModalCambiarEstado';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Plus } from 'lucide-react';
import { ColumnaCaja } from '@/types/caja';
import ModalAgregarComanda from '@/components/cajas/ModalAgregarComanda';
import ModalTransaccion from '@/components/cajas/ModalTransaccion';
import { useInitializeComandaStore } from '@/hooks/useInitializeComandaStore';
import { useIncomingTransactions } from '@/features/comandas/hooks/useIncomingTransactions';
import { Pagination } from '@/components/ui/pagination';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import ClientOnly from '@/components/common/ClientOnly';
import Spinner from '@/components/common/Spinner';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Ingresos' },
];

// Column configuration for incoming transactions
const initialColumns: ColumnaCaja[] = [
  {
    key: 'fecha',
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
    key: 'cliente',
    label: 'Cliente',
    visible: true,
    sortable: true,
    width: '150px',
  },
  {
    key: 'servicios',
    label: 'Servicios',
    visible: true,
    sortable: false,
    width: '200px',
  },
  {
    key: 'total',
    label: 'Total',
    visible: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'estado',
    label: 'Estado',
    visible: false, // Oculto por defecto, usuario puede habilitarlo
    sortable: true,
    width: '120px',
  },
  {
    key: 'metodoPago',
    label: 'Método Pago',
    visible: false, // Oculto por defecto, usuario puede habilitarlo
    sortable: true,
    width: '100px',
  },
  {
    key: 'vendedor',
    label: 'Vendedor',
    visible: false, // Oculto por defecto, usuario puede habilitarlo
    sortable: true,
    width: '120px',
  },
  {
    key: 'estadoNegocio',
    label: 'Estado Negocio',
    visible: false, // Oculto para vista de usuario estándar
    sortable: true,
    width: '130px',
  },
  {
    key: 'estadoValidacion',
    label: 'Validación',
    visible: false, // Oculto para vista de usuario estándar
    sortable: true,
    width: '120px',
  },
  {
    key: 'acciones',
    label: 'Acciones',
    visible: true,
    sortable: false,
    width: '100px',
  },
];

export default function IngresosPage() {
  // Initialize store only once
  const { isInitialized } = useInitializeComandaStore();

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Use clean hook for incoming transactions
  const {
    data,
    statistics,
    pagination,
    filters,
    updateFilters,
    formatAmount,
    handleDelete,
    exportToPDF,
    exportToExcel,
    exportToCSV,
  } = useIncomingTransactions(dateRange);

  // Local UI state
  const [columns, setColumns] = useState<ColumnaCaja[]>(initialColumns);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>(
    'view'
  );
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>('');

  // Get the selected transaction for the modal
  const selectedTransaction = data.find((t) => t.id === selectedTransactionId);

  // Handle status change
  const onChangeStatus = (id: string) => {
    setSelectedTransactionId(id);
    setShowChangeStatusModal(true);
  };

  // Handle edit transaction
  const onEditTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setModalMode('edit');
    setShowTransactionModal(true);
  };

  // Handle view transaction details
  const onViewTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setModalMode('view');
    setShowTransactionModal(true);
  };

  // Handle modal mode change
  const handleModalModeChange = (mode: 'view' | 'edit' | 'create') => {
    setModalMode(mode);
  };

  // Mostrar spinner hasta que el store esté listo
  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
          <StandardPageBanner title="Transacciones de Ingreso - Caja Chica" />
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <p className="ml-2 text-[#6b4c57]">Cargando transacciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        {/* Banner */}
        <StandardPageBanner title="Transacciones de Ingreso - Caja Chica" />

        <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

        {/* Breadcrumbs y contenido sólo en cliente */}
        <ClientOnly>
          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
            {/* Header with statistics */}
            <div className="mb-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Title and statistics */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-bold text-[#4a3540]">
                    ✨ Gestión de Transacciones de Ingreso
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-[#6b4c57]">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-green-600">
                        {formatAmount(statistics.totalIncoming)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#f9bbc4]" />
                      <span className="font-medium">Transacciones:</span>
                      <span className="font-bold">
                        {statistics.transactionCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#f9bbc4]" />
                      <span className="font-medium">Clientes:</span>
                      <span className="font-bold">
                        {statistics.clientCount}
                      </span>
                    </div>
                  </div>
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
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Date filter */}
                    <div className="max-w-xs flex-1">
                      <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        placeholder="Filtrar por fecha"
                        accentColor="#f9bbc4"
                      />
                    </div>

                    {/* Table tools */}
                    <div className="flex items-center gap-3">
                      <TableFilters
                        filters={filters}
                        onFiltersChange={updateFilters}
                        columns={columns}
                        onColumnsChange={setColumns}
                        exportToPDF={exportToPDF}
                        exportToExcel={exportToExcel}
                        exportToCSV={exportToCSV}
                      />
                    </div>
                  </div>

                  {/* Active filter indicator */}
                  {dateRange && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#6b4c57]">
                      <div className="h-2 w-2 rounded-full bg-[#f9bbc4]"></div>
                      <span>
                        Filtrando desde{' '}
                        {dateRange.from?.toLocaleDateString('es-ES')}
                        {dateRange.to &&
                          ` hasta ${dateRange.to.toLocaleDateString('es-ES')}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Transactions table */}
            <div className="mb-6">
              <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                <CardContent className="p-4">
                  <TransactionsTable
                    data={data}
                    columns={columns}
                    onEdit={onEditTransaction}
                    onDelete={handleDelete}
                    onView={onViewTransaction}
                    onChangeStatus={onChangeStatus}
                    title="📈 Transacciones de Ingreso"
                    accentColor="#f9bbc4"
                  />

                  {/* Pagination */}
                  <div className="mt-6">
                    <Pagination
                      paginaActual={pagination.paginaActual}
                      totalPaginas={pagination.totalPaginas}
                      totalItems={pagination.totalItems}
                      itemsPorPagina={pagination.itemsPorPagina}
                      itemInicio={pagination.itemInicio}
                      itemFin={pagination.itemFin}
                      onCambiarPagina={pagination.irAPagina}
                      onCambiarItemsPorPagina={pagination.cambiarItemsPorPagina}
                      hayPaginaAnterior={pagination.hayPaginaAnterior}
                      hayPaginaSiguiente={pagination.hayPaginaSiguiente}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ClientOnly>

        {/* Modals */}
        <ModalAgregarComanda
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />

        <ModalCambiarEstado
          isOpen={showChangeStatusModal}
          onClose={() => {
            setShowChangeStatusModal(false);
            setSelectedTransactionId('');
          }}
          comandaId={selectedTransactionId}
          estadoActual={selectedTransaction?.estado || 'pendiente'}
        />

        <ModalTransaccion
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedTransactionId('');
            setModalMode('view');
          }}
          transactionId={selectedTransactionId}
          mode={modalMode}
          onModeChange={handleModalModeChange}
        />
      </div>
    </MainLayout>
  );
}
