// 'use client';

// import { useState, useMemo } from 'react';
// import MainLayout from '@/components/layout/MainLayout';
// import StandardPageBanner from '@/components/common/StandardPageBanner';
// import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
// import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
// import ClientOnly from '@/components/common/ClientOnly';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { DatePicker } from '@/components/ui/date-picker';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Pagination } from '@/components/ui/pagination';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Search,
//   Download,
//   Trash2,
//   Calendar,
//   Users,
//   Activity,
//   Package,
// } from 'lucide-react';
// import { useActivityLogs } from '@/hooks/useActivityLogs';
// import { useActivityStore } from '@/features/activity/store/activityStore';
// import { usePersonal } from '@/features/personal/hooks/usePersonal';
// import { usePaginacion } from '@/features/comandas/hooks/usePaginacion';
// import { format } from 'date-fns';
// import { es } from 'date-fns/locale';
// import { useComandaStore } from '@/features/comandas/store/comandaStore';
// import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
// import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';

// export default function AuditoriaPage() {
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(
//     new Date()
//   );
//   const [selectedUser, setSelectedUser] = useState('');
//   const [selectedTipo, setSelectedTipo] = useState<'todos' | 'ingreso' | 'egreso' | 'transferencia' | 'sistema'>('todos');
//   const [showUserSearch, setShowUserSearch] = useState(false);
//   const [showModalDetalles, setShowModalDetalles] = useState(false);
//   const [comandaSeleccionada, setComandaSeleccionada] = useState<string | null>(null);

//   const { logs, statistics, exportToCSV } = useActivityLogs();
//   const { clearAllLogs } = useActivityStore();
//   const { personal } = usePersonal();
//   const { comandas } = useComandaStore();
//   const { formatUSD, formatARSFromNative } = useCurrencyConverter();

//   // Función para determinar el tipo detallado de actividad
//   const determinarTipo = (actividad: any): 'ingreso' | 'egreso' | 'transferencia' | 'sistema' => {
//     if (actividad.tipo === 'movimiento') return 'transferencia';
    
//     // Para logs del sistema, analizar la descripción y metadata
//     if (actividad.data?.metadata?.tipo === 'ingreso') return 'ingreso';
//     if (actividad.data?.metadata?.tipo === 'egreso') return 'egreso';
    
//     // Analizar la descripción para detectar ingresos/egresos
//     const descripcion = actividad.descripcion?.toLowerCase() || '';
//     if (descripcion.includes('ingreso') || descripcion.includes('comanda creada') && descripcion.includes('ingreso')) return 'ingreso';
//     if (descripcion.includes('egreso') || descripcion.includes('comanda creada') && descripcion.includes('egreso')) return 'egreso';
    
//     return 'sistema';
//   };

//   // Combinar logs y movimientos manuales aplicando TODOS los filtros
//   const actividadesUnificadas = useMemo(() => {
//     // Preparar actividades de logs del sistema
//     const logActividades = logs
//       .map(log => {
//         const actividadTemp = {
//           id: log.id,
//           fecha: new Date(log.fecha),
//           tipo: 'log' as const,
//           descripcion: log.descripcion,
//           usuario: log.usuario,
//           modulo: log.modulo,
//           data: log,
//           tipoDetallado: determinarTipo({ tipo: 'log', data: log }),
//           comandaId: log.metadata?.comandaId || null
//         };
//         return actividadTemp;
//       })
//       .filter((actividad) => {
//         // Filtro por fecha
//         const matchesDate = selectedDate
//           ? actividad.fecha.toDateString() === selectedDate.toDateString()
//           : true;
        
//         // Filtro por usuario
//         const matchesUser = selectedUser
//           ? actividad.usuario.toLowerCase().includes(selectedUser.toLowerCase())
//           : true;
          
//         // Filtro por tipo detallado
//         const matchesType = selectedTipo === 'todos' || selectedTipo === actividad.tipoDetallado;
        
//         return matchesDate && matchesUser && matchesType;
//       });
    
//     // Preparar actividades de movimientos manuales
//     const movimientosActividades = comandas
//       .map(comanda => {
//         // Solo procesar movimientos manuales de caja-grande
//         if (comanda.cliente.nombre !== 'Movimiento Manual') return null;
//         if (comanda.metadata?.cajaOrigen !== 'caja_2') return null;

//         const actividadTemp = {
//           id: comanda.id,
//           fecha: new Date(comanda.fecha),
//           tipo: 'movimiento' as const,
//           descripcion: `${comanda.tipo}: ${comanda.observaciones}`,
//           usuario: comanda.mainStaff?.nombre || 'Sistema',
//           modulo: 'Movimiento Manual',
//           data: comanda,
//           tipoDetallado: 'transferencia' as const,
//           comandaId: comanda.id
//         };
//         return actividadTemp;
//       })
//       .filter((actividad) => {
//         if (!actividad) return false;
        
//         // Filtro por fecha
//         const matchesDate = selectedDate
//           ? actividad.fecha.toDateString() === selectedDate.toDateString()
//           : true;
          
//         // Filtro por usuario
//         const matchesUser = selectedUser
//           ? actividad.usuario.toLowerCase().includes(selectedUser.toLowerCase())
//           : true;
          
//         // Filtro por tipo detallado
//         const matchesType = selectedTipo === 'todos' || selectedTipo === actividad.tipoDetallado;
        
//         return matchesDate && matchesUser && matchesType;
//       }) as any[];
    
//     // Combinar y ordenar por fecha descendente
//     return [...logActividades, ...movimientosActividades].sort(
//       (a, b) => b.fecha.getTime() - a.fecha.getTime()
//     );
//   }, [logs, comandas, selectedDate, selectedUser, selectedTipo]);

//   // Función para ver detalles (universal para todos los tipos con comandaId)
//   const handleVerDetalles = (comandaId: string) => {
//     setComandaSeleccionada(comandaId);
//     setShowModalDetalles(true);
//   };

//   // Función para determinar si una actividad tiene detalles disponibles
//   const tieneDetallesDisponibles = (actividad: any): boolean => {
//     return actividad.comandaId && ['ingreso', 'egreso', 'transferencia'].includes(actividad.tipoDetallado);
//   };

//   // Pagination for unified activities
//   const pagination = usePaginacion({
//     data: actividadesUnificadas,
//     itemsPorPagina: 10,
//   });

//   // Filter personal for user search
//   const filteredPersonal = personal.filter((person) =>
//     person.nombre.toLowerCase().includes(selectedUser.toLowerCase())
//   );

//   const handleExportCSV = () => {
//     exportToCSV();
//   };

//   const handleClearAllLogs = () => {
//     if (
//       window.confirm(
//         '¿Está seguro de que desea eliminar todos los registros de actividad? Esta acción no se puede deshacer.'
//       )
//     ) {
//       clearAllLogs();
//     }
//   };

//   const breadcrumbItems = [
//     { label: 'Caja Grande', href: '/caja-grande' },
//     { label: 'Auditoría', href: '/caja-grande/auditoria' },
//   ];

//   return (
//     <MainLayout>
//       <ManagerOrAdminOnly>
//         <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
//           <StandardPageBanner title="Auditoría del Sistema" />

//           <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

//           <ClientOnly>
//             <StandardBreadcrumbs items={breadcrumbItems} />

//             <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
//               <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
//                 {/* Statistics Cards */}
//                 <div className="mx-auto max-w-4xl">
//                   <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
//                   <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
//                     <CardContent className="p-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="text-sm font-medium text-gray-600">
//                             Actividades
//                           </p>
//                           <p className="text-2xl font-bold text-[#4a3540]">
//                             {actividadesUnificadas.length}
//                           </p>
//                         </div>
//                         <Activity className="h-8 w-8 text-[#f9bbc4]" />
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
//                     <CardContent className="p-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="text-sm font-medium text-gray-600">
//                             Usuarios Activos
//                           </p>
//                           <p className="text-2xl font-bold text-[#4a3540]">
//                             {statistics.usuariosActivos}
//                           </p>
//                         </div>
//                         <Users className="h-8 w-8 text-[#f9bbc4]" />
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
//                     <CardContent className="p-4">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <p className="text-sm font-medium text-gray-600">
//                             Fecha Seleccionada
//                           </p>
//                           <p className="text-lg font-bold text-[#4a3540]">
//                             {selectedDate
//                               ? format(selectedDate, 'dd/MM/yyyy', {
//                                   locale: es,
//                                 })
//                               : 'Todas'}
//                           </p>
//                         </div>
//                         <Calendar className="h-8 w-8 text-[#f9bbc4]" />
//                       </div>
//                     </CardContent>
//                   </Card>
//                   </div>

//                   {/* Filters */}
//                   <Card className="mb-6 border border-[#f9bbc4]/20 bg-white shadow-sm">
//                   <CardHeader className="bg-white">
//                     <CardTitle className="text-lg text-[#4a3540]">
//                       Consultar Actividades
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4 bg-white">
//                     <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                       {/* Date Filter */}
//                       <div>
//                         <Label htmlFor="date-filter" className="text-gray-700">
//                           Fecha
//                         </Label>
//                         <div className="relative">
//                           <DatePicker
//                             date={selectedDate}
//                             onDateChange={setSelectedDate}
//                             placeholder="Seleccionar fecha"
//                           />
//                         </div>
//                       </div>

//                       {/* User Filter */}
//                       <div>
//                         <Label htmlFor="user-filter" className="text-gray-700">
//                           Usuario
//                         </Label>
//                         <div className="relative">
//                           <Input
//                             id="user-filter"
//                             value={selectedUser}
//                             onChange={(e) => setSelectedUser(e.target.value)}
//                             placeholder="Buscar por usuario..."
//                             className="border-gray-300 bg-white"
//                             onFocus={() => setShowUserSearch(true)}
//                             onBlur={() =>
//                               setTimeout(() => setShowUserSearch(false), 200)
//                             }
//                           />
//                           <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />

//                           {/* User suggestions dropdown */}
//                           {showUserSearch && filteredPersonal.length > 0 && (
//                             <div className="absolute top-full z-[60] mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
//                               {filteredPersonal.slice(0, 5).map((person) => (
//                                 <button
//                                   key={person.id}
//                                   type="button"
//                                   className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
//                                   onClick={() => {
//                                     setSelectedUser(person.nombre);
//                                     setShowUserSearch(false);
//                                   }}
//                                 >
//                                   {person.nombre}
//                                 </button>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {/* Type Filter */}
//                       <div>
//                         <Label htmlFor="type-filter" className="text-gray-700">
//                           Tipo
//                         </Label>
//                         <Select
//                           value={selectedTipo}
//                           onValueChange={(value: 'todos' | 'ingreso' | 'egreso' | 'transferencia' | 'sistema') =>
//                             setSelectedTipo(value)
//                           }
//                         >
//                           <SelectTrigger className="border-gray-300 bg-white">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="todos">
//                               <div className="flex items-center gap-2">
//                                 <Package className="h-4 w-4 text-gray-600" />
//                                 <span>Todos</span>
//                               </div>
//                             </SelectItem>
//                             <SelectItem value="ingreso">
//                               <div className="flex items-center gap-2">
//                                 <div className="h-2 w-2 rounded-full bg-green-500" />
//                                 <span>Ingresos</span>
//                               </div>
//                             </SelectItem>
//                             <SelectItem value="egreso">
//                               <div className="flex items-center gap-2">
//                                 <div className="h-2 w-2 rounded-full bg-red-500" />
//                                 <span>Egresos</span>
//                               </div>
//                             </SelectItem>
//                             <SelectItem value="transferencia">
//                               <div className="flex items-center gap-2">
//                                 <div className="h-2 w-2 rounded-full bg-orange-500" />
//                                 <span>Transferencias</span>
//                               </div>
//                             </SelectItem>
//                             <SelectItem value="sistema">
//                               <div className="flex items-center gap-2">
//                                 <div className="h-2 w-2 rounded-full bg-blue-500" />
//                                 <span>Sistema</span>
//                               </div>
//                             </SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex flex-wrap gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setSelectedDate(undefined);
//                           setSelectedUser('');
//                           setSelectedTipo('todos');
//                         }}
//                         className="border-gray-300 text-gray-700 hover:bg-gray-50"
//                       >
//                         Limpiar Filtros
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={handleExportCSV}
//                         className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
//                       >
//                         <Download className="mr-2 h-4 w-4" />
//                         Exportar CSV
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={handleClearAllLogs}
//                         className="border-red-300 text-red-600 hover:bg-red-50"
//                       >
//                         <Trash2 className="mr-2 h-4 w-4" />
//                         Limpiar Todo
//                       </Button>
//                     </div>
//                   </CardContent>
//                   </Card>
//                 </div>

//                 {/* Activities Table */}
//                 <Card className="border border-[#f9bbc4]/20 bg-white shadow-sm">
//                   <CardHeader className="bg-white">
//                     <CardTitle className="text-lg text-[#4a3540]">
//                       Actividades ({actividadesUnificadas.length})
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="bg-white">
//                     {actividadesUnificadas.length === 0 ? (
//                       <div className="py-12 text-center">
//                         <Activity className="mx-auto h-12 w-12 text-gray-400" />
//                         <h3 className="mt-2 text-sm font-medium text-gray-900">
//                           No hay actividades
//                         </h3>
//                         <p className="mt-1 text-sm text-gray-500">
//                           No se encontraron actividades para los filtros
//                           seleccionados.
//                         </p>
//                       </div>
//                     ) : (
//                       <>
//                         <div className="overflow-x-auto">
//                           <Table>
//                             <TableHeader>
//                               <TableRow>
//                                 <TableHead>Fecha y Hora</TableHead>
//                                 <TableHead>Usuario</TableHead>
//                                 <TableHead>Tipo</TableHead>
//                                 <TableHead>Módulo</TableHead>
//                                 <TableHead>Descripción</TableHead>
//                                 <TableHead>Acciones</TableHead>
//                               </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                               {pagination.datosPaginados.map((actividad) => (
//                                 <TableRow key={actividad.id}>
//                                   <TableCell className="font-mono text-sm">
//                                     {format(
//                                       actividad.fecha,
//                                       'dd/MM/yyyy HH:mm:ss',
//                                       { locale: es }
//                                     )}
//                                   </TableCell>
//                                   <TableCell className="font-medium">
//                                     {actividad.usuario}
//                                   </TableCell>
//                                   <TableCell>
//                                     <Badge
//                                       variant="outline"
//                                       className={
//                                         actividad.tipoDetallado === 'ingreso'
//                                           ? 'border-green-200 text-green-700 bg-green-50'
//                                           : actividad.tipoDetallado === 'egreso'
//                                           ? 'border-red-200 text-red-700 bg-red-50'
//                                           : actividad.tipoDetallado === 'transferencia'
//                                           ? 'border-orange-200 text-orange-700 bg-orange-50'
//                                           : 'border-blue-200 text-blue-700 bg-blue-50'
//                                       }
//                                     >
//                                       {actividad.tipoDetallado === 'ingreso' && 'Ingreso'}
//                                       {actividad.tipoDetallado === 'egreso' && 'Egreso'}
//                                       {actividad.tipoDetallado === 'transferencia' && 'Transferencia'}
//                                       {actividad.tipoDetallado === 'sistema' && 'Sistema'}
//                                     </Badge>
//                                   </TableCell>
//                                   <TableCell>
//                                     <Badge
//                                       variant="secondary"
//                                       className="text-xs"
//                                     >
//                                       {actividad.modulo}
//                                     </Badge>
//                                   </TableCell>
//                                   <TableCell className="max-w-xs truncate text-sm text-gray-600">
//                                     {actividad.descripcion}
//                                   </TableCell>
//                                   <TableCell>
//                                     {tieneDetallesDisponibles(actividad) ? (
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() => handleVerDetalles(actividad.comandaId!)}
//                                         className="text-[#8b5a6b] hover:text-[#6b3d4f]"
//                                       >
//                                         Ver detalles
//                                       </Button>
//                                     ) : (
//                                       <span className="text-gray-400 text-sm">-</span>
//                                     )}
//                                   </TableCell>
//                                 </TableRow>
//                               ))}
//                             </TableBody>
//                           </Table>
//                         </div>

