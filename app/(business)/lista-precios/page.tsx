'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { UnidadNegocio, ProductoServicio } from '@/types/caja';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import ModalProductoServicio from '@/components/lista-precios/ModalProductoServicio';

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Lista de Precios' },
];

const unidadesNegocio: {
  value: UnidadNegocio | 'todas';
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'todas',
    label: 'Todas las Unidades',
    icon: <Package className="h-4 w-4" />,
  },
  {
    value: 'estilismo',
    label: 'Estilismo',
    icon: <Scissors className="h-4 w-4" />,
  },
  { value: 'tattoo', label: 'Tattoo', icon: <Edit className="h-4 w-4" /> },
  {
    value: 'formacion',
    label: 'Formación',
    icon: <GraduationCap className="h-4 w-4" />,
  },
];

const tiposProducto = [
  { value: 'todos', label: 'Todos los Tipos' },
  { value: 'producto', label: 'Productos' },
  { value: 'servicio', label: 'Servicios' },
];

export default function ListaPreciosPage() {
  const { productosServicios, eliminarProductoServicio } = useDatosReferencia();

  const { formatARS, formatUSD } = useCurrencyConverter();

  // Estados para filters
  const [busqueda, setBusqueda] = useState('');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<
    UnidadNegocio | 'todas'
  >('todas');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<
    'todos' | 'producto' | 'servicio'
  >('todos');

  // Estados para modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] =
    useState<ProductoServicio | null>(null);
  const [alertaEliminar, setAlertaEliminar] = useState<ProductoServicio | null>(
    null
  );

  // Filtrar productos/servicios
  const productosFiltrados = productosServicios.filter((item) => {
    const cumpleBusqueda =
      !busqueda ||
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(busqueda.toLowerCase());

    const cumpleUnidad =
      unidadSeleccionada === 'todas' ||
      item.businessUnit === unidadSeleccionada;
    const cumpleTipo =
      tipoSeleccionado === 'todos' || item.tipo === tipoSeleccionado;
    const cumpleActivo = item.activo;

    return cumpleBusqueda && cumpleUnidad && cumpleTipo && cumpleActivo;
  });

  const formatAmount = (monto: number) => {
    return {
      ars: formatARS(monto),
      usd: formatUSD(monto),
    };
  };

  const obtenerIconoUnidad = (unidad: UnidadNegocio) => {
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

  const obtenerColorUnidad = (unidad: UnidadNegocio) => {
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
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const handleEditarProducto = (producto: ProductoServicio) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  const handleEliminarProducto = (producto: ProductoServicio) => {
    setAlertaEliminar(producto);
  };

  const confirmarEliminar = () => {
    if (alertaEliminar) {
      eliminarProductoServicio(alertaEliminar.id);
      setAlertaEliminar(null);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setUnidadSeleccionada('todas');
    setTipoSeleccionado('todos');
  };

  return (
    <ManagerOrAdminOnly>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/15 via-[#e8b4c6]/12 to-[#d4a7ca]/10">
          <StandardPageBanner title="Lista de Precios" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <StandardBreadcrumbs items={breadcrumbItems} />

          <div className="bg-gradient-to-b from-[#f9bbc4]/8 via-[#e8b4c6]/6 to-[#d4a7ca]/8">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Header simplificado */}
              <div className="mb-4 text-center">
                <h1 className="mb-2 text-2xl font-bold text-[#4a3540]">
                  Lista de Precios
                </h1>
                <p className="text-[#6b4c57]">
                  Gestiona tu catálogo de productos y servicios
                </p>
              </div>

              {/* Filtros y acciones */}
              <Card className="mb-4 border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtros y Búsqueda
                    </CardTitle>
                    <Button
                      onClick={handleNuevoProducto}
                      className="bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Producto/Servicio
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {/* Búsqueda */}
                    <div className="relative md:col-span-2">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar por nombre o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Unidad de Negocio */}
                    <Select
                      value={unidadSeleccionada}
                      onValueChange={(value) =>
                        setUnidadSeleccionada(value as UnidadNegocio | 'todas')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unidad de negocio" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidadesNegocio.map((unidad) => (
                          <SelectItem key={unidad.value} value={unidad.value}>
                            <div className="flex items-center gap-2">
                              {unidad.icon}
                              {unidad.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Tipo */}
                    <Select
                      value={tipoSeleccionado}
                      onValueChange={(value) =>
                        setTipoSeleccionado(
                          value as 'todos' | 'producto' | 'servicio'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposProducto.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={limpiarFiltros}
                        className="flex-1"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de productos/servicios */}
              <Card className="border-2 border-[#f9bbc4]/20 bg-gradient-to-br from-white/95 to-[#f9bbc4]/5">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Catálogo
                    </div>
                    <Badge variant="secondary">
                      {productosFiltrados.length} elementos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Detalles</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosFiltrados.map((item) => {
                          const precios = formatAmount(item.precio);
                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-[#f9bbc4]/5"
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {item.nombre}
                                  </div>
                                  {item.descripcion && (
                                    <div className="text-sm text-gray-500">
                                      {item.descripcion}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.tipo === 'servicio'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="capitalize"
                                >
                                  {item.tipo}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`capitalize ${obtenerColorUnidad(item.businessUnit)}`}
                                >
                                  <div className="flex items-center gap-1">
                                    {obtenerIconoUnidad(item.businessUnit)}
                                    {item.businessUnit}
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-mono">
                                  <div className="font-semibold text-green-600">
                                    {precios.usd}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {precios.ars}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.tipo === 'servicio' && item.duracion && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {item.duracion} min
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
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
                                      onClick={() =>
                                        handleEliminarProducto(item)
                                      }
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {productosFiltrados.length === 0 && (
                      <div className="py-12 text-center">
                        <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">
                          No se encontraron productos o servicios
                        </p>
                        <p className="mt-2 text-sm text-gray-400">
                          Intenta ajustar los filters o crea un nuevo elemento
                        </p>
                        <Button
                          onClick={handleNuevoProducto}
                          className="mt-4 bg-[#f9bbc4] text-white hover:bg-[#e292a3]"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Primer Elemento
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal para crear/editar producto/servicio */}
        <ModalProductoServicio
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          producto={productoEditando}
        />

        {/* Alert Dialog para eliminar */}
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
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
    </ManagerOrAdminOnly>
  );
}
