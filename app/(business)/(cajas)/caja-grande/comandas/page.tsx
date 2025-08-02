// 'use client';

// import { useState } from 'react';
// import MainLayout from '@/components/layout/MainLayout';
// import StandardPageBanner from '@/components/common/StandardPageBanner';
// import StandardBreadcrumbs from '@/components/common/StandardBreadcrumbs';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import ClientOnly from '@/components/common/ClientOnly';
// import ManagerOrAdminOnly from '@/components/auth/ManagerOrAdminOnly';
// import { useRecordsStore } from '@/features/records/store/recordsStore';
// import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
// import { formatDate, resolverMetodoPagoPrincipal } from '@/lib/utils';
// import {
//   Search,
//   Eye,
//   Calendar,
//   DollarSign,
//   Filter,
//   ArrowUpRight,
//   Shield,
//   Download,
// } from 'lucide-react';

// import ModalVerDetalles from '@/components/validacion/ModalVerDetalles';
// import TraspasoModal from '@/components/cajas/TraspasoModal';
// import { DateRangePicker } from '@/components/ui/date-range-picker';
// import { DateRange } from 'react-day-picker';
// import { exportComandasToCSV, exportComandasToPDF } from '@/lib/exportUtils';
// import useComandaStore from '@/features/comandas/store/comandaStore';
// import { EstadoDeComandaNew,ComandaNew } from '@/services/unidadNegocio.service';

// const breadcrumbItems = [
//   { label: 'Inicio', href: '/' },
//   { label: 'Dashboard', href: '/dashboard' },
//   { label: 'Caja Grande', href: '/caja-grande' },
//   { label: 'Comandas Traspasadas' },  
// ];

// export default function ComandasTraspasadasPage() {
//   const { comandas, cargarComandasPaginadas } = useComandaStore();
//   const { traspasos } = useRecordsStore();
//   const { formatUSD, formatARS, formatARSFromNative, exchangeRate } = useCurrencyConverter();

//   // Estados locales
//   const [busqueda, setBusqueda] = useState('');
//   const [traspasoSeleccionado, setTraspasoSeleccionado] =
//     useState<string>('todos');
//   const [showModalDetalles, setShowModalDetalles] = useState(false);
//   const [comandaSeleccionada, setComandaSeleccionada] = useState<string | null>(
//     null
//   );
//   const [dateRange, setDateRange] = useState<DateRange | undefined>();

//   // Filtrar comandas validadas (traspasadas) EXCLUYENDO movimientos manuales
//   const comandasValidadas = comandas.filter(
//     (c) => c.estadoDeComanda === EstadoDeComandaNew.VALIDADO && c.cliente.nombre !== 'Movimiento Manual'
//   );

//   // Filtrar por búsqueda, traspaso y fechas
//   const comandasFiltradas = comandasValidadas.filter((comanda) => {
//     // const coincideBusqueda =
//     //   comanda.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
//     //   comanda.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||

//     // // Filtro por rango de fechas
//     // const coincideFecha = dateRange ? 
//     //   (() => {
//     //     const comandaDate = new Date(comanda.fecha);
//     //     const fromDate = dateRange.from;
//     //     const toDate = dateRange.to;
        
//     //     if (fromDate && toDate) {
//     //       return comandaDate >= fromDate && comandaDate <= toDate;
//     //     } else if (fromDate) {
//     //       return comandaDate >= fromDate;
//     //     }
//     //     return true;
//     //   })() : true;

//     // if (traspasoSeleccionado === 'todos') {
//     //   return coincideBusqueda && coincideFecha;
//     // }

//     // // Verificar si la comanda pertenece al traspaso seleccionado
//     // const traspaso = traspasos.find((t) => t.id === traspasoSeleccionado);
//     // const perteneceAlTraspaso = traspaso?.comandasTraspasadas.includes(
//     //   comanda.id
//     // );

//     // return coincideBusqueda && coincideFecha && perteneceAlTraspaso;
//   });

//   // Estadísticas separadas por moneda usando métodos de pago reales
//   const calcularTotalesPorMoneda = (comandas: typeof comandasValidadas) => {
//     let totalUSD = 0;
//     let totalARS = 0;
    
