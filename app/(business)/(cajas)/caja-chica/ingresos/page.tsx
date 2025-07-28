'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import TableFilters from '@/components/cajas/TableFilters';
import TransactionsTable from '@/components/cajas/TransactionsTableTanStack';
import ModalCambiarEstado from '@/components/validacion/ModalCambiarEstado';
import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnaCaja, FiltrosEncomienda } from '@/types/caja';
import ModalTransaccionUnificado from '@/components/cajas/ModalTransaccionUnificado';
import { Pagination } from '@/components/ui/pagination';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import ClientOnly from '@/components/common/ClientOnly';
import Spinner from '@/components/common/Spinner';
import SummaryCardDual from '@/components/common/SummaryCardDual';
import SummaryCardCount from '@/components/common/SummaryCardCount';
import ModalEditarTransaccion from '@/components/cajas/ModalEditarTransaccion';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatDate } from '@/lib/utils';
import { useRecordsStore } from '@/features/records/store/recordsStore';
import ResidualDisplay from '@/components/cajas/ResidualDisplay';
import { EstadoDeComandaNew, UnidadNegocioNew, TipoDeComandaNew, ComandaNew } from '@/services/unidadNegocio.service';
import useComandaStore from '@/features/comandas/store/comandaStore';

export default function IngresosPage() {
  const { isInitialized } = useCurrencyConverter();

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Get traspasos for residual display
  const { traspasos } = useRecordsStore();

  // Find last transfer with residual
  const ultimoResidual = traspasos
    .filter(t => t.esTraspasoParcial && 
                ((t.montoResidualUSD || 0) > 0 || (t.montoResidualARS || 0) > 0))
    .sort((a, b) => new Date(b.fechaTraspaso).getTime() - 
                   new Date(a.fechaTraspaso).getTime())[0];

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(20);

  // Store de comandas
  const {
    comandasPaginadas,
    cargando,
    error,
    cargarComandasPaginadas,
  } = useComandaStore();

  // Cargar comandas solo al entrar a la vista y cuando cambie la paginación
  useEffect(() => {
    console.log('cargando comandas'); 
    cargarComandasPaginadas({
      page: paginaActual,
      limit: itemsPorPagina,
      tipoDeComanda: TipoDeComandaNew.INGRESO,
      orderBy: 'numero',
      order: 'DESC',
    });
  }, [paginaActual, itemsPorPagina, cargarComandasPaginadas]);

  // Local UI state
  const [columns, setColumns] = useState<ColumnaCaja[]>(initialColumns);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>('');

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Get the selected transaction for the modal
  const selectedTransaction = comandasPaginadas.data.find(
    (t) => t.id === selectedTransactionId
  );

  // Handle delete transaction
  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete transaction:', id);
  };

  // Handle status change
  const onChangeStatus = (id: string) => {
    setSelectedTransactionId(id);
    setShowChangeStatusModal(true);
  };

  // Handle edit transaction
  const onEditTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setShowEditModal(true);
  };

  // Handle view transaction details
  const onViewTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setShowViewModal(true);
  };

  const hiddenColumns = columns.filter((c) => !c.visible).map((c) => c.key);

  // Totales y estadísticas simples - usar datos paginados
  const totalIngresosUSD = comandasPaginadas.data.reduce((sum, comanda) => sum + (comanda.metodosPago.reduce((acc, item) => item.moneda === 'USD' ? acc + item.monto! : acc, 0)), 0);
  const totalIngresosARS = comandasPaginadas.data.reduce((sum, comanda) => sum + (comanda.metodosPago.reduce((acc, item) => item.moneda === 'ARS' ? acc + item.monto! : acc, 0)), 0);
  const transactionCountARS = comandasPaginadas.data.reduce((sum, comanda) => sum + (comanda.metodosPago.reduce((acc, item) => item.moneda === 'ARS' ? acc + 1 : acc, 0)), 0);
  const transactionCountUSD = comandasPaginadas.data.reduce((sum, comanda) => sum + (comanda.metodosPago.reduce((acc, item) => item.moneda === 'USD' ? acc + 1 : acc, 0)), 0);
  const clientCount = new Set(comandasPaginadas.data.map(c => c.cliente?.id)).size;
  const transactionCount = comandasPaginadas.data.length;

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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Header with statistics */}
              <div className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Title and statistics */}
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-[#4a3540]">
                      ✨ Gestión de Transacciones de Ingreso
                    </h1>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <SummaryCardDual
                        title="💰 Total Ingresos"
                        totalUSD={totalIngresosUSD}
                        totalARS={totalIngresosARS}
                        valueClassName="text-green-600"
                        showTransactionCount={true}
                        transactionCountUSD={transactionCountUSD}
                        transactionCountARS={transactionCountARS}
                      />
                      <SummaryCardCount
                        title="📊 Transacciones"
                        count={transactionCount}
                        subtitle="comandas realizadas"
                        valueClassName="text-blue-600"
                      />
                      <SummaryCardCount
                        title="👥 Clientes"
                        count={clientCount}
                        subtitle="clientes únicos"
                        valueClassName="text-purple-600"
                      />
                      {ultimoResidual && (
                        <ResidualDisplay
                          residualUSD={ultimoResidual.montoResidualUSD || 0}
                          residualARS={ultimoResidual.montoResidualARS || 0}
                          fecha={ultimoResidual.fechaTraspaso}
                        />
                      )}
                    </div>
                  </div>

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
                          filters={{
                          }}
                          onFiltersChange={() => {}}
                          columns={columns}
                          onColumnsChange={setColumns}
                        />
                      </div>
                    </div>

                    {/* Active filter indicators */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6b4c57]">
                      {dateRange && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#f9bbc4]"></div>
                          <span>
                            Filtrando desde{' '}
                            {dateRange.from?.toLocaleDateString('es-ES')}
                            {dateRange.to &&
                              ` hasta ${dateRange.to.toLocaleDateString('es-ES')}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions table */}
              <div className="mb-6">
                <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                  <CardContent className="p-4">
                    {/* Mostrar tabla de transacciones con datos paginados */}
                    {cargando ? (
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-600">
                        Error: {error}
                      </div>
                    ) : comandasPaginadas.data.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay transacciones de ingreso para mostrar
                      </div>
                    ) : (
                      <TransactionsTable
                        data={comandasPaginadas.data}
                        onEdit={onEditTransaction}
                        onDelete={handleDelete}
                        onView={onViewTransaction}
                        onChangeStatus={onChangeStatus}
                        hiddenColumns={hiddenColumns}
                      />
                    )}

                    {/* Pagination */}
                    <div className="mt-6">
                      <Pagination
                        paginaActual={comandasPaginadas.pagination.page ?? 1}
                        totalPaginas={comandasPaginadas.pagination.totalPages ?? 1}
                        totalItems={comandasPaginadas.pagination.total ?? 0}
                        itemsPorPagina={comandasPaginadas.pagination.limit ?? 20}
                        itemInicio={comandasPaginadas.pagination ? (comandasPaginadas.pagination.page - 1) * comandasPaginadas.pagination.limit + 1 : 0}
                        itemFin={comandasPaginadas.pagination ? Math.min(comandasPaginadas.pagination.page * comandasPaginadas.pagination.limit, comandasPaginadas.pagination.total) : 0}
                        onCambiarPagina={setPaginaActual}
                        onCambiarItemsPorPagina={setItemsPorPagina}
                        hayPaginaAnterior={comandasPaginadas.pagination ? comandasPaginadas.pagination.page > 1 : false}
                        hayPaginaSiguiente={comandasPaginadas.pagination ? comandasPaginadas.pagination.page < comandasPaginadas.pagination.totalPages : false}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ClientOnly>

        {/* Modals */}

        <ModalTransaccionUnificado
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          tipo="ingreso"
        />

        <ModalCambiarEstado
          isOpen={showChangeStatusModal}
          onClose={() => {
            setShowChangeStatusModal(false);
            setSelectedTransactionId('');
          }}
          comandaId={selectedTransactionId}
          estadoActual={
            (selectedTransaction && (selectedTransaction as any).estadoValidacion === 'validado')
              ? 'completado'
              : ((selectedTransaction?.estadoDeComanda === EstadoDeComandaNew.FINALIZADA)
                  ? 'completado'
                  : (selectedTransaction?.estadoDeComanda === EstadoDeComandaNew.CANCELADA)
                    ? 'cancelado'
                    : 'pendiente')
          }
          onSuccess={() => {
            setShowChangeStatusModal(false);
            setSelectedTransactionId('');
          }}
        />

        {/* ✅ ModalEditarTransaccion para EDITAR transacciones existentes (NUEVO MODAL MEJORADO) */}
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
    key: 'cliente.nombre',
    label: 'Cliente',
    visible: true,
    sortable: true,
    width: '150px',
  },
  {
    key: 'mainStaff.nombre',
    label: 'Vendedor',
    visible: true, // Cambiado a visible para probar el filtro
    sortable: true,
    width: '120px',
  },
  {
    key: 'servicios',
    label: 'Servicios',
    visible: true,
    sortable: false,
    width: '200px',
  },
  {
    key: 'subtotal',
    label: 'Subtotal',
    visible: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'totalFinal',
    label: 'Total',
    visible: true,
    sortable: true,
    width: '120px',
  },
  {
    key: 'metodosPago',
    label: 'Método Pago',
    visible: false, // Oculto por defecto, usuario puede habilitarlo
    sortable: true,
    width: '100px',
  },
  {
    key: 'estado',
    label: 'Estado',
    visible: false, // Oculto por defecto, usuario puede habilitarlo
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