//                         {/* Pagination */}
//                         {actividadesUnificadas.length > 10 && (
//                           <div className="mt-6">
//                             <Pagination
//                               paginaActual={pagination.paginaActual}
//                               totalPaginas={pagination.totalPaginas}
//                               totalItems={pagination.totalItems}
//                               itemsPorPagina={pagination.itemsPorPagina}
//                               itemInicio={pagination.itemInicio}
//                               itemFin={pagination.itemFin}
//                               onCambiarPagina={pagination.irAPagina}
//                               onCambiarItemsPorPagina={
//                                 pagination.cambiarItemsPorPagina
//                               }
//                               hayPaginaAnterior={pagination.hayPaginaAnterior}
//                               hayPaginaSiguiente={pagination.hayPaginaSiguiente}
//                             />
//                           </div>
//                         )}
//                       </>
//                     )}
//                   </CardContent>
//                 </Card>

//               </div>
//             </div>
//           </ClientOnly>
//         </div>

//         {/* Modal de detalles de movimiento manual */}
//         {showModalDetalles && comandaSeleccionada && (
//           <ModalVerDetalles
//             isOpen={showModalDetalles}
//             comandaId={comandaSeleccionada}
//             onClose={() => {
//               setShowModalDetalles(false);
//               setComandaSeleccionada(null);
//             }}
//           />
//         )}
//       </ManagerOrAdminOnly>
//     </MainLayout>
//   );
// }
