'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Eye,
  Calendar,
  DollarSign,
  Filter,
  ArrowUpRight,
  Shield,
  Download,
  X,
  Users,
  FileText,
} from 'lucide-react';

import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { MovimientoNew } from '@/services/unidadNegocio.service';

interface ModalVerMovimientosProps {
  isOpen: boolean;
  onClose: () => void;
  movimientos: MovimientoNew[];
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  title?: string;
}

export default function ModalVerMovimientos({ 
  isOpen, 
  onClose, 
  movimientos, 
  onExportCSV, 
  onExportPDF,
  title = "Movimientos de Caja"
}: ModalVerMovimientosProps) {
  const { formatUSD, formatARS, formatARSFromNative } = useCurrencyConverter();

  // Estados locales
  const [busqueda, setBusqueda] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('todos');
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoNew | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filtrar movimientos internamente
  const movimientosFiltrados = movimientos.filter((movimiento) => {
    // Filtro por búsqueda
    const coincideBusqueda = busqueda === '' || 
      movimiento.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      movimiento.personal?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      movimiento.comentario?.toLowerCase().includes(busqueda.toLowerCase());

    // Filtro por tipo
    const coincideTipo = tipoSeleccionado === 'todos' || 
      (tipoSeleccionado === 'ingreso' && movimiento.esIngreso) ||
      (tipoSeleccionado === 'egreso' && !movimiento.esIngreso);

    // Filtro por rango de fechas
    const coincideFecha = dateRange ? 
      (() => {
        const movimientoDate = new Date(movimiento.createdAt);
        const fromDate = dateRange.from;
        const toDate = dateRange.to;
        
        if (fromDate && toDate) {
          return movimientoDate >= fromDate && movimientoDate <= toDate;
        } else if (fromDate) {
          return movimientoDate >= fromDate;
        } else if (toDate) {
          return movimientoDate <= toDate;
        }
        return true;
      })() : true;

    return coincideBusqueda && coincideTipo && coincideFecha;
  });

  // Estadísticas
  const estadisticas = {
    totalMovimientos: movimientos.length,
    movimientosFiltrados: movimientosFiltrados.length,
    totalIngresos: movimientos.filter(m => m.esIngreso).length,
    totalEgresos: movimientos.filter(m => !m.esIngreso).length,
    montoTotalUSD: movimientos.reduce((sum, m) => sum + (m.montoUSD || 0), 0),
    montoTotalARS: movimientos.reduce((sum, m) => sum + (m.montoARS || 0), 0),
  };

  const handleVerDetalles = (movimiento: MovimientoNew) => {
    setMovimientoSeleccionado(movimiento);
    setShowModalDetalles(true);
  };

  const getTipoColor = (esIngreso: boolean) => {
    return esIngreso 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getTipoIcon = (esIngreso: boolean) => {
    return esIngreso ? '💰' : '💸';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden min-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#6b4c57]">
              <Eye className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[80vh] space-y-6">
            {/* Estadísticas */}

            {/* Filtros */}
            <Card className="border border-[#f9bbc4]/20 bg-white/80">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Búsqueda */}
                    <div className="relative max-w-md flex-1">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="personal o comentario..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filtro por tipo */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select
                        value={tipoSeleccionado}
                        onValueChange={setTipoSeleccionado}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrar por tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">
                            Todos los tipos
                          </SelectItem>
                          <SelectItem value="ingreso">
                            💰 Solo Ingresos
                          </SelectItem>
                          <SelectItem value="egreso">
                            💸 Solo Egresos
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Segunda fila con filtro de fechas y exportación */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Filtro de fechas */}
                    <div className="max-w-xs">
                      <DateRangePicker
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        placeholder="Filtrar por fecha"
                        accentColor="#f9bbc4"
                      />
                    </div>

                    {/* Botones de exportación */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportCSV}
                        className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportPDF}
                        className="border-[#f9bbc4] text-[#4a3540] hover:bg-[#f9bbc4]/10"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  {/* Indicador de filtros activos */}
                  {(dateRange || busqueda || tipoSeleccionado !== 'todos') && (
                    <div className="flex items-center gap-2 text-xs text-[#6b4c57]">
                      <div className="h-2 w-2 rounded-full bg-[#f9bbc4]"></div>
                      <span>
                        Filtros activos: {movimientosFiltrados.length} de {movimientos.length} movimientos
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabla de movimientos */}
            <Card className="border border-[#f9bbc4]/20 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#6b4c57]">
                  <Shield className="h-5 w-5" />
                  Movimientos ({movimientosFiltrados.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Personal</TableHead>
                        <TableHead>Monto USD</TableHead>
                        <TableHead>Monto ARS</TableHead>
                        <TableHead>Residual USD</TableHead>
                        <TableHead>Residual ARS</TableHead>
                        <TableHead>Comandas</TableHead>
                        <TableHead>Comentario</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientosFiltrados.map((movimiento) => (
                        <TableRow
                          key={movimiento.id}
                          className="hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => handleVerDetalles(movimiento)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3 text-blue-500" />
                              {movimiento.id.substring(0, 8)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(movimiento.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTipoColor(movimiento.esIngreso || false)}>
                              {getTipoIcon(movimiento.esIngreso || false)} {movimiento.esIngreso ? 'Ingreso' : 'Egreso'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              {movimiento.personal?.nombre || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className={`font-medium ${movimiento.esIngreso ? 'text-green-600' : 'text-red-600'}`}>
                            {formatUSD(movimiento.montoUSD || 0)}
                          </TableCell>
                          <TableCell className={`font-medium ${movimiento.esIngreso ? 'text-green-600' : 'text-red-600'}`}>
                            {formatARSFromNative(movimiento.montoARS || 0)}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {formatUSD(movimiento.residualUSD || 0)}
                          </TableCell>
                          <TableCell className="text-orange-600">
                            {formatARSFromNative(movimiento.residualARS || 0)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {movimiento.comandas?.length || 0}{' '}
                              {movimiento.comandas?.length === 1
                                ? 'comanda'
                                : 'comandas'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <span className="text-xs text-gray-700">
                                {movimiento.comentario || 'Sin comentario'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerDetalles(movimiento);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {movimientosFiltrados.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <p>No se encontraron movimientos</p>
                      <p className="text-sm">
                        {busqueda || tipoSeleccionado !== 'todos' || dateRange
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Aún no se han realizado movimientos'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles */}
      {showModalDetalles && movimientoSeleccionado && (
        <Dialog open={showModalDetalles} onOpenChange={setShowModalDetalles}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg text-[#4a3540] flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#f9bbc4]" />
                Detalles del Movimiento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">ID</label>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{movimientoSeleccionado.id}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Fecha</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {formatDate(movimientoSeleccionado.createdAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Tipo</label>
                  <Badge className={getTipoColor(movimientoSeleccionado.esIngreso || false)}>
                    {getTipoIcon(movimientoSeleccionado.esIngreso || false)} {movimientoSeleccionado.esIngreso ? 'Ingreso' : 'Egreso'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Personal</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {movimientoSeleccionado.personal?.nombre || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Montos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Monto USD</label>
                  <p className="text-lg font-bold text-green-600 bg-gray-50 p-2 rounded">
                    {formatUSD(movimientoSeleccionado.montoUSD || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Monto ARS</label>
                  <p className="text-lg font-bold text-green-600 bg-gray-50 p-2 rounded">
                    {formatARSFromNative(movimientoSeleccionado.montoARS || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Residual USD</label>
                  <p className="text-sm font-medium text-orange-600 bg-gray-50 p-2 rounded">
                    {formatUSD(movimientoSeleccionado.residualUSD || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Residual ARS</label>
                  <p className="text-sm font-medium text-orange-600 bg-gray-50 p-2 rounded">
                    {formatARSFromNative(movimientoSeleccionado.residualARS || 0)}
                  </p>
                </div>
              </div>

              {/* Comentario */}
              {movimientoSeleccionado.comentario && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Comentario</label>
                  <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {movimientoSeleccionado.comentario}
                  </p>
                </div>
              )}

              {/* Comandas asociadas */}
              {movimientoSeleccionado.comandas && movimientoSeleccionado.comandas.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Comandas Asociadas ({movimientoSeleccionado.comandas.length})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {movimientoSeleccionado.comandas.map((comanda, index) => (
                      <div key={comanda.id} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">#{comanda.numero}</span>
                          <span className="text-gray-500">{comanda.cliente?.nombre}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Estado: {comanda.estadoDeComanda} • Tipo: {comanda.tipoDeComanda}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Creado</label>
                  <p className="text-xs bg-gray-50 p-2 rounded">
                    {formatDate(movimientoSeleccionado.createdAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Actualizado</label>
                  <p className="text-xs bg-gray-50 p-2 rounded">
                    {formatDate(movimientoSeleccionado.updatedAt)}
                  </p>
                </div>
                {movimientoSeleccionado.deletedAt && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Eliminado</label>
                    <p className="text-xs bg-red-50 p-2 rounded text-red-600">
                      {formatDate(movimientoSeleccionado.deletedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 