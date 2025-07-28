'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  DollarSign,
} from 'lucide-react';
import { Cliente } from '@/types/caja';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import ModalCliente from './ModalCliente';

export default function ClientesTab() {
  const {
    clientes,
    cargando,
    error,
    estadisticas,
    pagination,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    cargarClientes,
    cargarClientesPaginados,
    cargarEstadisticas,
    limpiarError,
  } = useClientes();
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [alertaEliminar, setAlertaEliminar] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(20);
  
  // Estados para búsqueda
  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);
  const [busquedaTemporal, setBusquedaTemporal] = useState('');



  // Los datos se cargan desde AppInitializer, no necesitamos cargar aquí
  // useEffect(() => {
  //   console.log('cargando clientes EFFECT - MONTANDO COMPONENTE');
  //   cargarClientes();
  //   cargarEstadisticas();
  // }, []); // Solo se ejecuta al montar

  // Función para construir filtros
  const construirFiltros = useCallback(() => {
    const filtros: any = {
      page: paginaActual,
      limit: itemsPorPagina,
      orderBy: 'tieneSeñas',
      orderDirection: 'DESC' as const
    };
    
    if (busqueda.trim()) {
      filtros.nombre = busqueda.trim();
    }
    
    return filtros;
  }, [busqueda, paginaActual, itemsPorPagina]);

  // Cargar clientes cuando cambien los filtros
  useEffect(() => {
    const filtros = construirFiltros();
    cargarClientesPaginados(filtros);
  }, [construirFiltros, cargarClientesPaginados]);

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

  // Función para ejecutar búsqueda
  const ejecutarBusqueda = () => {
    setBusqueda(busquedaTemporal);
    setModalBusquedaAbierto(false);
    aplicarFiltros();
  };

  // Función para limpiar búsqueda
  const limpiarBusqueda = () => {
    setBusquedaTemporal('');
    setBusqueda('');
    setModalBusquedaAbierto(false);
    aplicarFiltros();
  };

  // Usar clientes del store (ya filtrados por el endpoint)
  const clientesFiltrados = clientes || [];

  // Información de paginación
  const paginationInfo = useMemo(() => {
    if (!pagination) {
      return {
        paginaActual: 1,
        totalPaginas: 1,
        totalItems: clientesFiltrados.length,
        itemsPorPagina: clientesFiltrados.length,
        itemInicio: clientesFiltrados.length > 0 ? 1 : 0,
        itemFin: clientesFiltrados.length,
        hayPaginaAnterior: false,
        hayPaginaSiguiente: false,
      };
    }

    const itemInicio = (pagination.page - 1) * pagination.limit + 1;
    const itemFin = Math.min(pagination.page * pagination.limit, pagination.total);

    return {
      paginaActual: pagination.page,
      totalPaginas: pagination.totalPages,
      totalItems: pagination.total,
      itemsPorPagina: pagination.limit,
      itemInicio: pagination.total > 0 ? itemInicio : 0,
      itemFin,
      hayPaginaAnterior: pagination.page > 1,
      hayPaginaSiguiente: pagination.page < pagination.totalPages,
    };
  }, [pagination, clientesFiltrados.length]);

  const handleNuevoCliente = () => {
    setClienteEditando(null);
    setModalAbierto(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAbierto(true);
  };

  const handleEliminarCliente = (cliente: Cliente) => {
    setAlertaEliminar(cliente);
  };

  const confirmarEliminar = () => {
    if (alertaEliminar) {
      eliminarCliente(alertaEliminar.id);
      setAlertaEliminar(null);
    }
  };

  const handleGuardarCliente = async (
    clienteData: Omit<Cliente, 'id' | 'fechaRegistro' | 'señasDisponibles'>,
    señaInicial?: { ars: number; usd: number },
    señasActuales?: { ars: number; usd: number }
  ) => {
    if (clienteEditando) {
      // Modo edición
      const exito = await actualizarCliente(clienteEditando.id, {
        ...clienteData,
        señaArs: señasActuales?.ars,
        señaUsd: señasActuales?.usd,
      });
      if (exito) {
        setModalAbierto(false);
        setClienteEditando(null);
      }
    } else {
      // Modo creación
      const exito = await crearCliente({
        ...clienteData,
        señaArs: señaInicial?.ars,
        señaUsd: señaInicial?.usd,
      });
      if (exito) {
        setModalAbierto(false);
        setClienteEditando(null);
      }
    }
  };

  // Estadísticas
  const totalClientes = estadisticas?.totalClientes || (clientes?.length || 0);
  const clientesConSeñas = estadisticas?.clientesConSeñas || (clientes?.filter(
    (c) => c.señasDisponibles?.ars > 0 || c.señasDisponibles?.usd > 0
  ).length || 0);
  const totalSeñasArs = estadisticas?.totalSeñasArs || (clientes?.reduce((sum, c) => sum + c.señasDisponibles?.ars, 0) || 0);
  const totalSeñasUsd = estadisticas?.totalSeñasUsd || (clientes?.reduce((sum, c) => sum + c.señasDisponibles?.usd, 0) || 0);

  return (
    <div className="space-y-6">
      {/* Mensaje de error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarError}
              className="text-red-600 hover:text-red-700"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-3">
                <Users className="h-5 w-5 text-[#8b5a6b]" />
              </div>
              <div>
                <p className="text-sm text-[#6b4c57]">Total Clientes</p>
                <p className="text-2xl font-bold text-[#4a3540]">
                  {totalClientes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardContent className="p-9">
            <div className="flex items-center justify-center gap-3">
                <p className="text-2xl text-[#6b4c57] text-center">Con Señas</p>
                <p className="text-2xl font-bold text-green-700 text-center">
                  {clientesConSeñas}
                </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#f9bbc4]/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[#6b4c57]">Total Señas</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-blue-700">
                    {formatARSFromNative(totalSeñasArs)}
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    {formatUSD(totalSeñasUsd)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clientes */}
      <Card className="border-[#f9bbc4]/20 bg-white/90 shadow-lg">
        <CardHeader className="border-b border-[#f9bbc4]/20 bg-gradient-to-r from-[#f9bbc4]/5 to-[#e8b4c6]/5">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] p-2.5 shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#4a3540]">
                  Gestión de Clientes
                </h2>
                <p className="text-sm text-[#6b4c57]">
                  Gestiona tu base de clientes
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="px-2 py-1 text-xs">
                    {paginationInfo.totalItems} Total
                  </Badge>
                  <Badge variant="outline" className="px-2 py-1 text-xs">
                    Página {paginationInfo.paginaActual} de {paginationInfo.totalPaginas}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setBusquedaTemporal(busqueda);
                  setModalBusquedaAbierto(true);
                }}
                variant="outline"
                className="flex items-center gap-2 border-[#f9bbc4]/30 hover:bg-[#f9bbc4]/10 text-[#6b4c57]"
                disabled={cargando}
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar clientes</span>
              </Button>
              <Badge
                variant="secondary"
                className="bg-[#f9bbc4]/20 text-[#6b4c57]"
              >
                {paginationInfo.totalItems} clientes
              </Badge>
              <Button
                onClick={handleNuevoCliente}
                className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-lg hover:from-[#e292a3] hover:to-[#d4a7ca]"
                disabled={cargando}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Cliente
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#f9bbc4]/20">
                  <TableHead className="font-semibold text-[#4a3540]">
                    Cliente
                  </TableHead>
                  <TableHead className="font-semibold text-[#4a3540]">
                    Contacto
                  </TableHead>
                  <TableHead className="font-semibold text-[#4a3540]">
                    Señas (ARS / USD)
                  </TableHead>
                  <TableHead className="font-semibold text-[#4a3540]">
                    Registro
                  </TableHead>
                  <TableHead className="text-right font-semibold text-[#4a3540]">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando && clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f9bbc4] border-t-transparent"></div>
                        <p className="text-gray-500">Cargando clientes...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((cliente: Cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="border-[#f9bbc4]/10 hover:bg-[#f9bbc4]/5"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#4a3540]">
                          {cliente.nombre}
                        </div>
                        {cliente.cuit && (
                          <div className="text-sm text-[#8b5a6b]">
                            CUIT: {cliente.cuit}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {cliente.telefono && (
                          <div className="flex items-center gap-2 text-sm text-[#6b4c57]">
                            <Phone className="h-3 w-3" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-sm text-[#6b4c57]">
                            <Mail className="h-3 w-3" />
                            {cliente.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge
                          variant={'outline'}
                          className={`font-mono ${cliente.señasDisponibles?.ars > 0 ? 'border-blue-300 bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                          {formatARSFromNative(cliente.señasDisponibles?.ars?? 0)}
                        </Badge>
                        <Badge
                          variant={'outline'}
                          className={`font-mono ${cliente.señasDisponibles?.usd > 0 ? 'border-green-300 bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {formatUSD(cliente.señasDisponibles?.usd ?? 0)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-[#8b5a6b]">
                        {new Date(cliente.fechaRegistro).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-[#f9bbc4]/10"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-[#f9bbc4]/20"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEditarCliente(cliente)}
                            className="hover:bg-[#f9bbc4]/10"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEliminarCliente(cliente)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>

            {clientesFiltrados.length === 0 && (
              <div className="py-16 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-gradient-to-r from-[#f9bbc4]/20 to-[#e8b4c6]/20 p-4">
                    <Users className="h-12 w-12 text-[#8b5a6b]" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium text-[#4a3540]">
                  {busqueda
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados'}
                </h3>
                <p className="mb-6 text-[#6b4c57]">
                  {busqueda
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza agregando tu primer cliente para gestionar señas y comandas'}
                </p>
                {!busqueda && (
                  <Button
                    onClick={handleNuevoCliente}
                    className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white shadow-lg hover:from-[#e292a3] hover:to-[#d4a7ca]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primer Cliente
                  </Button>
                )}
              </div>
            )}

            {/* Controles de paginación */}
            <div className="mt-6">
              <Pagination
                paginaActual={paginationInfo.paginaActual}
                totalPaginas={paginationInfo.totalPaginas}
                totalItems={paginationInfo.totalItems}
                itemsPorPagina={paginationInfo.itemsPorPagina}
                itemInicio={paginationInfo.itemInicio}
                itemFin={paginationInfo.itemFin}
                onCambiarPagina={handleCambiarPagina}
                onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
                hayPaginaAnterior={paginationInfo.hayPaginaAnterior}
                hayPaginaSiguiente={paginationInfo.hayPaginaSiguiente}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear/editar cliente */}
      <ModalCliente
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        cliente={clienteEditando}
        onSave={handleGuardarCliente}
      />

      {/* Modal de búsqueda */}
      <Dialog open={modalBusquedaAbierto} onOpenChange={setModalBusquedaAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4a3540]">
              <Search className="h-5 w-5" />
              Buscar Clientes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="busqueda" className="text-sm font-medium text-[#6b4c57]">
                Nombre del cliente
              </label>
              <Input
                id="busqueda"
                placeholder="Escribe el nombre del cliente..."
                value={busquedaTemporal}
                onChange={(e) => setBusquedaTemporal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    ejecutarBusqueda();
                  }
                }}
                className="border-[#f9bbc4]/30 focus:border-[#f9bbc4]"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={limpiarBusqueda}
                className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10"
              >
                Limpiar
              </Button>
              <Button
                onClick={ejecutarBusqueda}
                className="bg-gradient-to-r from-[#f9bbc4] to-[#e8b4c6] text-white hover:from-[#e292a3] hover:to-[#d4a7ca]"
              >
                Buscar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para eliminar */}
      <AlertDialog
        open={!!alertaEliminar}
        onOpenChange={() => setAlertaEliminar(null)}
      >
        <AlertDialogContent className="border-[#f9bbc4]/20 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#4a3540]">
              ¿Eliminar cliente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#6b4c57]">
              Esta acción eliminará permanentemente a &quot;
              {alertaEliminar?.nombre}&quot; y todas sus señas asociadas. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f9bbc4]/30 text-[#6b4c57] hover:bg-[#f9bbc4]/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminar}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