//     comandas.forEach((comanda) => {
//       const metodosUSD = comanda.metodosPago.filter((mp) => mp.moneda === 'USD');
//       const metodosARS = comanda.metodosPago.filter((mp) => mp.moneda === 'ARS');
      
//       totalUSD += metodosUSD.reduce((sum, mp) => sum + mp.monto!, 0);
//       totalARS += metodosARS.reduce((sum, mp) => sum + mp.monto!, 0);
//     });
    
//     return { totalUSD, totalARS };
//   };

//   const { totalUSD, totalARS } = calcularTotalesPorMoneda(comandasValidadas);

//   const estadisticas = {
//     totalComandas: comandasValidadas.length,
//     montoTotalUSD: totalUSD,
//     montoTotalARS: totalARS,
//     totalTraspasos: traspasos.length,
//     ultimoTraspaso: traspasos[0]?.fechaTraspaso || null,
//   };

//   // Función helper para calcular montos por moneda de una comanda
//   const calcularMontosComanda = (comanda: typeof comandasValidadas[0]) => {
//     const metodosUSD = comanda.metodosPago.filter((mp) => mp.moneda === 'USD');
//     const metodosARS = comanda.metodosPago.filter((mp) => mp.moneda === 'ARS');
    
//     const totalUSD = metodosUSD.reduce((sum, mp) => sum + mp.monto!, 0);
//     const totalARS = metodosARS.reduce((sum, mp) => sum + mp.monto!, 0);
    
//     return { totalUSD, totalARS };
//   };
  
//   const handleVerDetalles = (comandaId: string) => {
//     setComandaSeleccionada(comandaId);
//     setShowModalDetalles(true);
//   };

//   // // Funciones de exportación
//   // const handleExportCSV = () => {
//   //   exportComandasToCSV(comandasFiltradas, exchangeRate, {
//   //     filename: `comandas_traspasadas_${new Date().toISOString().split('T')[0]}.csv`,
//   //     dateRange: dateRange ? { from: dateRange.from!, to: dateRange.to } : undefined,
//   //   });
//   // };

//   // const handleExportPDF = () => {
//   //   exportComandasToPDF(comandasFiltradas, exchangeRate, {
//   //     filename: `comandas_traspasadas_${new Date().toISOString().split('T')[0]}.pdf`,
//   //     dateRange: dateRange ? { from: dateRange.from!, to: dateRange.to } : undefined,
//   //   });
//   // };

