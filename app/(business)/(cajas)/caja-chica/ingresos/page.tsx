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
import { useRecordsStore } from '@/features/records/store/recordsStore';
import ResidualDisplay from '@/components/cajas/ResidualDisplay';
import { EstadoDeComandaNew, UnidadNegocioNew, TipoDeComandaNew, ComandaNew } from '@/services/unidadNegocio.service';
import useComandaStore from '@/features/comandas/store/comandaStore';
import ModalExportarComandas from '@/components/cajas/ModalExportarComandas';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Calendar, User, Users, FileText, RefreshCw, Download, CheckSquare } from 'lucide-react';

export default function IngresosPage() {
  const { isInitialized } = useCurrencyConverter();

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoDeComandaNew | 'todos'>('todos');
  const [clienteFilter, setClienteFilter] = useState('');
  const [trabajadorFilter, setTrabajadorFilter] = useState('');
  const [creadoPorFilter, setCreadoPorFilter] = useState('');
  const [orderBy, setOrderBy] = useState<'createdAt' | 'numero' | 'tipoDeComanda' | 'estadoDeComanda' | 'creadoPor'>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [incluirTraspasadas, setIncluirTraspasadas] = useState(false);

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

  // Cargar comandas con filtros
  useEffect(() => {
    console.log('cargando comandas con filtros'); 
    
    // Preparar fechas para el backend
    let fechaDesde: string | undefined;
    let fechaHasta: string | undefined;

    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      fechaDesde = fromDate.toISOString();
    }

    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      fechaHasta = toDate.toISOString();
    }

    cargarComandasPaginadas({
      page: paginaActual,
      limit: itemsPorPagina,
      tipoDeComanda: TipoDeComandaNew.INGRESO,
      orderBy,
      order: orderDirection,
      search: searchTerm || undefined,
      estadoDeComanda: estadoFilter === 'todos' ? undefined : estadoFilter,
      clienteId: clienteFilter || undefined,
      trabajadorId: trabajadorFilter || undefined,
      creadoPorId: creadoPorFilter || undefined,
      incluirTraspasadas,
      ...(fechaDesde && { fechaDesde }),
      ...(fechaHasta && { fechaHasta }),
    });
  }, [
    paginaActual, 
    itemsPorPagina, 
    cargarComandasPaginadas, 
    searchTerm, 
    estadoFilter, 
    clienteFilter, 
    trabajadorFilter, 
    creadoPorFilter, 
    orderBy, 
    orderDirection, 
    incluirTraspasadas,
    dateRange
  ]);

  // Local UI state
  const [columns, setColumns] = useState<ColumnaCaja[]>(initialColumns);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setSearchTerm('');
    setEstadoFilter('todos');
    setClienteFilter('');
    setTrabajadorFilter('');
    setCreadoPorFilter('');
    setDateRange(undefined);
    setOrderBy('createdAt');
    setOrderDirection('DESC');
    setIncluirTraspasadas(false);
    setPaginaActual(1);
  };

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

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] px-6 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-[#e292a3] hover:to-[#d4a7ca] hover:shadow-lg"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Transacción
                    </Button>
                    <Button
                      onClick={() => setShowExportModal(true)}
                      variant="outline"
                      className="rounded-lg border-[#f9bbc4] px-6 py-2 font-semibold text-[#4a3540] shadow-md transition-all duration-200 hover:scale-105 hover:bg-[#f9bbc4]/10 hover:shadow-lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filters and tools */}
              <div className="mb-6">
                <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                  <CardContent className="p-6">
                    {/* Header de filtros */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white">
                          <Filter className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#4a3540]">Filtros Avanzados</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={limpiarFiltros}
                        className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                      </Button>
                    </div>

                    {/* Grid de filtros */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {/* Búsqueda */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <Search className="h-4 w-4" />
                          Búsqueda
                        </Label>
                        <Input
                          placeholder="Buscar por número..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                        />
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <FileText className="h-4 w-4" />
                          Estado
                        </Label>
                        <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as EstadoDeComandaNew | 'todos')}>
                          <SelectTrigger className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]">
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los estados</SelectItem>
                            <SelectItem value={EstadoDeComandaNew.PENDIENTE}>Pendiente</SelectItem>
                            {/* <SelectItem value={EstadoDeComandaNew.PAGADA}>Pagada</SelectItem> */}
                            <SelectItem value={EstadoDeComandaNew.CANCELADA}>Cancelada</SelectItem>
                            {/* <SelectItem value={EstadoDeComandaNew.FINALIZADA}>Finalizada</SelectItem> */}
                            <SelectItem value={EstadoDeComandaNew.TRASPASADA}>Traspasada</SelectItem>
                            <SelectItem value={EstadoDeComandaNew.VALIDADO}>Validado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Cliente */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <User className="h-4 w-4" />
                          Cliente
                        </Label>
                        <Input
                          placeholder="Filtrar por cliente..."
                          value={clienteFilter}
                          onChange={(e) => setClienteFilter(e.target.value)}
                          className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                        />
                      </div>

                      {/* Trabajador */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <Users className="h-4 w-4" />
                          Trabajador
                        </Label>
                        <Input
                          placeholder="Filtrar por trabajador..."
                          value={trabajadorFilter}
                          onChange={(e) => setTrabajadorFilter(e.target.value)}
                          className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                        />
                      </div>

                      {/* Creado por */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <User className="h-4 w-4" />
                          Creado por
                        </Label>
                        <Input
                          placeholder="Filtrar por creador..."
                          value={creadoPorFilter}
                          onChange={(e) => setCreadoPorFilter(e.target.value)}
                          className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                        />
                      </div>

                      {/* Ordenar por */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <FileText className="h-4 w-4" />
                          Ordenar por
                        </Label>
                        <Select value={orderBy} onValueChange={(value) => setOrderBy(value as any)}>
                          <SelectTrigger className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Fecha de creación</SelectItem>
                            <SelectItem value="numero">Número</SelectItem>
                            <SelectItem value="tipoDeComanda">Tipo de comanda</SelectItem>
                            <SelectItem value="estadoDeComanda">Estado</SelectItem>
                            <SelectItem value="creadoPor">Creado por</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dirección de orden */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <FileText className="h-4 w-4" />
                          Dirección
                        </Label>
                        <Select value={orderDirection} onValueChange={(value) => setOrderDirection(value as 'ASC' | 'DESC')}>
                          <SelectTrigger className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DESC">Descendente</SelectItem>
                            <SelectItem value="ASC">Ascendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro de fechas */}
                      <div className="space-y-2 md:col-span-2 lg:col-span-1">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <Calendar className="h-4 w-4" />
                          Rango de fechas
                        </Label>
                        <DateRangePicker
                          dateRange={dateRange}
                          onDateRangeChange={setDateRange}
                          placeholder="Seleccionar fechas"
                          accentColor="#f9bbc4"
                        />
                      </div>

                      {/* Incluir Traspasadas */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-[#4a3540]">
                          <CheckSquare className="h-4 w-4" />
                          Opciones adicionales
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="incluir-traspasadas"
                            checked={incluirTraspasadas}
                            onCheckedChange={(checked) => setIncluirTraspasadas(checked as boolean)}
                          />
                          <label
                            htmlFor="incluir-traspasadas"
                            className="text-sm text-[#4a3540]"
                          >
                            Incluir Traspasadas
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Indicadores de filtros activos */}
                    {(searchTerm || (estadoFilter && estadoFilter !== 'todos') || clienteFilter || trabajadorFilter || creadoPorFilter || dateRange || incluirTraspasadas) && (
                      <div className="mt-4 rounded-lg bg-gradient-to-r from-[#f9bbc4]/10 to-[#e292a3]/10 border border-[#f9bbc4]/20 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-[#f9bbc4]"></div>
                          <span className="text-sm font-medium text-[#4a3540]">Filtros activos:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-[#6b4c57]">
                          {searchTerm && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Búsqueda: "{searchTerm}"
                            </span>
                          )}
                          {estadoFilter && estadoFilter !== 'todos' && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Estado: {estadoFilter}
                            </span>
                          )}
                          {clienteFilter && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Cliente: "{clienteFilter}"
                            </span>
                          )}
                          {trabajadorFilter && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Trabajador: "{trabajadorFilter}"
                            </span>
                          )}
                          {creadoPorFilter && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Creado por: "{creadoPorFilter}"
                            </span>
                          )}
                          {dateRange && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Fechas: {dateRange.from?.toLocaleDateString('es-ES')}
                              {dateRange.to && ` - ${dateRange.to.toLocaleDateString('es-ES')}`}
                            </span>
                          )}
                          {incluirTraspasadas && (
                            <span className="rounded-full bg-[#f9bbc4]/20 px-2 py-1">
                              Incluir Traspasadas: Sí
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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
          estadoActual = {
            (selectedTransaction && (selectedTransaction as any).estadoValidacion === 'validado')
              ? 'VALIDADO'
              : ((selectedTransaction?.estadoDeComanda === EstadoDeComandaNew.VALIDADO)
                  ? 'VALIDADO'
                  : (selectedTransaction?.estadoDeComanda === EstadoDeComandaNew.CANCELADA)
                    ? 'CANCELADA'
                    : 'PENDIENTE')
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

        {/* Modal de Exportar Comandas */}
        <ModalExportarComandas
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          comandas={comandasPaginadas.data}
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
  // {
  //   key: 'subtotal',
  //   label: 'Subtotal',
  //   visible: true,
  //   sortable: true,
  //   width: '120px',
  // },
  {
    key: 'total',
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
    key: 'estadoDeComanda',
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
