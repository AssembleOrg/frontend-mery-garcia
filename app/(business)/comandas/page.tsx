// 'use client';

// import { useState, useMemo, useCallback, useEffect } from 'react';
// import MainLayout from '@/components/layout/MainLayout';
// import StandardPageBanner from '@/components/common/StandardPageBanner';
// import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
// import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import {
//   Search,
//   Eye,
//   History,
//   CheckCircle,
//   Clock,
//   Users,
//   FileText,
//   AlertTriangle,
//   Lock,
//   Unlock,
// } from 'lucide-react';
// import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';
// import ModalVerHistorial from '@/components/validacion/ModalVerHistorial';
// import ModalValidarComanda from '@/components/validacion/ModalValidarComanda';
// import ModalCambiarEstado, { EstadoSimple } from '@/components/validacion/ModalCambiarEstado';
// import { logger } from '@/lib/utils';
// import ClientOnly from '@/components/common/ClientOnly';
// import Spinner from '@/components/common/Spinner';
// import { useAuthStore } from '@/features/auth/store/authStore';
// import { Pagination } from '@/components/ui/pagination';
// import useComandaStore from '@/features/comandas/store/comandaStore';

// const breadcrumbItems = [
//   { label: 'Inicio', href: '/' },
//   { label: 'Dashboard', href: '/dashboard' },
//   { label: 'Validación de Comandas' },
// ];

// export default function ComandasPage() {
//   // Store state
//       const { 
//         comandas, 
//         error, 
//         cargando, 
//         pagination, 
//         estadisticas,
//         cargarComandasPaginadas,
//         limpiarError 
//       } = useComandaStore();

//   // Estados de paginación
//   const [paginaActual, setPaginaActual] = useState(1);
//   const [itemsPorPagina, setItemsPorPagina] = useState(20);
//   const [busqueda, setBusqueda] = useState('');
//   const [filtroEstado, setFiltroEstado] = useState<EstadoComanda | 'todos'>('todos');
//   const [filtroUnidadNegocio, setFiltroUnidadNegocio] = useState<UnidadNegocio | 'todas'>('todas');
//   const [filtroEstadoNegocio, setFiltroEstadoNegocio] = useState<EstadoComandaNegocio | 'todos'>('todos');
//   const [filtroEstadoValidacion, setFiltroEstadoValidacion] = useState<EstadoValidacion | 'todos'>('todos');
//   const { user } = useAuthStore();

//   // Local state
//   const [filtroValidacion, setFiltroValidacion] = useState<
//     EstadoValidacion | 'todos'
//   >('todos');
//   const [filtroTipo, setFiltroTipo] = useState<'ingreso' | 'egreso' | 'todos'>(
//     'todos'
//   );

//   // Modal state
//   const [modalVerDetalles, setModalVerDetalles] = useState(false);
//   const [modalVerHistorial, setModalVerHistorial] = useState(false);
//   const [modalValidar, setModalValidar] = useState(false);
//   const [modalCambiarEstado, setModalCambiarEstado] = useState(false);
//   const [comandaSeleccionada, setComandaSeleccionada] = useState<string>('');

//   // User permissions
//   const usuario = user;

//     // Construir filtros para la API
//   const construirFiltros = useCallback(() => {
//     const filtros: any = {
//       page: paginaActual,
//       limit: itemsPorPagina,
//       orderBy: 'numero',
//       order: 'DESC'
//     };

//     if (busqueda.trim()) {
//       filtros.search = busqueda.trim();
//     }

//     if (filtroEstado !== 'todos') {
//       filtros.estado = filtroEstado;
//     }

//     if (filtroUnidadNegocio !== 'todas') {
//       filtros.unidadNegocio = filtroUnidadNegocio;
//     }

//     if (filtroEstadoNegocio !== 'todos') {
//       filtros.estadoNegocio = filtroEstadoNegocio;
//     }

//     if (filtroEstadoValidacion !== 'todos') {
//       filtros.estadoValidacion = filtroEstadoValidacion;
//     }

//     if (filtroTipo !== 'todos') {
//       filtros.tipo = filtroTipo;
//     }