//   const getEstadoColor = (estado: string) => {
//     switch (estado) {
//       case EstadoDeComandaNew.VALIDADO:
//         return 'bg-green-100 text-green-800';
//       case EstadoDeComandaNew.PENDIENTE:
//         return 'bg-yellow-100 text-yellow-800';
//       case EstadoDeComandaNew.CANCELADA:
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getMetodoPagoColor = (metodo: string) => {
//     switch (metodo.toLowerCase()) {
//       case 'efectivo':
//         return 'bg-green-100 text-green-800';
//       case 'tarjeta':
//         return 'bg-blue-100 text-blue-800';
//       case 'transferencia':
//         return 'bg-purple-100 text-purple-800';
//       case 'mixto':
//         return 'bg-orange-100 text-orange-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <MainLayout>
//       <div className="min-h-screen bg-gradient-to-br from-[#f9bbc4]/10 via-[#e8b4c6]/8 to-[#d4a7ca]/6">
//         <StandardPageBanner title="Comandas Traspasadas" />
        
//         <div className="relative -mt-12 h-12 bg-gradient-to-b from-transparent to-[#f9bbc4]/8" />

//         <ManagerOrAdminOnly>
//           <ClientOnly>
//             <div className="bg-gradient-to-b from-[#f9bbc4]/5 via-[#e8b4c6]/3 to-[#d4a7ca]/5">
//               <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//                 <div className="container mx-auto py-6">
//                 <StandardBreadcrumbs items={breadcrumbItems} />

//                 {/* Estadísticas */}
//                 <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//                   <Card className="border border-[#f9bbc4]/20 bg-white/80">
//                     <CardContent className="p-4">
//                       <div className="flex items-center gap-3">
//                         <div className="rounded-lg bg-blue-100 p-2">
//                           <Shield className="h-5 w-5 text-blue-600" />
//                         </div>
//                         <div>
//                           <p className="text-sm text-gray-600">
//                             Total Comandas
//                           </p>
//                           <p className="text-xl font-bold text-[#6b4c57]">
//                             {estadisticas.totalComandas}
//                           </p>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card className="border border-[#f9bbc4]/20 bg-white/80">
//                     <CardContent className="p-4">
//                       <div className="flex items-center gap-3">
//                         <div className="rounded-lg bg-green-100 p-2">
//                           <DollarSign className="h-5 w-5 text-green-600" />
//                         </div>
//                         <div>
//                           <p className="text-sm text-gray-600">Monto Total</p>
//                           <div className="space-y-1">
//                             <p className="text-sm font-bold text-[#6b4c57]">
//                               USD: {formatUSD(estadisticas.montoTotalUSD)}
//                             </p>
//                             <p className="text-sm font-bold text-[#6b4c57]">
//                               ARS: {formatARSFromNative(estadisticas.montoTotalARS)}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card className="border border-[#f9bbc4]/20 bg-white/80">
//                     <CardContent className="p-4">
//                       <div className="flex items-center gap-3">
//                         <div className="rounded-lg bg-purple-100 p-2">
//                           <ArrowUpRight className="h-5 w-5 text-purple-600" />
//                         </div>
//                         <div>
//                           <p className="text-sm text-gray-600">
//                             Total Traspasos
//                           </p>
//                           <p className="text-xl font-bold text-[#6b4c57]">
//                             {estadisticas.totalTraspasos}
//                           </p>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   <Card className="border border-[#f9bbc4]/20 bg-white/80">
//                     <CardContent className="p-4">
//                       <div className="flex items-center gap-3">
//                         <div className="rounded-lg bg-orange-100 p-2">
//                           <Calendar className="h-5 w-5 text-orange-600" />
//                         </div>
//                         <div>
//                           <p className="text-sm text-gray-600">
//                             Último Traspaso
//                           </p>
//                           <p className="text-sm font-medium text-[#6b4c57]">
//                             {estadisticas.ultimoTraspaso
//                               ? formatDate(estadisticas.ultimoTraspaso)
//                               : 'N/A'}
//                           </p>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* Filtros */}
//                 <Card className="mb-6 border border-[#f9bbc4]/20 bg-white/80">
//                   <CardContent className="p-4">
//                     <div className="space-y-4">
//                       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                         {/* Búsqueda */}
//                         <div className="relative max-w-md flex-1">
//                           <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
//                           <Input
//                             placeholder="Buscar por número, cliente o vendedor..."
//                             value={busqueda}
//                             onChange={(e) => setBusqueda(e.target.value)}
//                             className="pl-10"
//                           />
//                         </div>

//                         {/* Filtro por traspaso */}
//                         <div className="flex items-center gap-2">
//                           <Filter className="h-4 w-4 text-gray-500" />
//                           <Select
//                             value={traspasoSeleccionado}
//                             onValueChange={setTraspasoSeleccionado}
//                           >
//                             <SelectTrigger className="w-48">
//                               <SelectValue placeholder="Filtrar por traspaso" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="todos">
//                                 Todos los traspasos
//                               </SelectItem>
//                               {traspasos.map((traspaso) => (
//                                 <SelectItem key={traspaso.id} value={traspaso.id}>
//                                   {formatDate(traspaso.fechaTraspaso)} -{' '}
//                                   {traspaso.comandasTraspasadas.length} comandas
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       </div>

//                       {/* Segunda fila con filtro de fechas y exportación */}
//                       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//                         {/* Filtro de fechas */}
//                         <div className="max-w-xs">
//                           <DateRangePicker
//                             dateRange={dateRange}
//                             onDateRangeChange={setDateRange}
//                             placeholder="Filtrar por fecha"
//                             accentColor="#f9bbc4"
//                           />
//                         </div>

//                         {/* Botones de exportación */}
//                         <div className="flex items-center gap-2">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={handleExportCSV}
//                             className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
//                           >
//                             <Download className="mr-2 h-4 w-4" />
//                             CSV
//                           </Button>
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={handleExportPDF}
//                             className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
//                           >
//                             <Download className="mr-2 h-4 w-4" />
//                             PDF
//                           </Button>
//                         </div>
//                       </div>

//                       {/* Indicador de filtros activos */}
//                       {(dateRange || busqueda || traspasoSeleccionado !== 'todos') && (
//                         <div className="flex items-center gap-2 text-xs text-[#6b4c57]">
//                           <div className="h-2 w-2 rounded-full bg-[#f9bbc4]"></div>
//                           <span>
//                             Filtros activos: {comandasFiltradas.length} de {comandasValidadas.length} comandas
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Tabla de comandas */}
//                 <Card className="border border-[#f9bbc4]/20 bg-white/80">
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
//                       <Shield className="h-5 w-5" />
//                       Comandas Traspasadas ({comandasFiltradas.length})
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
//                             <TableHead>Vendedor</TableHead>
//                             <TableHead>Servicios</TableHead>
//                             <TableHead>Total</TableHead>
//                             <TableHead>Método Pago</TableHead>
//                             <TableHead>Estado</TableHead>
//                             <TableHead>Acciones</TableHead>
//                           </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                           {comandasFiltradas.map((comanda) => {
//                             // Obtener todos los métodos de pago únicos con sus monedas
//                             const metodosPagoUnicos = comanda.metodosPago?.length > 0
//                               ? Array.from(new Set(
//                                   comanda.metodosPago.map(m => `${m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)} - ${m.moneda}`)
//                                 )).join(', ')
//                               : `Efectivo - ${comanda.moneda}`;

