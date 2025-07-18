import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnDef,
  VisibilityState,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';

interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  /** Column IDs que deben ocultarse inicialmente (ej: 'estadoNegocio') */
  hiddenColumns?: string[];
  /** Muestra barra de búsqueda global (filter by string) */
  enableSearch?: boolean;
  /** Muestra controles de paginación client-side */
  enablePagination?: boolean;
  /** Tamaño de página si enablePagination=true */
  pageSize?: number;
  /** Función para obtener clases CSS personalizadas para cada fila */
  getRowClassName?: (row: Row<T>) => string;
}

/**
 * Componente de tabla genérica basado en TanStack Table v8.
 *   – Sorting (click en header)
 *   – Column visibility configurable
 * Mantiene deliberadamente la paginación fuera (KISS); se puede envolver donde se necesite.
 */
export function DataTable<T extends object>({
  data,
  columns,
  hiddenColumns = [],
  enableSearch = false,
  enablePagination = false,
  pageSize = 10,
  getRowClassName,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(() => {
      const visibility: VisibilityState = {};
      hiddenColumns.forEach((id) => {
        visibility[id] = false;
      });
      return visibility;
    });

  React.useEffect(() => {
    setColumnVisibility((prev) => {
      const updated: VisibilityState = { ...prev };

      // Asegurar que todos los ids presentes mantengan coherencia
      Object.keys(updated).forEach((id) => {
        updated[id] = !hiddenColumns.includes(id);
      });

      hiddenColumns.forEach((id) => {
        if (!(id in updated)) {
          updated[id] = false;
        }
      });

      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hiddenColumns)]);

  const [globalFilter, setGlobalFilter] = React.useState('');

  const [pageIndex, setPageIndex] = React.useState(0);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      setPageIndex(newState.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: process.env.NODE_ENV === 'development',
  });

  return (
    <div className="w-full space-y-4 overflow-x-auto">
      {enableSearch && (
        <div>
          <input
            type="text"
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full max-w-xs rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-pink-300 focus:outline-none"
          />
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                if (header.isPlaceholder) return null;
                const isSorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer whitespace-nowrap select-none"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {isSorted === 'asc' && ' ▲'}
                    {isSorted === 'desc' && ' ▼'}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const customClassName = getRowClassName ? getRowClassName(row) : '';
            return (
              <TableRow
                key={row.id}
                className={`hover:bg-muted/50 ${customClassName}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-4 text-sm">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {table.getPageCount()}
          </span>
          <button
            className="rounded-md border px-3 py-1 disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </button>
          <button
            className="rounded-md border px-3 py-1 disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