//     return filtros;
//   }, [paginaActual, itemsPorPagina, busqueda, filtroEstado, filtroUnidadNegocio, filtroEstadoNegocio, filtroEstadoValidacion, filtroTipo]);

//   // Cargar comandas cuando cambien los filtros
//   useEffect(() => {
//     cargarComandasPaginadas(construirFiltros());
//   }, [construirFiltros, cargarComandasPaginadas]);

//   // Funciones de paginación
//   const handleCambiarPagina = (nuevaPagina: number) => {
//     setPaginaActual(nuevaPagina);
//   };

//   const handleCambiarItemsPorPagina = (nuevosItems: number) => {
//     setItemsPorPagina(nuevosItems);
//     setPaginaActual(1);
//   };

//   const aplicarFiltros = () => {
//     setPaginaActual(1);
//   };

//   // Información de paginación
//   const paginationInfo = useMemo(() => {
//     if (!pagination) {
//       return {
//         paginaActual: 1,
//         totalPaginas: 1,
//         totalItems: 0,
//         itemsPorPagina: 20,
//         itemInicio: 0,
//         itemFin: 0,
//         hayPaginaAnterior: false,
//         hayPaginaSiguiente: false
//       };
//     }

//     const itemInicio = (pagination.page - 1) * pagination.limit + 1;
//     const itemFin = Math.min(pagination.page * pagination.limit, pagination.total);

//     return {
//       paginaActual: pagination.page,
//       totalPaginas: pagination.totalPages,
//       totalItems: pagination.total,
//       itemsPorPagina: pagination.limit,
//       itemInicio,
//       itemFin,
//       hayPaginaAnterior: pagination.page > 1,
//       hayPaginaSiguiente: pagination.page < pagination.totalPages
//     };
//   }, [pagination]);

//   // Filter comandas (ahora solo para estadísticas locales)
//   const comandasFiltradas = useMemo(() => {
//     return comandas || [];
//   }, [comandas]);

//   const obtenerPermisosComanda = (comanda: Comanda) => {
//     const comandaExtendida = comanda as Comanda & {
//       estadoNegocio?: EstadoComandaNegocio;
//       estadoValidacion?: EstadoValidacion;
//     };

//     const tienePermisoBasico =
//       usuario?.rol === 'admin' || usuario?.rol === 'encargado';

//     // Las comandas completadas (trasladadas a caja 2) solo pueden consultarse
//     const estaCompletada = comandaExtendida.estadoNegocio === 'completado';

//     return {
//       puedeVer: tienePermisoBasico,
//       puedeVerHistorial: tienePermisoBasico,

//       // Solo se puede editar/validar/cambiar estado si NO está completada
//       puedeEditar: tienePermisoBasico && !estaCompletada,
//       puedeValidar: tienePermisoBasico && !estaCompletada,
//       puedeCambiarEstado: tienePermisoBasico && !estaCompletada,
//     };
//   };

//   // Calculate statistics
//   const estadisticasLocales = useMemo(() => {
//     const total = comandas.length;
//     const validadas = comandas.filter(
//       (c) =>
//         (c as Comanda & { estadoValidacion?: EstadoValidacion })
//           .estadoValidacion === 'validado'
//     ).length;
//     const pendientes = total - validadas;

//     const porTipo = {
//       ingresos: comandas.filter((c) => (c as Comanda & { tipo?: TipoComandaEnum }).tipo === TipoComandaEnum.INGRESO).length,
//       egresos: comandas.filter((c) => (c as Comanda & { tipo?: TipoComandaEnum }).tipo === TipoComandaEnum.EGRESO).length,
//     };

//     const porEstadoNegocio = {
//       pendiente: comandas.filter(
//         (c) =>
//           (c as Comanda & { estadoNegocio?: EstadoComandaNegocio })
//             .estadoNegocio === 'pendiente' ||
//           !(c as Comanda & { estadoNegocio?: EstadoComandaNegocio })
//             .estadoNegocio
//       ).length,
//       completado: comandas.filter(
//         (c) =>
//           (c as Comanda & { estadoNegocio?: EstadoComandaNegocio })
//             .estadoNegocio === 'completado'
//       ).length,
//       incompleto: comandas.filter(
//         (c) =>
//           (c as Comanda & { estadoNegocio?: EstadoComandaNegocio })
//             .estadoNegocio === 'incompleto'
//       ).length,
//     };