//                             // Calcular montos reales por moneda
//                             const { totalUSD, totalARS } = calcularMontosComanda(comanda);

//                             return (
//                               <TableRow
//                                 key={comanda.id}
//                                 className="hover:bg-gray-50/50"
//                               >
//                                 <TableCell className="font-medium">
//                                   <div className="flex items-center gap-2">
//                                     <Shield className="h-3 w-3 text-blue-500" />
//                                     {comanda.numero}
//                                   </div>
//                                 </TableCell>
//                                 <TableCell>
//                                   {formatDate(comanda.fecha)}
//                                 </TableCell>
//                                 <TableCell>{comanda.cliente.nombre}</TableCell>
//                                 <TableCell>
//                                   {comanda.mainStaff.nombre}
//                                 </TableCell>
//                                 <TableCell>
//                                   <span className="text-sm text-gray-600">
//                                     {comanda.items.length}{' '}
//                                     {comanda.items.length === 1
//                                       ? 'item'
//                                       : 'items'}
//                                   </span>
//                                 </TableCell>
//                                 <TableCell className="font-medium text-green-600">
//                                   <div className="space-y-1">
//                                     {totalUSD > 0 && (
//                                       <div>{formatUSD(totalUSD)}</div>
//                                     )}
//                                     {totalARS > 0 && (
//                                       <div>{formatARSFromNative(totalARS)}</div>
//                                     )}
//                                     {totalUSD === 0 && totalARS === 0 && (
//                                       <div>$0.00</div>
//                                     )}
//                                   </div>
//                                 </TableCell>
//                                 <TableCell>
//                                   <div className="max-w-[200px]">
//                                     <span className="text-xs text-gray-700">
//                                       {metodosPagoUnicos}
//                                     </span>
//                                   </div>
//                                 </TableCell>
//                                 <TableCell>
//                                   <Badge
//                                     className={getEstadoColor(comanda.estado)}
//                                   >
//                                     {comanda.estado}
//                                   </Badge>
//                                 </TableCell>
//                                 <TableCell>
//                                   <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() =>
//                                       handleVerDetalles(comanda.id)
//                                     }
//                                   >
//                                     <Eye className="h-4 w-4" />
//                                   </Button>
//                                 </TableCell>
//                               </TableRow>
//                             );
//                           })}
//                         </TableBody>
//                       </Table>

