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
  ChevronDown,
  Package,
  Banknote,
  CreditCard,
  Smartphone,
  DollarSign,
  Gift,
  QrCode,
  X,
  Columns,
} from 'lucide-react';
import { FiltrosEncomienda, ColumnaCaja, PersonalSimple, UnidadNegocio } from '@/types/caja';
import { ESTADO_LABELS } from '@/lib/constants';
import { useHasMounted } from '@/hooks/useHasMounted';
import { usePersonal } from '@/features/personal/hooks/usePersonal';

interface TableFiltersProps {
  filters: FiltrosEncomienda;
  onFiltersChange: (filters: FiltrosEncomienda) => void;
  onClearFilters?: () => void;
  columns: ColumnaCaja[];
  onColumnsChange: (columns: ColumnaCaja[]) => void;
  accentColor?: string;
  exportToPDF?: () => void;
  exportToCSV?: () => void;
}

export default function TableFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  columns,
  onColumnsChange,
  exportToPDF,
  exportToCSV,
  accentColor = '#f9bbc4',
}: TableFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { personal } = usePersonal();

  const toggleColumn = (key: ColumnaCaja['key']) => {
    const updatedColumns = columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updatedColumns);
  };

  const clearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      const clearedFilters: FiltrosEncomienda = {};
      Object.keys(filters).forEach(key => {
        if (key !== 'busqueda') {
          (clearedFilters as any)[key as keyof FiltrosEncomienda] = undefined;
        }
      });
      clearedFilters.busqueda = undefined;
      onFiltersChange(clearedFilters);
    }
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
    <div className="space-y-6">
      {/* Main filters bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-white/50 p-4 backdrop-blur-sm">
        {/* Search and main filters */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar transacciones..."
              value={filters.busqueda || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, busqueda: e.target.value })
              }
              className="h-11 border-gray-200 bg-white/80 pl-10 shadow-sm transition-all hover:bg-white focus:border-[#f9bbc4] focus:ring-2 focus:ring-[#f9bbc4]/20"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active filters badge */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <Badge
                variant="secondary"
                className="border-[#f9bbc4]/30 bg-gradient-to-r from-[#f9bbc4]/20 to-[#e292a3]/20 text-[#8b5a6b] font-semibold shadow-sm"
              >
                ✨ {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}{' '}
                activo{activeFilterCount > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-full"
                title="Limpiar filtros"
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
            className={`border-2 font-semibold shadow-sm transition-all duration-200 hover:shadow-md whitespace-nowrap ${
              showAdvancedFilters 
                ? 'bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-white border-[#f9bbc4] hover:from-[#e292a3] hover:to-[#d4a7ca]'
                : 'bg-white/80 hover:bg-white border-[#f9bbc4] text-[#4a3540]'
            }`}
          >
            <Filter className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {showAdvancedFilters ? '⚙️ Ocultar Filtros' : '🔍 Mostrar Filtros'}
            </span>
            <span className="sm:hidden">
              {showAdvancedFilters ? '⚙️' : '🔍'}
            </span>
            <ChevronDown
              className={`ml-2 h-4 w-4 transition-transform duration-200 ${
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
                className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md whitespace-nowrap"
                style={{
                  borderColor: accentColor,
                  color: '#4a3540',
                }}
              >
                <Columns className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">📋 Columnas</span>
                <span className="sm:hidden">📋</span>
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
                className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md whitespace-nowrap"
                style={{
                  borderColor: accentColor,
                  color: '#4a3540',
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">📤 Exportar</span>
                <span className="sm:hidden">📤</span>
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
        <div className="animate-in slide-in-from-top-2 duration-200 rounded-xl border border-gray-200/60 bg-gradient-to-br from-gray-50/80 via-white/90 to-gray-50/80 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Filtros Avanzados</h3>
            <p className="text-sm text-gray-600">Personaliza tu búsqueda con estos filtros</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Status filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
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
                <SelectTrigger className="h-10 border-gray-300 bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Seleccionar estado" />
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
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
                <SelectTrigger className="h-10 border-gray-300 bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Todos los Métodos
                    </div>
                  </SelectItem>
                  <SelectItem value="efectivo">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Efectivo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tarjeta">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Tarjeta</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transferencia">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Transferencia</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="giftcard">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-pink-600" />
                      <span className="font-medium">Gift Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="qr">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">QR</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="precio_lista">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Precio de Lista</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mixto">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Mixto</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                Moneda
              </label>
              <Select
                value={filters.moneda || 'todos'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    moneda: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="h-10 border-gray-300 bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Todas las Monedas
                    </div>
                  </SelectItem>
                  <SelectItem value="USD">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">USD (Dólares)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ARS">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">ARS (Pesos)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Miembro del Personal
              </label>
              <Select
                value={filters.personalId || 'todos'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    personalId: value === 'todos' ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="h-10 border-gray-300 bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
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
                  {personal.map((persona: PersonalSimple) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{persona.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Business Unit filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                Unidad de Negocio
              </label>
              <Select
                value={filters.businessUnit || 'todos'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    businessUnit: value === 'todos' ? undefined : (value as UnidadNegocio),
                  })
                }
              >
                <SelectTrigger className="h-10 border-gray-300 bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-600" />
                      <span>Todas las Unidades</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tattoo">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span>🎨 Tattoo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="estilismo">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-pink-500" />
                      <span>💄 Estilismo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="formacion">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>📚 Formación</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>
                Cliente
              </label>
              <Input
                placeholder="Filtrar por cliente..."
                value={filters.cliente || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, cliente: e.target.value })
                }
                className="h-10 border-gray-300 bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
}
