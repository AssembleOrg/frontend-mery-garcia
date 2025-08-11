'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StandardPageBanner from '@/components/common/StandardPageBanner';
import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
import ClientOnly from '@/components/common/ClientOnly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  Calendar,
  Users,
  Activity,
  Package,
  Filter,
  RefreshCw,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import { useAuditoria } from '@/features/activity/store/activityStore';
import {
  ModuloSistema,
  TipoAccion,
  RegistroAuditoria,
} from '@/features/activity/store/activityStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

export default function AuditoriaPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedModulo, setSelectedModulo] = useState<ModuloSistema | 'todos'>(
    'todos'
  );
  const [selectedTipoAccion, setSelectedTipoAccion] = useState<
    TipoAccion | 'todos' | ''
  >('todos');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroAuditoria | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState<{
    totalRegistros: number;
    registrosHoy: number;
    usuariosActivos: number;
    moduloMasActivo: string;
    accionesMasComunes: string[];
  }>({
    totalRegistros: 0,
    registrosHoy: 0,
    usuariosActivos: 0,
    moduloMasActivo: '',
    accionesMasComunes: [],
  });

  const {
    registros,
    registrosPaginados,
    filtros,
    estadisticas,
    isLoading,
    error,
    paginacion,
    cargarAuditoriaPaginada,
    limpiarFiltros,
    obtenerEstadisticas,
    exportarAuditoria,
    exportarAuditoriaPDF,
    limpiarAuditoria,
  } = useAuditoria();


  // Cargar datos iniciales
  useEffect(() => {
    console.warn('cargando datos iniciales');
    cargarAuditoriaPaginada().then(() => {
      console.warn('datos iniciales cargados', registrosPaginados);
    });
  }, [cargarAuditoriaPaginada]);

  // Actualizar estadísticas cuando cambien los registros
  useEffect(() => {
    const newStats = obtenerEstadisticas();
    setStats(newStats);
  }, [registros]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const nuevosFiltros: any = {};

    if (dateRange?.from) {
      nuevosFiltros.fechaInicio = dateRange.from.toISOString().split('T')[0];
    }
    if (dateRange?.to) {
      nuevosFiltros.fechaFin = dateRange.to.toISOString().split('T')[0];
    }

    if (selectedUser) {
      nuevosFiltros.usuarioId = selectedUser;
    }

    if (selectedModulo && selectedModulo !== 'todos') {
      nuevosFiltros.modulo = selectedModulo;
    }

    if (selectedTipoAccion && selectedTipoAccion !== 'todos') {
      nuevosFiltros.tipoAccion = selectedTipoAccion;
    }

    cargarAuditoriaPaginada(nuevosFiltros);
  }, [dateRange, selectedUser, selectedModulo, selectedTipoAccion]);

  // Función para limpiar todos los filtros
  const handleLimpiarFiltros = () => {
    setDateRange(undefined);
    setSelectedUser('');
    setSelectedModulo('todos');
    setSelectedTipoAccion('todos');
    limpiarFiltros();
    cargarAuditoriaPaginada();
  };

  // Función para exportar auditoría
  const handleExportarAuditoria = () => {
    exportarAuditoria();
  };

  // Función para exportar PDF
  const handleExportarPDF = () => {
    exportarAuditoriaPDF();
  };

  // Función para limpiar auditoría
  const handleLimpiarAuditoria = () => {
    if (
      window.confirm(
        '¿Está seguro de que desea limpiar todos los registros de auditoría? Esta acción no se puede deshacer.'
      )
    ) {
      limpiarAuditoria();
    }
  };

  // Función para recargar datos
  const handleRecargar = () => {
    cargarAuditoriaPaginada();
  };

  // Función para cargar más registros
  const handleCargarMas = () => {
    if (paginacion && paginacion.hasNextPage) {
      const nuevosFiltros = {
        ...filtros,
        page: (paginacion.page || 1) + 1,
      };
      cargarAuditoriaPaginada(nuevosFiltros);
    }
  };

  // Función para manejar click en row
  const handleRowClick = (registro: RegistroAuditoria) => {
    setSelectedRegistro(registro);
    setShowDetailsModal(true);
  };

  const breadcrumbItems = [
    { label: 'Caja Grande', href: '/caja-grande' },
    { label: 'Auditoría', href: '/caja-grande/auditoria' },
  ];

  // Función para determinar el color del badge según el tipo de acción
  const getBadgeColor = (tipoAccion: TipoAccion) => {
    if (tipoAccion.includes('_creado') || tipoAccion.includes('_creada')) {
      return 'border-green-200 text-green-700 bg-green-50';
    } else if (
      tipoAccion.includes('_modificado') ||
      tipoAccion.includes('_modificada')
    ) {
      return 'border-blue-200 text-blue-700 bg-blue-50';
    } else if (
      tipoAccion.includes('_eliminado') ||
      tipoAccion.includes('_eliminada')
    ) {
      return 'border-red-200 text-red-700 bg-red-50';
    } else if (
      tipoAccion.includes('_restaurado') ||
      tipoAccion.includes('_restaurada')
    ) {
      return 'border-orange-200 text-orange-700 bg-orange-50';
    } else {
      return 'border-gray-200 text-gray-700 bg-gray-50';
    }
  };

  return (
    <MainLayout>
      <ManagerOrAdminOnly>
        <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
          <StandardPageBanner title="Auditoría del Sistema" />

          <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

          <ClientOnly>
            <StandardBreadcrumbs items={breadcrumbItems} />

            <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
              <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                {/* Statistics Cards */}
                <div className="mx-auto max-w-4xl">
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Registros
                            </p>
                            <p className="text-2xl font-bold text-[#4a3540]">
                              {stats.totalRegistros}
                            </p>
                          </div>
                          <Activity className="h-8 w-8 text-[#f9bbc4]" />
                        </div>
                      </CardContent>
                    </Card> */}

                    {/* <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Registros Hoy
                            </p>
                            <p className="text-2xl font-bold text-[#4a3540]">
                              {stats.registrosHoy}
                            </p>
                          </div>
                          <Calendar className="h-8 w-8 text-[#f9bbc4]" />
                        </div>
                      </CardContent>
                    </Card> */}
{/* 
                    <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Usuarios Activos
                            </p>
                            <p className="text-2xl font-bold text-[#4a3540]">
                              {stats.usuariosActivos}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-[#f9bbc4]" />
                        </div>
                      </CardContent>
                    </Card> */}
{/* 
                    <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Módulo Más Activo
                            </p>
                            <p className="text-lg font-bold text-[#4a3540]">
                              {stats.moduloMasActivo || 'N/A'}
                            </p>
                          </div>
                          <Package className="h-8 w-8 text-[#f9bbc4]" />
                        </div>
                      </CardContent>
                    </Card> */}
                  </div>

                  {/* Filters */}
                  <Card className="mb-6 border border-[#f9bbc4]/20 bg-white shadow-sm">
                    <CardHeader className="bg-white">
                      <CardTitle className="text-lg text-[#4a3540]">
                        Consultar Auditoría
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 bg-white">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Date Range Filter */}
                        <div className="sm:col-span-2">
                          <Label htmlFor="date-range" className="text-gray-700">
                            Rango de Fechas
                          </Label>
                          <div className="relative mt-1">
                            <DateRangePicker
                              dateRange={dateRange}
                              onDateRangeChange={setDateRange}
                              placeholder="Seleccionar rango de fechas"
                            />
                          </div>
                        </div>

                        {/* User Filter */}
                        {/* <div>
                          <Label htmlFor="user-filter" className="text-gray-700">
                            Usuario ID
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id="user-filter"
                              value={selectedUser}
                              onChange={(e) => setSelectedUser(e.target.value)}
                              placeholder="Buscar por usuario ID..."
                              className="border-gray-300 bg-white pr-8"
                              onFocus={() => setShowUserSearch(true)}
                              onBlur={() =>
                                setTimeout(() => setShowUserSearch(false), 200)
                              }
                            />
                            <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div> */}

                        {/* Module Filter */}
                        <div>
                          <Label htmlFor="module-filter" className="text-gray-700">
                            Módulo
                          </Label>
                          <Select
                            value={selectedModulo}
                            onValueChange={(value: ModuloSistema | 'todos') =>
                              setSelectedModulo(value)
                            }
                          >
                            <SelectTrigger className="mt-1 border-gray-300 bg-white">
                              <SelectValue placeholder="Todos los módulos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-gray-600" />
                                  <span>Todos los módulos</span>
                                </div>
                              </SelectItem>
                              {Object.values(ModuloSistema).map((modulo) => (
                                <SelectItem key={modulo} value={modulo}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span>{modulo}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Action Type Filter */}
                        <div>
                          <Label htmlFor="action-filter" className="text-gray-700">
                            Tipo de Acción
                          </Label>
                          <Select
                            value={selectedTipoAccion}
                            onValueChange={(value: TipoAccion | 'todos') => {
                                console.warn('value2', value);
                              if(value === 'todos') {
                                setSelectedTipoAccion('');
                              } else {
                                setSelectedTipoAccion(value);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1 border-gray-300 bg-white">
                              <SelectValue placeholder="Todas las acciones" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-gray-600" />
                                  <span>Todas las acciones</span>
                                </div>
                              </SelectItem>
                              {Object.values(TipoAccion).map((accion) => (
                                <SelectItem key={accion} value={accion}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span>{accion}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLimpiarFiltros}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Limpiar Filtros
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRecargar}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          disabled={isLoading}
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                          />
                          Recargar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportarAuditoria}
                          className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Exportar CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportarPDF}
                          className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar PDF
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLimpiarAuditoria}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Limpiar Todo
                        </Button> */}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Auditoría Table */}
                <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
                  <CardHeader className="bg-white">
                    <CardTitle className="text-lg text-[#4a3540]">
                      Registros de Auditoría (
                      {Array.isArray(registrosPaginados)
                        ? registrosPaginados.length
                        : 0}
                      )
                      {isLoading && (
                        <span className="ml-2 text-sm text-gray-500">
                          Cargando...
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white">
                    {error && (
                      <div className="mb-4 rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-600">Error: {error}</p>
                      </div>
                    )}

                    {(!Array.isArray(registrosPaginados) ||
                      registrosPaginados.length === 0) &&
                    !isLoading ? (
                      <div className="py-12 text-center">
                        <Activity className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No hay registros de auditoría
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No se encontraron registros para los filtros
                          seleccionados.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha y Hora</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Tipo de Acción</TableHead>
                                <TableHead>Módulo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Observaciones</TableHead>
                                <TableHead>IP Address</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Array.isArray(registrosPaginados) &&
                                registrosPaginados.map((registro) => (
                                  <TableRow 
                                    key={registro.id}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => handleRowClick(registro)}
                                  >
                                    <TableCell className="font-mono text-sm">
                                      {format(
                                        new Date(registro.createdAt),
                                        'dd/MM/yyyy HH:mm:ss',
                                        { locale: es }
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {registro.usuario?.nombre ||
                                        registro.usuario?.email ||
                                        registro.usuario?.id}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getBadgeColor(
                                          registro.tipoAccion
                                        )}
                                      >
                                        {registro.tipoAccion}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {registro.modulo}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-sm text-gray-600">
                                      {registro.descripcion}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-sm text-gray-500">
                                      {registro.observaciones || '-'}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-gray-500">
                                      {registro.ipAddress || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination Info */}
                        {paginacion && paginacion.total > 0 && (
                          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <span>
                              Mostrando{' '}
                              {Array.isArray(registrosPaginados)
                                ? registrosPaginados.length
                                : 0}{' '}
                              de {paginacion.total} registros
                              {paginacion.page && paginacion.totalPages && (
                                <span className="ml-2">
                                  (Página {paginacion.page} de{' '}
                                  {paginacion.totalPages})
                                </span>
                              )}
                            </span>
                            {paginacion.hasNextPage && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCargarMas}
                                disabled={isLoading}
                              >
                                Cargar más
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </ClientOnly>

          {/* Modal de Detalles */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg text-[#4a3540] flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[#f9bbc4]" />
                  Detalles del Registro de Auditoría
                </DialogTitle>
              </DialogHeader>
              {selectedRegistro && (
                <div className="space-y-4">
                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">ID</Label>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedRegistro.id}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Fecha y Hora</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {format(new Date(selectedRegistro.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Usuario</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRegistro.usuario?.nombre || selectedRegistro.usuario?.email || selectedRegistro.usuario?.id}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">IP Address</Label>
                      <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                        {selectedRegistro.ipAddress || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Tipo de acción y módulo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Tipo de Acción</Label>
                      <Badge variant="outline" className={getBadgeColor(selectedRegistro.tipoAccion)}>
                        {selectedRegistro.tipoAccion}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Módulo</Label>
                      <Badge variant="secondary" className="text-xs">
                        {selectedRegistro.modulo}
                      </Badge>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {selectedRegistro.descripcion}
                    </p>
                  </div>

                  {/* Observaciones */}
                  {selectedRegistro.observaciones && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Observaciones</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                        {selectedRegistro.observaciones}
                      </p>
                    </div>
                  )}

                  {/* Datos anteriores y nuevos */}
                  {(selectedRegistro.datosAnteriores || selectedRegistro.datosNuevos) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRegistro.datosAnteriores && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Datos Anteriores</Label>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
                            {JSON.stringify(selectedRegistro.datosAnteriores, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedRegistro.datosNuevos && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Datos Nuevos</Label>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
                            {JSON.stringify(selectedRegistro.datosNuevos, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Agent */}
                  {selectedRegistro.userAgent && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">User Agent</Label>
                      <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
                        {selectedRegistro.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </ManagerOrAdminOnly>
    </MainLayout>
  );
}