//     return {
//       total,
//       validadas,
//       pendientes,
//       porcentajeValidado: total > 0 ? Math.round((validadas / total) * 100) : 0,
//       porTipo,
//       porEstadoNegocio,
//     };
//   }, [comandas]);

//   // Format currency
//   const formatearPesos = (amount: number) => {
//     return new Intl.NumberFormat('es-AR', {
//       style: 'currency',
//       currency: 'ARS',
//     }).format(amount);
//   };

//   // Format date
//   const formatearFecha = (fecha: Date | string) => {
//     return new Date(fecha).toLocaleDateString('es-ES', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//     });
//   };

//   // Get status badge style
//   const getEstadoNegocioStyle = (estado?: EstadoComandaNegocio) => {
//     switch (estado) {
//       case 'completado':
//         return 'bg-green-100 text-green-800 border-green-300';
//       case 'incompleto':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-300';
//       case 'pendiente':
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-300';
//     }
//   };

//   const getEstadoNegocioLabel = (estado?: EstadoComandaNegocio) => {
//     switch (estado) {
//       case 'completado':
//         return '✅ Completo';
//       case 'incompleto':
//         return '⚠️ Incompleto';
//       case 'pendiente':
//       default:
//         return '⏳ Pendiente';
//     }
//   };

//   // Handle modal actions
//   const handleVerDetalles = (comandaId: string) => {
//     setComandaSeleccionada(comandaId);
//     setModalVerDetalles(true);
//   };

//   const handleVerHistorial = (comandaId: string) => {
//     setComandaSeleccionada(comandaId);
//     setModalVerHistorial(true);
//   };

//   const handleValidar = (comandaId: string) => {
//     setComandaSeleccionada(comandaId);
//     setModalValidar(true);
//   };

//   const handleCambiarEstado = (comandaId: string) => {
//     setComandaSeleccionada(comandaId);
//     setModalCambiarEstado(true);
//   };

//   // Handle validation success
//   const handleValidacionExitosa = () => {
//     logger.success('Comanda validada exitosamente');
//     // The store will automatically update, so we don't need to refresh manually
//   };

//   // Handle state change success
//   const handleCambioEstadoExitoso = () => {
//     logger.success('Estado de comanda actualizado exitosamente');
//     // The store will automatically update, so we don't need to refresh manually
//   };



//   return (
//     <MainLayout>
//       <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
//         {/* Banner */}
//         <StandardPageBanner title="Validación de Comandas" />

//         <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

//         <ClientOnly>
//           {/* Breadcrumbs */}
//           <StandardBreadcrumbs items={breadcrumbItems} />

//           <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
//             <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
//               {/* Statistics Cards */}
//               <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//                 {/* Total Comandas */}
//                 <Card className="stats-card border border-[#f9bbc4]/20 bg-gradient-to-br from-[#f9bbc4]/10 to-[#e8b4c6]/10 shadow-sm">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="flex items-center justify-between text-sm font-medium text-[#4a3540]">
//                       <span>Total Comandas</span>
//                       <FileText className="h-4 w-4" />
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="stats-value text-[#4a3540]">
//                       {estadisticasLocales.total}
//                     </div>
//                     <p className="mt-1 text-xs text-[#6b4c57]">
//                       {estadisticasLocales.porTipo.ingresos} ingresos,{' '}
//                       {estadisticasLocales.porTipo.egresos} egresos
//                     </p>
//                   </CardContent>
//                 </Card>

//                 {/* Validadas */}
//                 <Card className="stats-card border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="flex items-center justify-between text-sm font-medium text-green-800">
//                       <span>Validadas</span>
//                       <Lock className="h-4 w-4" />
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="stats-value text-green-900">
//                       {estadisticasLocales.validadas}
//                     </div>
//                     <p className="mt-1 text-xs text-green-600">
//                       {estadisticasLocales.porcentajeValidado}% del total
//                     </p>
//                   </CardContent>
//                 </Card>

