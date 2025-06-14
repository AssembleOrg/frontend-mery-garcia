'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Download,
  FileText,
  Printer,
  Columns,
  Calendar,
} from 'lucide-react';
import { FiltrosEncomienda, ColumnaCaja } from '@/types/caja';

interface FiltrosCajaProps {
  filtros: FiltrosEncomienda;
  onFiltrosChange: (filtros: FiltrosEncomienda) => void;
  columnas: ColumnaCaja[];
  onColumnasChange: (columnas: ColumnaCaja[]) => void;
  accentColor?: string;
  showDateFilters?: boolean;
}

export default function FiltrosCaja({
  filtros,
  onFiltrosChange,
  columnas,
  onColumnasChange,
  accentColor = '#f9bbc4',
  showDateFilters = true,
}: FiltrosCajaProps) {
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  const toggleColumna = (key: ColumnaCaja['key']) => {
    const nuevasColumnas = columnas.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnasChange(nuevasColumnas);
  };

  const exportarDatos = (formato: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exportando datos en formato ${formato}`);
    // Aquí iría la lógica de exportación
  };

  return (
    <div className="space-y-4">
      {/* Fila superior: Búsqueda y botones de acción */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Búsqueda */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Buscar cliente, número..."
            value={filtros.busqueda || ''}
            onChange={(e) =>
              onFiltrosChange({ ...filtros, busqueda: e.target.value })
            }
            className="pl-10"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {/* Filtros avanzados */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            className="border-2 bg-white/80 font-medium shadow-sm transition-all hover:bg-white hover:shadow-md"
            style={{
              borderColor: accentColor,
              color: '#4a3540',
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            🔍 Filtros
          </Button>

          {/* Selector de columnas */}
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
                Selecciona las columnas a mostrar
              </div>
              {columnas
                .filter((col) => col.key !== 'acciones')
                .map((col) => (
                  <DropdownMenuItem
                    key={col.key}
                    className="flex cursor-pointer items-center space-x-2"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleColumna(col.key);
                    }}
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Checkbox
                      checked={col.visible}
                      onCheckedChange={() => {
                        toggleColumna(col.key);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                    <span
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleColumna(col.key);
                      }}
                    >
                      {col.label}
                    </span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Exportar */}
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
              <DropdownMenuItem onClick={() => exportarDatos('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarDatos('excel')}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarDatos('csv')}>
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

      {/* Filtros avanzados (colapsables) */}
      {mostrarFiltrosAvanzados && (
        <div
          className="border-opacity-20 grid grid-cols-1 gap-4 rounded-lg border-2 p-4 transition-all duration-300 md:grid-cols-4"
          style={{
            borderColor: accentColor,
            backgroundColor: `${accentColor}05`,
          }}
        >
          {/* Filtro Estado */}
          <Select
            value={filtros.estado || 'todos'}
            onValueChange={(value) =>
              onFiltrosChange({
                ...filtros,
                estado: value === 'todos' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Método Pago */}
          <Select
            value={filtros.metodoPago || 'todos'}
            onValueChange={(value) =>
              onFiltrosChange({
                ...filtros,
                metodoPago: value === 'todos' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Método de Pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los métodos</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="tarjeta">Tarjeta</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Vendedor */}
          <Select
            value={filtros.vendedor || 'todos'}
            onValueChange={(value) =>
              onFiltrosChange({
                ...filtros,
                vendedor: value === 'todos' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los vendedores</SelectItem>
              <SelectItem value="ana">Ana Pérez</SelectItem>
              <SelectItem value="maria">María García</SelectItem>
              <SelectItem value="carmen">Carmen López</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de fecha (placeholder) */}
          {showDateFilters && (
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rango de Fechas
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
