'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBanner from '@/components/common/PageBanner';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import FiltrosCaja from '@/components/cajas/FiltrosCaja';
import TablaEncomiendas from '@/components/cajas/TablaEncomiendas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Plus } from 'lucide-react';
import { ColumnaCaja } from '@/types/caja';
import ModalAgregarComanda from '@/components/cajas/ModalAgregarComanda';
import { useInitializeComandaStore } from '@/hooks/useInitializeComandaStore';
import { useCajaIngresos } from '@/features/comandas/hooks/useCajaIngresos';
import { Pagination } from '@/components/ui/pagination';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Caja Chica', href: '/caja-chica' },
  { label: 'Ingresos' },
];

// Configuración de columnas para ingresos - SIMPLIFICADA
const columnasIniciales: ColumnaCaja[] = [
  {
    key: 'fecha',
    label: 'Fecha',
    visible: true,
    sortable: true,
    width: '110px',
  },
  { key: 'numero', label: 'N°', visible: true, sortable: true, width: '80px' },
  { key: 'cliente', label: 'Cliente', visible: true, sortable: true },
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
    key: 'metodoPago',
    label: 'Método',
    visible: true,
    sortable: true,
    width: '100px',
  },
  {
    key: 'vendedor',
    label: 'Vendedor',
    visible: true,
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
  // Inicializar el store
  useInitializeComandaStore();

  // Estado para filtro de fechas
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Estado para evitar problemas de hidratación
  const [isClient, setIsClient] = useState(false);

  // Usar custom hook optimizado con filtro de fechas
  const {
    datosIngresos,
    estadisticas,
    paginacion,
    filtros,
    actualizarFiltros,
    formatearMonto,
    manejarEditar,
    manejarEliminar,
    manejarVer,
  } = useCajaIngresos(dateRange);

  // Estado local simple (UI)
  const [columnas, setColumnas] = useState<ColumnaCaja[]>(columnasIniciales);
  const [mostrarModalComanda, setMostrarModalComanda] = useState(false);

  // Efecto para marcar cuando el componente está hidratado
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Usar datos optimizados del custom hook
  const datosParaMostrar = datosIngresos;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
        {/* Banner más compacto */}
        <PageBanner
          title="Ingresos - Caja Chica"
          imageUrl="/png/imagen2portal.png"
          altText="Banner Ingresos"
          heightClass="h-32 md:h-40"
          imagePosition="object-center"
        />

        <div className="relative -mt-8 h-8 bg-gradient-to-b from-transparent to-[#f9bbc4]/5" />

        {/* Breadcrumbs más compactos */}
        <div className="border-b border-[#f9bbc4]/15 bg-gradient-to-r from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#f9bbc4]/5 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Header compacto con estadísticas esenciales */}
            <div className="mb-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Título y estadísticas en una línea */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-bold text-[#4a3540]">
                    ✨ Gestión de Ingresos
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-[#6b4c57]">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-green-600">
                        {isClient
                          ? formatearMonto(estadisticas.totalIngresos)
                          : '$0'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#f9bbc4]" />
                      <span className="font-medium">Transacciones:</span>
                      <span className="font-bold">
                        {isClient ? estadisticas.cantidadTransacciones : 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#f9bbc4]" />
                      <span className="font-medium">Clientes:</span>
                      <span className="font-bold">
                        {isClient ? estadisticas.cantidadClientes : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Nueva Comanda */}
                <Button
                  onClick={() => setMostrarModalComanda(true)}
                  className="rounded-lg bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] px-6 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-[#e292a3] hover:to-[#d4a7ca] hover:shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Comanda
                </Button>
              </div>
            </div>

            {/* Filtros y herramientas en una sola línea */}
            <div className="mb-6">
              <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Filtro de fechas compacto */}
                    <div className="max-w-xs flex-1">
                      <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        placeholder="Filtrar por fecha"
                        accentColor="#f9bbc4"
                      />
                    </div>

                    {/* Herramientas (Columnas y Exportar) */}
                    <div className="flex items-center gap-3">
                      <FiltrosCaja
                        filtros={filtros}
                        onFiltrosChange={actualizarFiltros}
                        columnas={columnas}
                        onColumnasChange={setColumnas}
                        accentColor="#f9bbc4"
                        showDateFilters={false}
                      />
                    </div>
                  </div>

                  {/* Indicador de filtro activo */}
                  {dateRange && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#6b4c57]">
                      <div className="h-2 w-2 rounded-full bg-[#f9bbc4]"></div>
                      <span>
                        Filtrando del{' '}
                        {dateRange.from?.toLocaleDateString('es-ES')}
                        {dateRange.to &&
                          ` al ${dateRange.to.toLocaleDateString('es-ES')}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* TABLA - PROTAGONISTA */}
            <div className="mb-6">
              <TablaEncomiendas
                data={datosParaMostrar}
                columnas={columnas}
                onEditar={manejarEditar}
                onEliminar={manejarEliminar}
                onVer={manejarVer}
                titulo="📊 Registro de Ingresos"
                accentColor="#f9bbc4"
              />
            </div>

            {/* Paginación */}
            <div className="flex justify-center">
              <Pagination
                paginaActual={paginacion.paginaActual}
                totalPaginas={paginacion.totalPaginas}
                totalItems={paginacion.totalItems}
                itemsPorPagina={paginacion.itemsPorPagina}
                itemInicio={paginacion.itemInicio}
                itemFin={paginacion.itemFin}
                onCambiarPagina={paginacion.irAPagina}
                onCambiarItemsPorPagina={paginacion.cambiarItemsPorPagina}
                hayPaginaAnterior={paginacion.hayPaginaAnterior}
                hayPaginaSiguiente={paginacion.hayPaginaSiguiente}
                className="border-t border-[#f9bbc4]/20 pt-4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar comanda */}
      <ModalAgregarComanda
        isOpen={mostrarModalComanda}
        onClose={() => setMostrarModalComanda(false)}
      />
    </MainLayout>
  );
}