//                 {/* Pendientes */}
//                 <Card className="stats-card border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 shadow-sm">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="flex items-center justify-between text-sm font-medium text-yellow-800">
//                       <span>Pendientes</span>
//                       <Unlock className="h-4 w-4" />
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="stats-value text-yellow-900">
//                       {estadisticasLocales.pendientes}
//                     </div>
//                     <p className="mt-1 text-xs text-yellow-600">
//                       Requieren validación
//                     </p>
//                   </CardContent>
//                 </Card>

//                 {/* Estados de Negocio */}
//                 <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm">
//                   <CardHeader className="pb-2">
//                     <CardTitle className="flex items-center justify-between text-sm font-medium text-blue-800">
//                       <span>Estados</span>
//                       <Users className="h-4 w-4" />
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-1">
//                       <div className="flex justify-between text-xs">
//                         <span className="text-green-600">Completo:</span>
//                         <span className="font-semibold">
//                           {estadisticasLocales.porEstadoNegocio.completado}
//                         </span>
//                       </div>
//                       <div className="flex justify-between text-xs">
//                         <span className="text-yellow-600">Incompleto:</span>
//                         <span className="font-semibold">
//                           {estadisticasLocales.porEstadoNegocio.incompleto}
//                         </span>
//                       </div>
//                       <div className="flex justify-between text-xs">
//                         <span className="text-gray-600">Pendiente:</span>
//                         <span className="font-semibold">
//                           {estadisticasLocales.porEstadoNegocio.pendiente}
//                         </span>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Filters */}
//               <div className="mb-6">
//                 <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
//                   <CardContent className="p-4">
//                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
//                       {/* Search */}
//                       <div className="lg:col-span-2">
//                         <div className="relative">
//                           <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
//                           <Input
//                             placeholder="Buscar por número, cliente, vendedor..."
//                             value={busqueda}
//                             onChange={(e) => setBusqueda(e.target.value)}
//                             className="pl-10"
//                           />
//                         </div>
//                       </div>

//                       {/* Tipo Filter */}
//                       <div>
//                         <Select
//                           value={filtroTipo}
//                           onValueChange={(
//                             value: 'ingreso' | 'egreso' | 'todos'
//                           ) => setFiltroTipo(value)}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Tipo" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="todos">
//                               Todos los tipos
//                             </SelectItem>
//                             <SelectItem value="ingreso">Ingresos</SelectItem>
//                             <SelectItem value="egreso">Egresos</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       {/* Estado Negocio Filter */}
//                       <div>
//                         <Select
//                           value={filtroEstadoNegocio}
//                           onValueChange={(
//                             value: EstadoComandaNegocio | 'todos'
//                           ) => setFiltroEstadoNegocio(value)}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Estado" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="todos">
//                               Todos los estados
//                             </SelectItem>
//                             <SelectItem value="pendiente">Pendiente</SelectItem>
//                             <SelectItem value="completado">Completo</SelectItem>
//                             <SelectItem value="incompleto">
//                               Incompleto
//                             </SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       {/* Validacion Filter */}
//                       <div>
//                         <Select
//                           value={filtroValidacion}
//                           onValueChange={(value: EstadoValidacion | 'todos') =>
//                             setFiltroValidacion(value)
//                           }
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Validación" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="todos">Todas</SelectItem>
//                             <SelectItem value="no_validado">
//                               Sin validar
//                             </SelectItem>
//                             <SelectItem value="validado">Validadas</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Comandas Table */}
//               <div className="mb-6">
//                 <Card className="border border-[#f9bbc4]/20 bg-white/80 shadow-sm">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2 text-[#4a3540]">
//                       <FileText className="h-5 w-5 text-[#f9bbc4]" />
//                       Comandas para Validación
//                       <Badge variant="outline" className="ml-auto">
//                         {comandasFiltradas.length} de {estadisticasLocales.total}
//                       </Badge>
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="overflow-x-auto">
//                       <Table>
//                         <TableHeader>
//                           <TableRow>
//                             <TableHead>Número</TableHead>
//                             <TableHead>Fecha</TableHead>
//                             <TableHead>Cliente</TableHead>
//                             <TableHead>Tipo</TableHead>
//                             <TableHead>Total</TableHead>
//                             <TableHead>Estado Negocio</TableHead>
//                             <TableHead>Validación</TableHead>
//                             <TableHead>Vendedor</TableHead>
//                             <TableHead>Acciones</TableHead>
//                           </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                           {comandasFiltradas.map((comanda) => {
//                             const comandaExtendida = comanda as Comanda & {
//                               estadoNegocio?: EstadoComandaNegocio;
//                               estadoValidacion?: EstadoValidacion;
//                             };
//                             const permisos = obtenerPermisosComanda(comanda); // Pasar la comanda completa
//                             const estaValidado =
//                               comandaExtendida.estadoValidacion === 'validado';
//                             const estaCompletada =
//                               comandaExtendida.estadoNegocio === 'completado';

