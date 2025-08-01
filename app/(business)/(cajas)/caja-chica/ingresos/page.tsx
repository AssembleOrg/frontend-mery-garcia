'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import TableFilters from '@/components/cajas/TableFilters';
import TransactionsTable from '@/components/cajas/TransactionsTableTanStack';
import ModalCambiarEstado from '@/components/validacion/ModalCambiarEstado';
import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnaCaja, Comanda } from '@/types/caja';
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
import { useComandaStore } from '@/features/comandas/store/comandaStore';
import { toast } from 'sonner';

export default function IngresosPage() {
  const { isInitialized } = useCurrencyConverter();
  const { eliminarComanda } = useComandaStore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Get traspasos for residual display
  const { traspasos } = useRecordsStore();

  // Find last transfer with residual
  const ultimoResidual = traspasos
    .filter(
      (t) =>
        t.esTraspasoParcial &&
        ((t.montoResidualUSD || 0) > 0 || (t.montoResidualARS || 0) > 0)
    )
    .sort(
      (a, b) =>
        new Date(b.fechaTraspaso).getTime() -
        new Date(a.fechaTraspaso).getTime()
    )[0];

  // Use clean hook for incoming transactions
  const {
    data: transactions,
    statistics,
    pagination,
    filters,
    actualizarFiltros,
    limpiarFiltros,
    exportToPDF,
    exportToCSV,
  } = useTransactions({
    type: 'ingreso',
    dateRange,
  });

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
  const selectedTransaction = transactions.find(
    (t) => t.id === selectedTransactionId
  );

  const handleDelete = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);

    if (!transaction) {
      toast.error('Transacción no encontrada');
      return;
    }

    // No permitir eliminar transacciones validadas
    if (transaction.estadoValidacion === 'validado') {
      toast.error('No se puede eliminar una transacción validada');
      return;
    }

    // Confirmación antes de eliminar safa el window OK.
    if (
      window.confirm(
        `¿Está seguro que desea eliminar la transacción ${transaction.numero}?`
      )
    ) {
      try {
        eliminarComanda(id);
        toast.success('Transacción eliminada correctamente');
      } catch (error) {
        toast.error('Error al eliminar la transacción');
        console.error('Error al eliminar transacción:', error);
      }
    }
  };

  const onChangeStatus = (id: string) => {
    setSelectedTransactionId(id);
    setShowChangeStatusModal(true);
  };

  const onEditTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setShowEditModal(true);
  };

  const onViewTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setShowViewModal(true);
  };

  const hiddenColumns = columns.filter((c) => !c.visible).map((c) => c.key);

  const agruparTransaccionesConTraspasos = () => {
    const grupos: Array<{
      tipo: 'transacciones';
      fecha: string;
      data: Comanda[];
      key: string;
    }> = [];

    // Crear un Set para evitar duplicados de fechas de transacciones
    const fechasTransaccionesProcesadas = new Set<string>();

    // Filtrar transacciones: mostrar solo las que corresponden a caja-chica
    const transaccionesFiltradas = transactions.filter((transaction) => {
      // Si es un movimiento manual, verificar que sea un ingreso real a caja-chica
      if (transaction.cliente.nombre === 'Movimiento Manual') {
        // Solo mostrar ingresos reales a caja-chica (no egresos de transferencias)
        return (
          transaction.tipo === 'ingreso' &&
          transaction.metadata?.cajaDestino === 'caja_1'
        );
      }
      // Las transacciones normales se muestran siempre
      return true;
    });

    // Agrupar transacciones filtradas por fecha
    const transaccionesPorFecha = transaccionesFiltradas.reduce(
      (acc, transaction) => {
        const fechaStr = formatDate(transaction.fecha);
        if (!acc[fechaStr]) {
          acc[fechaStr] = [];
        }
        acc[fechaStr].push(transaction);
        return acc;
      },
      {} as Record<string, typeof transaccionesFiltradas>
    );

    // Ordenar transacciones dentro de cada fecha: no validadas primero, validadas al final
    Object.keys(transaccionesPorFecha).forEach((fecha) => {
      transaccionesPorFecha[fecha].sort((a, b) => {
        // Primero ordenar por estado de validación (no validadas primero)
        const aValidada = a.estadoValidacion === 'validado' ? 1 : 0;
        const bValidada = b.estadoValidacion === 'validado' ? 1 : 0;
        if (aValidada !== bValidada) {
          return aValidada - bValidada;
        }
        // Luego por fecha descendente (más recientes primero) como criterio secundario
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
    });

    Object.entries(transaccionesPorFecha).forEach(
      ([fecha, transaccionesDeLaFecha]) => {
        if (!fechasTransaccionesProcesadas.has(fecha)) {
          grupos.push({
            tipo: 'transacciones',
            fecha,
            data: transaccionesDeLaFecha,
            key: `transacciones-${fecha}`,
          });
          fechasTransaccionesProcesadas.add(fecha);
        }
      }
    );

    // Ordenar por fecha descendente (más recientes primero)
    return grupos.sort((a, b) => {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
  };

  const gruposOrdenados = agruparTransaccionesConTraspasos();

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
                        totalUSD={statistics.totalIncomingUSD ?? 0}
                        totalARS={statistics.totalIncomingARS ?? 0}
                        valueClassName="text-green-600"
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
                        title="👥 Clientes"
                        count={statistics.clientCount ?? 0}
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
                          filters={filters}
                          onFiltersChange={actualizarFiltros}
                          onClearFilters={limpiarFiltros}
                          columns={columns}
                          onColumnsChange={setColumns}
                          exportToPDF={exportToPDF}
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
                    {/* Renderizar grupos ordenados - SIN TraspasoIndicator */}
                    <div className="space-y-4">
                      {gruposOrdenados.map((grupo) => (
                        <div key={grupo.key}>
                          {/* Solo mostrar tabla de transacciones */}
                          <TransactionsTable
                            data={grupo.data}
                            onEdit={onEditTransaction}
                            onDelete={handleDelete}
                            onView={onViewTransaction}
                            onChangeStatus={onChangeStatus}
                            hiddenColumns={hiddenColumns}
                          />
                        </div>
                      ))}

                      {/* Si no hay grupos, mostrar tabla normal */}
                      {gruposOrdenados.length === 0 && (
                        <TransactionsTable
                          data={transactions}
                          onEdit={onEditTransaction}
                          onDelete={handleDelete}
                          onView={onViewTransaction}
                          onChangeStatus={onChangeStatus}
                          hiddenColumns={hiddenColumns}
                        />
                      )}
                    </div>

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
                        onCambiarItemsPorPagina={
                          pagination.cambiarItemsPorPagina
                        }
                        hayPaginaAnterior={pagination.hayPaginaAnterior}
                        hayPaginaSiguiente={pagination.hayPaginaSiguiente}
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
            (selectedTransaction?.estadoValidacion === 'validado'
              ? 'completado'
              : selectedTransaction?.estado) || 'pendiente'
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
    visible: true,
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
