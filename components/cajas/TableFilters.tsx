'use client';

import React, { useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Download,
  FileText,
  Printer,
  Columns,
  X,
  ChevronDown,
} from 'lucide-react';
import { FiltrosEncomienda, ColumnaCaja, Personal } from '@/types/caja';
import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import { ESTADO_LABELS } from '@/lib/constants';
import { useHasMounted } from '@/hooks/useHasMounted';

interface TableFiltersProps {
  filters: FiltrosEncomienda;
  onFiltersChange: (filters: FiltrosEncomienda) => void;
  columns: ColumnaCaja[];
  onColumnsChange: (columns: ColumnaCaja[]) => void;
  accentColor?: string;
  // Export functions
  exportToPDF?: () => void;
  exportToExcel?: () => void;
  exportToCSV?: () => void;
}

export default function TableFilters({
  filters,
  onFiltersChange,
  columns,
  onColumnsChange,
  accentColor = '#f9bbc4',
  exportToPDF,
  exportToExcel,
  exportToCSV,
}: TableFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get real staff data from store
  const { personal } = useDatosReferencia();

  const toggleColumn = (key: ColumnaCaja['key']) => {
    const updatedColumns = columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updatedColumns);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      key !== 'busqueda' &&
      filters[key as keyof FiltrosEncomienda] !== undefined
  );

  const activeFilterCount = Object.keys(filters).filter(
    (key) =>
      key !== 'busqueda' &&
      filters[key as keyof FiltrosEncomienda] !== undefined
  ).length;

  const mounted = useHasMounted();

  return mounted ? (
    <div className="space-y-4">
      {/* Main filters bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search and main filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar transacciones..."
              value={filters.busqueda || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, busqueda: e.target.value })
              }
              className="border-gray-200 pl-10 focus:border-[#f9bbc4] focus:ring-[#f9bbc4]"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Active filters badge */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="border-[#f9bbc4]/30 bg-[#f9bbc4]/20 text-[#8b5a6b]"
              >
                {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}{' '}
                activo{activeFilterCount > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Advanced filters toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
            style={{
              borderColor: accentColor,
              color: '#4a3540',
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            🔍 Filtros
            <ChevronDown
              className={`ml-2 h-4 w-4 transition-transform ${
                showAdvancedFilters ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {/* Column selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
                style={{
                  borderColor: accentColor,
                  color: '#4a3540',
                }}
              >
                <Columns className="mr-2 h-4 w-4" />
                📋 Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border border-gray-200 bg-white shadow-xl"
            >
              <div className="mb-1 border-b border-gray-100 px-2 py-1 text-xs text-gray-500">
                Seleccionar columnas a mostrar
              </div>
              {columns
                .filter((col) => col.key !== 'acciones')
                .map((col) => (
                  <DropdownMenuItem
                    key={col.key}
                    className="flex cursor-pointer items-center space-x-2"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleColumn(col.key);
                    }}
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Checkbox
                      checked={col.visible}
                      onCheckedChange={() => {
                        toggleColumn(col.key);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                    <span
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleColumn(col.key);
                      }}
                    >
                      {col.label}
                    </span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
                style={{
                  borderColor: accentColor,
                  color: '#4a3540',
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                📤 Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border border-gray-200 bg-white shadow-xl"
            >
              <DropdownMenuItem onClick={exportToPDF} disabled={!exportToPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToExcel}
                disabled={!exportToExcel}
              >
                <FileText className="mr-2 h-4 w-4" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV} disabled={!exportToCSV}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvancedFilters && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Status filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Estado
              </label>
              <Select
                value={filters.estado || 'todos'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    estado: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Estados</SelectItem>
                  <SelectItem value="pendiente">
                    {ESTADO_LABELS.pendiente}
                  </SelectItem>
                  <SelectItem value="completado">
                    {ESTADO_LABELS.completado}
                  </SelectItem>
                  <SelectItem value="cancelado">
                    {ESTADO_LABELS.cancelado}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment method filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Método de Pago
              </label>
              <Select
                value={filters.metodoPago || 'todos'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    metodoPago: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Métodos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff filter (detailed) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Miembro del Personal
              </label>
              <Select
                value={filters.vendedor || 'todos'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    vendedor: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo el Personal</SelectItem>
                  <SelectItem value="sin-asignar">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                      <span>Sin Asignar</span>
                    </div>
                  </SelectItem>
                  {personal.map((person: Personal) => (
                    <SelectItem key={person.id} value={person.nombre}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>{person.nombre}</span>
                        <span className="text-xs text-gray-500">
                          ({person.comisionPorcentaje}%)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <Input
                placeholder="Filtrar por cliente..."
                value={filters.cliente || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, cliente: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
}