//                             return (
//                               <TableRow
//                                 key={comanda.id}
//                                 className={estaValidado ? 'bg-blue-50/50' : ''}
//                               >
//                                 <TableCell className="font-medium">
//                                   {comanda.numero}
//                                 </TableCell>
//                                 <TableCell>
//                                   {formatearFecha(comanda.fecha)}
//                                 </TableCell>
//                                 <TableCell>{comanda.cliente.nombre}</TableCell>
//                                 <TableCell>
//                                   <Badge
//                                     variant={
//                                       (comanda as Comanda & { tipo?: TipoComandaEnum }).tipo === TipoComandaEnum.INGRESO
//                                         ? 'default'
//                                         : 'destructive'
//                                     }
//                                   >
//                                     {(comanda as Comanda & { tipo?: TipoComandaEnum }).tipo === TipoComandaEnum.INGRESO
//                                       ? '📈 Ingreso'
//                                       : '📉 Egreso'}
//                                   </Badge>
//                                 </TableCell>
//                                 <TableCell className="font-semibold">
//                                   {formatearPesos(comanda.totalFinal)}
//                                 </TableCell>
//                                 <TableCell>
//                                   <Badge
//                                     className={getEstadoNegocioStyle(
//                                       comandaExtendida.estadoNegocio
//                                     )}
//                                   >
//                                     {getEstadoNegocioLabel(
//                                       comandaExtendida.estadoNegocio
//                                     )}
//                                   </Badge>
//                                 </TableCell>
//                                 <TableCell>
//                                   <div className="flex items-center gap-2">
//                                     <Badge
//                                       className={
//                                         estaValidado
//                                           ? 'border-blue-300 bg-blue-100 text-blue-800'
//                                           : 'border-red-300 bg-red-100 text-red-800'
//                                       }
//                                     >
//                                       {estaValidado
//                                         ? '🔒 Validado'
//                                         : '🔓 Sin Validar'}
//                                     </Badge>
//                                     {estaValidado && (
//                                       <div
//                                         className="h-2 w-2 rounded-full bg-blue-500"
//                                         title="Transacción bloqueada"
//                                       ></div>
//                                     )}
//                                   </div>
//                                 </TableCell>
//                                 <TableCell>
//                                   {comanda.personalPrincipal?.nombre || 'Sin asignar'}
//                                 </TableCell>
//                                 <TableCell>
//                                   <div className="flex items-center gap-1">
//                                     {/* Botón Ver Detalles - siempre disponible para admin/encargado */}
//                                     {permisos.puedeVer && (
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() =>
//                                           handleVerDetalles(comanda.id)
//                                         }
//                                         title="Ver detalles"
//                                       >
//                                         <Eye className="h-4 w-4" />
//                                       </Button>
//                                     )}

//                                     {/* Botón Ver Historial - siempre disponible para admin/encargado */}
//                                     {permisos.puedeVerHistorial && (
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() =>
//                                           handleVerHistorial(comanda.id)
//                                         }
//                                         title="Ver historial"
//                                       >
//                                         <History className="h-4 w-4" />
//                                       </Button>
//                                     )}

//                                     {/* solo si no está completada */}
//                                     {permisos.puedeCambiarEstado && (
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() =>
//                                           handleCambiarEstado(comanda.id)
//                                         }
//                                         title={
//                                           estaCompletada
//                                             ? 'No se puede cambiar estado (trasladada a caja 2)'
//                                             : 'Cambiar estado'
//                                         }
//                                         disabled={estaCompletada}
//                                       >
//                                         <Clock className="h-4 w-4" />
//                                       </Button>
//                                     )}