//                       {comandasFiltradas.length === 0 && (
//                         <div className="py-8 text-center text-gray-500">
//                           <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" />
//                           <p>No se encontraron comandas traspasadas</p>
//                           <p className="text-sm">
//                             {busqueda || traspasoSeleccionado !== 'todos'
//                               ? 'Intenta ajustar los filtros de búsqueda'
//                               : 'Aún no se han realizado traspasos a Caja Grande'}
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* Sección de traspasos */}
//                 {traspasos.length > 0 && (
//                   <Card className="mt-6 border border-[#f9bbc4]/20 bg-white/80">
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
//                         <ArrowUpRight className="h-5 w-5" />
//                         Historial de Traspasos ({traspasos.length})
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         {traspasos.map((traspaso) => {
//                           const comandasDelTraspaso = comandasValidadas.filter(
//                             (c) => traspaso.comandasTraspasadas.includes(c.id)
//                           );

//                           return (
//                             <Card
//                               key={traspaso.id}
//                               className="border border-gray-200"
//                             >
//                               <CardContent className="p-4">
//                                 <div className="flex items-center justify-between">
//                                   <div className="flex items-center gap-4">
//                                     <div className="rounded-lg bg-blue-100 p-2">
//                                       <Calendar className="h-5 w-5 text-blue-600" />
//                                     </div>
//                                     <div>
//                                       <p className="font-medium">
//                                         {formatDate(traspaso.fechaTraspaso)}
//                                       </p>
//                                       <div className="space-y-1 text-sm text-gray-600">
//                                         <p>
//                                           {traspaso.comandasTraspasadas.length}{' '}
//                                           comandas
//                                         </p>
//                                         <p>
//                                           USD: {formatUSD(traspaso.montoTotalUSD || 0)}{' '}
//                                           • ARS: {formatARSFromNative(traspaso.montoTotalARS || 0)}
//                                         </p>
//                                       </div>
//                                     </div>
//                                   </div>

//                                   <TraspasoModal
//                                     traspaso={{
//                                       fecha: traspaso.fechaTraspaso,
//                                       numeroComandas:
//                                         traspaso.comandasTraspasadas.length,
//                                       montoTotal: traspaso.montoTotal,
//                                       montoTotalUSD: traspaso.montoTotalUSD || 0,
//                                       montoTotalARS: traspaso.montoTotalARS || 0,
//                                       montoParcial: traspaso.montoParcial || 0,
//                                       fechaInicio: traspaso.rangoFechas.desde,
//                                       fechaFin: traspaso.rangoFechas.hasta,
//                                       metodosPago: comandasDelTraspaso.reduce(
//                                         (metodos, comanda) => {
//                                           if (comanda.metodosPago) {
//                                             comanda.metodosPago.forEach(
//                                               (mp) => {
//                                                 if (
//                                                   !metodos.includes(mp.tipo)
//                                                 ) {
//                                                   metodos.push(mp.tipo);
//                                                 }
//                                               }
//                                             );
//                                           }
//                                           return metodos;
//                                         },
//                                         [] as string[]
//                                       ),
//                                       esTraspasoParcial: traspaso.esTraspasoParcial,
//                                       montoResidualUSD: traspaso.montoResidualUSD || 0,
//                                       montoResidualARS: traspaso.montoResidualARS || 0,
//                                     }}
//                                     comandas={comandasDelTraspaso}
//                                     trigger={
//                                       <Button variant="outline" size="sm">
//                                         <ArrowUpRight className="mr-2 h-4 w-4" />
//                                         Ver Detalles
//                                       </Button>
//                                     }
//                                   />
//                                 </div>
//                               </CardContent>
//                             </Card>
//                           );
//                         })}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}
//                 </div>
//               </div>
//             </div>
//           </ClientOnly>
//         </ManagerOrAdminOnly>

//         {/* Modal de detalles */}
//         {showModalDetalles && comandaSeleccionada && (
//           <ModalVerDetalles
//             isOpen={showModalDetalles}
//             onClose={() => {
//               setShowModalDetalles(false);
//               setComandaSeleccionada(null);
//             }}
//             comandaId={comandaSeleccionada}
//           />
//         )}
//       </div>
//     </MainLayout>
//   );
// }
