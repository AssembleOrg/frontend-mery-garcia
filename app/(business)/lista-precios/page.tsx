'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  Scissors,
  GraduationCap,
  Clock,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  FactoryIcon,
} from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import ModalProductoServicio from '@/components/lista-precios/ModalProductoServicio';
import useUnidadNegocioStore from '@/features/productos-servicios/store/unidadNegocioStore';
import { UnidadNegocioNew, FiltrarProductosServiciosNew, ProductoServicioNew, TipoProductoServicioNew } from '@/services/unidadNegocio.service';
import useProductosServiciosStore from '@/features/productos-servicios/store/productosServiciosStore';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Lista de Precios' },
];

const tiposProducto = [
  { value: 'todos', label: 'Todos los Tipos' },
  { value: 'producto', label: 'Productos' },
  { value: 'servicio', label: 'Servicios' },
];

export default function ListaPreciosPage() {
  const { 
    productosServiciosPaginados,
    isLoading, 
    error, 
    loadProductosServicios, 
    crearProductoServicio,
    reloadProductosServiciosPaginados,
    getProductosServiciosPaginados,
    cambiarEstado,
    clear 
  } = useProductosServiciosStore();

  // Store de unidades de negocio
  const { 
    crearUnidadNegocio, 
    isLoading: isLoadingUnidades, 
    reloadUnidadNegocio,
    unidadesNegocio,
    loadUnidadNegocio
  } = useUnidadNegocioStore();

  const { formatARS, formatUSD, formatARSFromNative } = useCurrencyConverter();

  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [busquedaTemporal, setBusquedaTemporal] = useState('');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<string>('todas');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<
    'todos' | 'producto' | 'servicio'
  >('todos');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(20);

  // Estados para modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalNuevaUnidad, setModalNuevaUnidad] = useState(false);
  const [nombreNuevaUnidad, setNombreNuevaUnidad] = useState('');
  const [productoServicioSeleccionado, setProductoServicioSeleccionado] = useState<ProductoServicioNew | null>(null);
  const [alertaEliminar, setAlertaEliminar] = useState<ProductoServicioNew | null>(
    null
  );
  const [dialogCambiarEstado, setDialogCambiarEstado] = useState<{
    isOpen: boolean;
    producto: ProductoServicioNew | null;
    nuevoEstado: boolean;
  }>({
    isOpen: false,
    producto: null,
    nuevoEstado: false,
  });

  // Función para construir filtros
  const construirFiltros = useCallback((): FiltrarProductosServiciosNew => {
    const filtros: FiltrarProductosServiciosNew = {
      page: paginaActual,
      limit: itemsPorPagina,
      orderBy: 'createdAt',
      orderDirection: 'DESC' as const
    };
    
    if (busqueda.trim()) {
      filtros.nombre = busqueda.trim();
    }
    
    if (unidadSeleccionada !== 'todas') {
      // TODO: Ajustar cuando se conozca el nombre correcto de la propiedad
      // filtros.businessUnit = unidadSeleccionada;
    }
    
    if (tipoSeleccionado !== 'todos') {
      // TODO: Ajustar cuando se conozca el tipo correcto
      // filtros.tipo = tipoSeleccionado;
    }
    
    if (!mostrarInactivos) {
      filtros.activo = true;
    }
    
    return filtros;
  }, [busqueda, unidadSeleccionada, tipoSeleccionado, mostrarInactivos, paginaActual, itemsPorPagina]);

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    const filtros = construirFiltros();
    getProductosServiciosPaginados(filtros);
  }, [construirFiltros, getProductosServiciosPaginados]);

  // Cargar unidades de negocio
  useEffect(() => {
    loadUnidadNegocio();
  }, [loadUnidadNegocio]);

  // Función para cambiar página
  const handleCambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
  };

  // Función para cambiar items por página
  const handleCambiarItemsPorPagina = (nuevosItems: number) => {
    setItemsPorPagina(nuevosItems);
    setPaginaActual(1); // Resetear a la primera página
  };

  // Función para aplicar filtros (resetea a página 1)
  const aplicarFiltros = () => {
    setPaginaActual(1);
  };

  // Aplicar filtros cuando cambien los valores de filtro (excepto búsqueda)
  useEffect(() => {
    aplicarFiltros();
  }, [unidadSeleccionada, tipoSeleccionado, mostrarInactivos]);

  // Función para buscar
  const handleBuscar = () => {
    setBusqueda(busquedaTemporal);
    setPaginaActual(1);
  };

  // Función para manejar Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const formatAmount = (item: any) => {
    const { precio, esPrecioCongelado, precioFijoARS } = item;
    
    if (esPrecioCongelado && precioFijoARS) {
      // Precio congelado: mostrar USD calculado + ARS fijo
      return {
        ars: formatARSFromNative(precioFijoARS),
        usd: formatUSD(precio),
        esCongelado: true,
      };
    }
    
    // Precio normal: USD + ARS calculado dinámicamente
    return {
      ars: formatARS(precio),
      usd: formatUSD(precio),
      esCongelado: false,
    };
  };

  const obtenerIconoUnidad = (unidad: string) => {
    switch (unidad) {
      case 'estilismo':
        return <Scissors className="h-4 w-4" />;
      case 'tattoo':
        return <Edit className="h-4 w-4" />;
      case 'formacion':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const obtenerColorUnidad = (unidad: string) => {
    switch (unidad) {
      case 'estilismo':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'tattoo':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'formacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleNuevoProducto = () => {
    setProductoServicioSeleccionado(null);
    setModalAbierto(true);
  };

  const handleEditarProducto = (producto: ProductoServicioNew) => {
    setProductoServicioSeleccionado(producto);
    setModalAbierto(true);
  };

  const handleCambiarEstado = (producto: ProductoServicioNew) => {
    setDialogCambiarEstado({
      isOpen: true,
      producto,
      nuevoEstado: !producto.activo,
    });
  };

  const confirmarCambiarEstado = async () => {
    if (dialogCambiarEstado.producto) {
      try {
        await cambiarEstado(dialogCambiarEstado.producto.id, dialogCambiarEstado.nuevoEstado);
        setDialogCambiarEstado({ isOpen: false, producto: null, nuevoEstado: false });
        // Recargar los datos para reflejar el cambio
        const filtros = construirFiltros();
        getProductosServiciosPaginados(filtros);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
      }
    }
  };

  // const handleEliminarProducto = (producto: ProductoServicio) => {
  //   // TODO: Implementar cuando esté disponible en el store
  //   setAlertaEliminar(producto);
  // };

  // const confirmarEliminar = async () => {
  //   // TODO: Implementar cuando esté disponible en el store
  //   if (alertaEliminar) {
  //     // await eliminarProductoServicio(alertaEliminar.id);
  //     setAlertaEliminar(null);
  //   }
  // };

  const handleRefresh = () => {
    const filtros = construirFiltros();
    getProductosServiciosPaginados(filtros);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setBusquedaTemporal('');
    setUnidadSeleccionada('todas');
    setTipoSeleccionado('todos');
    setMostrarInactivos(false);
    setPaginaActual(1);
  };

  const handleNuevaUnidad = () => {
    setModalNuevaUnidad(true);
    setNombreNuevaUnidad('');
  };

  const handleCrearUnidad = async () => {
    if (!nombreNuevaUnidad.trim()) return;
    
    try {
      await crearUnidadNegocio({ nombre: nombreNuevaUnidad.trim() });
      setModalNuevaUnidad(false);
      setNombreNuevaUnidad('');
      
      // Recargar las unidades de negocio desde el store
      await reloadUnidadNegocio();
      
      // Recargar la lista de productos para mostrar la nueva unidad
      const filtros = construirFiltros();
      getProductosServiciosPaginados(filtros);
    } catch (error) {
      console.error('Error al crear unidad de negocio:', error);
    }
  };

  // Información de paginación (usando datos del store)
  const paginationInfo = useMemo(() => {
    return {
      paginaActual: paginaActual,
      totalPaginas: productosServiciosPaginados.meta.totalPages,
      totalItems: productosServiciosPaginados.meta.total,
      itemsPorPagina: itemsPorPagina,
      itemInicio: (paginaActual - 1) * itemsPorPagina + 1,
      itemFin: Math.min(paginaActual * itemsPorPagina, productosServiciosPaginados.meta.total),
      hayPaginaAnterior: paginaActual > 1,
      hayPaginaSiguiente: paginaActual < productosServiciosPaginados.meta.totalPages,
    };
  }, [productosServiciosPaginados.meta.total, paginaActual, itemsPorPagina, productosServiciosPaginados.meta.totalPages]);

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Lista de Precios" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Header con estadísticas */}
              <div className="mb-4 text-center">
                <h1 className="mb-2 text-2xl font-bold text-[#4a3540]">
                  Lista de Precios
                </h1>
                <p className="text-[#6b4c57]">
                  Gestiona tu catálogo de productos y servicios
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-4">
                  <Badge variant="outline" className="px-2 py-1 text-xs sm:px-3 sm:text-sm">
                    {paginationInfo.totalItems} Total
                  </Badge>
                  <Badge variant="outline" className="px-2 py-1 text-xs sm:px-3 sm:text-sm">
                    Página {paginationInfo.paginaActual} de {paginationInfo.totalPaginas}
                  </Badge>
                  {!mostrarInactivos && (
                    <Badge variant="default" className="bg-green-100 text-green-800 px-2 py-1 text-xs sm:px-3 sm:text-sm">
                      Solo Activos
                    </Badge>
                  )}
                  {mostrarInactivos && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs sm:px-3 sm:text-sm">
                      Incluye Inactivos
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clear}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}

              {/* Filtros y acciones - Nuevo diseño */}
              <div className="mb-6 space-y-4">
                {/* Header con acciones principales */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f9bbc4] to-[#e292a3] shadow-lg">
                      <Filter className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#4a3540]">Filtros y Búsqueda</h3>
                      <p className="text-sm text-[#6b4c57]">Encuentra exactamente lo que necesitas</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="border-[#f9bbc4]/30 hover:bg-[#f9bbc4]/10 text-xs sm:text-sm shadow-sm"
                    >
                      <RefreshCw className={`mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Actualizar</span>
                      <span className="sm:hidden">Actualizar</span>
                    </Button>
                    <Button
                      onClick={handleNuevaUnidad}
                      className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d48594] text-xs sm:text-sm shadow-lg"
                      disabled={isLoadingUnidades}
                    >
                      <Package className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Nueva Unidad</span>
                      <span className="sm:hidden">Unidad</span>
                    </Button>
                    <Button
                      onClick={handleNuevoProducto}
                      className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d48594] text-xs sm:text-sm shadow-lg"
                      disabled={isLoading}
                    >
                      <Plus className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Nuevo Producto/Servicio</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </div>
                </div>

                {/* Filtros organizados */}
                <Card className="border-0 bg-gradient-to-br from-white/95 via-white/90 to-[#f9bbc4]/5 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Búsqueda principal */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <Search className="h-5 w-5 text-[#6b4c57]" />
                        </div>
                        <Input
                          placeholder="Buscar productos o servicios por nombre..."
                          value={busquedaTemporal}
                          onChange={(e) => setBusquedaTemporal(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-12 pl-10 pr-12 text-sm border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20"
                          disabled={isLoading}
                        />
                        <Button
                          onClick={handleBuscar}
                          disabled={isLoading || !busquedaTemporal.trim()}
                          className="absolute inset-y-0 right-0 h-full px-3 bg-[#f9bbc4] hover:bg-[#e292a3] text-white rounded-l-none"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Filtros secundarios */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Unidad de Negocio */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#6b4c57] uppercase tracking-wide">
                            Unidad de Negocio
                          </label>
                          <Select
                            value={unidadSeleccionada}
                            onValueChange={(value) =>
                              setUnidadSeleccionada(value)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger className="h-10 text-sm border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="todas" value="todas">Todas</SelectItem>
                              {unidadesNegocio.map((unidad) => (
                                <SelectItem key={unidad.id} value={unidad.nombre}>
                                  <div className="flex items-center gap-2">
                                    <FactoryIcon className="h-4 w-4" />
                                    <span className="text-sm">{unidad.nombre}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tipo */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#6b4c57] uppercase tracking-wide">
                            Tipo
                          </label>
                          <Select
                            value={tipoSeleccionado}
                            onValueChange={(value) =>
                              setTipoSeleccionado(
                                value as 'todos' | 'producto' | 'servicio'
                              )
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger className="h-10 text-sm border-[#f9bbc4]/20 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]/20">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposProducto.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  <span className="text-sm">{tipo.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Toggle Inactivos */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#6b4c57] uppercase tracking-wide">
                            Estado
                          </label>
                          <Button
                            variant="outline"
                            onClick={() => setMostrarInactivos(!mostrarInactivos)}
                            className={`h-10 w-full justify-start text-xs sm:text-sm border-[#f9bbc4]/20 hover:bg-[#f9bbc4]/10 ${mostrarInactivos ? 'bg-[#f9bbc4]/20 border-[#f9bbc4]' : ''}`}
                            disabled={isLoading}
                          >
                            {mostrarInactivos ? (
                              <ToggleRight className="mr-2 h-4 w-4" />
                            ) : (
                              <ToggleLeft className="mr-2 h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Mostrar inactivos</span>
                            <span className="sm:hidden">Inactivos</span>
                          </Button>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-[#6b4c57] uppercase tracking-wide">
                            Acciones
                          </label>
                          <Button
                            variant="outline"
                            onClick={limpiarFiltros}
                            disabled={isLoading}
                            className="h-10 w-full text-xs sm:text-sm border-[#f9bbc4]/20 hover:bg-[#f9bbc4]/10"
                          >
                            Limpiar Filtros
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de productos/servicios */}
              <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Catálogo
                    </div>
                    <Badge variant="secondary">
                      {paginationInfo.totalItems} elementos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Indicador de carga superpuesto */}
                  <div className="relative">
                    {isLoading && productosServiciosPaginados.data.length > 0 && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f9bbc4] border-t-transparent"></div>
                          <span className="text-sm text-gray-600">Cargando...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Nombre</TableHead>
                          <TableHead className="text-xs sm:text-sm">Tipo</TableHead>
                          <TableHead className="text-xs sm:text-sm">Unidad</TableHead>
                          <TableHead className="text-xs sm:text-sm">Precio</TableHead>
                          <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                          <TableHead className="text-xs sm:text-sm">Detalles</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && productosServiciosPaginados.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9bbc4] border-t-transparent"></div>
                                <p className="text-gray-500">Cargando productos y servicios...</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : productosServiciosPaginados.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                              <p className="text-lg font-medium text-gray-500">
                                No se encontraron productos o servicios
                              </p>
                              <p className="mt-2 text-sm text-gray-400">
                                Intenta ajustar los filtros o crea un nuevo elemento
                              </p>
                              <Button
                                onClick={handleNuevoProducto}
                                className="mt-4 bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
                                disabled={isLoading}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Primer Elemento
                              </Button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          productosServiciosPaginados.data.map((item) => {
                            const precios = formatAmount(item);
                            return (
                              <TableRow
                                key={item.id}
                                className={`hover:bg-[#f9bbc4]/5 ${!item.activo ? 'opacity-60' : ''}`}
                              >
                                <TableCell>
                                  <div>
                                    <div className="font-medium flex items-center gap-2 text-xs sm:text-sm">
                                      {item.esPrecioCongelado && (
                                        <span className="text-xs">🔒</span>
                                      )}
                                      {item.nombre}
                                    </div>
                                    {item.descripcion && (
                                      <div className="text-xs text-gray-500 sm:text-sm">
                                        {item.descripcion}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      item.tipo === TipoProductoServicioNew.SERVICIO
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className="capitalize text-xs"
                                  >
                                    {item.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={`capitalize text-xs ${obtenerColorUnidad(item.unidadNegocio?.nombre || 'default')}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      {obtenerIconoUnidad(item.unidadNegocio?.nombre || 'default')}
                                      <span className="hidden sm:inline">{item.unidadNegocio?.nombre || 'N/A'}</span>
                                      <span className="sm:hidden">{(item.unidadNegocio?.nombre || 'N/A').slice(0, 3)}</span>
                                    </div>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="font-mono">
                                    <div className="font-semibold text-green-600 text-xs sm:text-sm">
                                      {precios.usd}
                                    </div>
                                    <div className="text-xs text-gray-500 sm:text-sm">
                                      {precios.esCongelado ? '🔒 ' : '≈ '}{precios.ars}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={item.activo ? 'default' : 'secondary'}
                                    className={`text-xs ${item.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                  >
                                    {item.activo ? 'Activo' : 'Inactivo'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {item.tipo === TipoProductoServicioNew.SERVICIO && item.duracion && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                                      <Clock className="h-3 w-3" />
                                      <span className="hidden sm:inline">{item.duracion} min</span>
                                      <span className="sm:hidden">{item.duracion}m</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        disabled={isLoading}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleEditarProducto(item)}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleCambiarEstado(item)}
                                      >
                                        {item.activo ? (
                                          <ToggleLeft className="mr-2 h-4 w-4" />
                                        ) : (
                                          <ToggleRight className="mr-2 h-4 w-4" />
                                        )}
                                        {item.activo ? 'Desactivar' : 'Activar'}
                                      </DropdownMenuItem>
                                      {/* TODO: Implementar cuando esté disponible en el store
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleEliminarProducto(item)
                                        }
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                      </DropdownMenuItem>
                                      */}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Controles de paginación - Estilo de /caja-chica/ingresos */}
                    <div className="mt-6">
                      <Pagination
                        paginaActual={paginationInfo.paginaActual}
                        totalPaginas={paginationInfo.totalPaginas}
                        totalItems={paginationInfo.totalItems}
                        itemsPorPagina={paginationInfo.itemsPorPagina}
                        itemInicio={paginationInfo.itemInicio}
                        itemFin={paginationInfo.itemFin}
                        onCambiarPagina={setPaginaActual}
                        onCambiarItemsPorPagina={setItemsPorPagina}
                        hayPaginaAnterior={paginationInfo.hayPaginaAnterior}
                        hayPaginaSiguiente={paginationInfo.hayPaginaSiguiente}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal para crear/editar producto/servicio */}
        <ModalProductoServicio
          isOpen={modalAbierto}
          onClose={() => {
            setModalAbierto(false);
            setProductoServicioSeleccionado(null);
            reloadProductosServiciosPaginados(construirFiltros());
          }}
          producto={productoServicioSeleccionado}
        />

        {/* Modal para crear nueva unidad de negocio */}
        <Dialog open={modalNuevaUnidad} onOpenChange={setModalNuevaUnidad}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Nueva Unidad de Negocio
              </DialogTitle>
              <DialogDescription>
                Crea una nueva unidad de negocio para organizar tus productos y servicios.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="nombre" className="text-right text-sm font-medium">
                  Nombre
                </label>
                <Input
                  id="nombre"
                  value={nombreNuevaUnidad}
                  onChange={(e) => setNombreNuevaUnidad(e.target.value)}
                  placeholder="Ej: Tattoo, Estilismo, Formación..."
                  className="col-span-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nombreNuevaUnidad.trim()) {
                      handleCrearUnidad();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setModalNuevaUnidad(false)}
                disabled={isLoadingUnidades}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCrearUnidad}
                disabled={!nombreNuevaUnidad.trim() || isLoadingUnidades}
                className="bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white hover:from-[#e292a3] hover:to-[#d48594]"
              >
                {isLoadingUnidades ? 'Creando...' : 'Crear Unidad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para confirmar cambio de estado */}
        <Dialog
          open={dialogCambiarEstado.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDialogCambiarEstado({ isOpen: false, producto: null, nuevoEstado: false });
            }
          }}
        >
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-[#6b4c57]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  dialogCambiarEstado.nuevoEstado 
                    ? 'bg-gradient-to-br from-green-100 to-green-200' 
                    : 'bg-gradient-to-br from-orange-100 to-orange-200'
                }`}>
                  {dialogCambiarEstado.nuevoEstado ? (
                    <ToggleRight className="h-6 w-6 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                {dialogCambiarEstado.nuevoEstado ? 'Activar' : 'Desactivar'} producto/servicio
              </DialogTitle>
              <DialogDescription className="text-[#8b5a6b]">
                ¿Estás seguro de que quieres {dialogCambiarEstado.nuevoEstado ? 'activar' : 'desactivar'} &quot;
                {dialogCambiarEstado.producto?.nombre}&quot;?
                {dialogCambiarEstado.nuevoEstado 
                  ? ' Este elemento estará disponible para su uso.'
                  : ' Este elemento no estará disponible para su uso.'
                }
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-3 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogCambiarEstado({ isOpen: false, producto: null, nuevoEstado: false })}
                disabled={isLoading}
                className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10 hover:border-[#f9bbc4]/50"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarCambiarEstado}
                disabled={isLoading}
                className={`bg-gradient-to-r ${
                  dialogCambiarEstado.nuevoEstado 
                    ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500/20' 
                    : 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500/20'
                } text-white`}
              >
                {isLoading ? 'Procesando...' : (dialogCambiarEstado.nuevoEstado ? 'Activar' : 'Desactivar')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TODO: Alert Dialog para eliminar - implementar cuando esté disponible
        <AlertDialog
          open={!!alertaEliminar}
          onOpenChange={() => setAlertaEliminar(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente &quot;
                {alertaEliminar?.nombre}&quot;. Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarEliminar}
                className="bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        */}
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