//                                     {/* Botón Validar - solo si no está completada y para admin/encargado */}
//                                     {permisos.puedeValidar && !estaValidado && (
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() =>
//                                           handleValidar(comanda.id)
//                                         }
//                                         className="text-green-600 hover:bg-green-50 hover:text-green-700"
//                                         title={
//                                           estaCompletada
//                                             ? 'No se puede validar (trasladada a caja 2)'
//                                             : 'Validar comanda'
//                                         }
//                                         disabled={estaCompletada}
//                                       >
//                                         <CheckCircle className="h-4 w-4" />
//                                       </Button>
//                                     )}

//                                     {/* Indicador visual para comandas completadas */}
//                                     {estaCompletada && (
//                                       <div
//                                         className="h-2 w-2 rounded-full bg-blue-500"
//                                         title="Comanda trasladada a caja 2 - Solo consulta"
//                                       />
//                                     )}
//                                   </div>
//                                 </TableCell>
//                               </TableRow>
//                             );
//                           })}
//                         </TableBody>
//                       </Table>

//                       {comandasFiltradas.length === 0 && (
//                         <div className="py-12 text-center">
//                           <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
//                             <FileText className="h-6 w-6 text-gray-400" />
//                           </div>
//                           <h3 className="mb-2 text-lg font-semibold text-gray-900">
//                             No se encontraron comandas
//                           </h3>
//                           <p className="text-gray-500">
//                             No hay comandas que coincidan con los filtros
//                             aplicados.
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Paginación */}
//                   <div className="mt-6">
//                     <Pagination
//                       paginaActual={paginationInfo.paginaActual}
//                       totalPaginas={paginationInfo.totalPaginas}
//                       totalItems={paginationInfo.totalItems}
//                       itemsPorPagina={paginationInfo.itemsPorPagina}
//                       itemInicio={paginationInfo.itemInicio}
//                       itemFin={paginationInfo.itemFin}
//                       onCambiarPagina={handleCambiarPagina}
//                       onCambiarItemsPorPagina={handleCambiarItemsPorPagina}
//                       hayPaginaAnterior={paginationInfo.hayPaginaAnterior}
//                       hayPaginaSiguiente={paginationInfo.hayPaginaSiguiente}
//                     />
//                   </div>
//               </div>

//               {/* Error State */}
//               {error && (
//                 <div className="mb-6">
//                   <Card className="border border-red-200 bg-red-50">
//                     <CardContent className="p-4">
//                       <div className="flex items-center gap-2 text-red-800">
//                         <AlertTriangle className="h-4 w-4" />
//                         <span className="font-medium">Error:</span>
//                         <span>{error}</span>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>
//               )}
//             </div>
//           </div>
//         </ClientOnly>

//         {/* Modals */}
//         <ModalVerDetalles
//           isOpen={modalVerDetalles}
//           onClose={() => {
//             setModalVerDetalles(false);
//             setComandaSeleccionada('');
//           }}
//           comandaId={comandaSeleccionada}
//         />

//         <ModalVerHistorial
//           isOpen={modalVerHistorial}
//           onClose={() => {
//             setModalVerHistorial(false);
//             setComandaSeleccionada('');
//           }}
//           comandaId={comandaSeleccionada}
//         />

//         <ModalValidarComanda
//           isOpen={modalValidar}
//           onClose={() => {
//             setModalValidar(false);
//             setComandaSeleccionada('');
//           }}
//           comandaId={comandaSeleccionada}
//           onSuccess={handleValidacionExitosa}
//         />

//         <ModalCambiarEstado
//           isOpen={modalCambiarEstado}
//           onClose={() => {
//             setModalCambiarEstado(false);
//             setComandaSeleccionada('');
//           }}
//           comandaId={comandaSeleccionada}
//                       estadoActual={
//               (comandas.find((c) => c.id === comandaSeleccionada)?.estado as unknown as EstadoSimple) || 'pendiente'
//             }
//           onSuccess={handleCambioEstadoExitoso}
//         />
//       </div>
//     </MainLayout>
//   );
// }
