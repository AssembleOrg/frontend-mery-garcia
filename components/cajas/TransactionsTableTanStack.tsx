import { Encomienda } from '@/types/caja';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  formatDate as formatDateEs,
  formatCurrencyArs,
  formatCurrencyUsd,
} from '@/lib/utils';
import { MoreHorizontal, Edit, Eye, Trash2, Lock } from 'lucide-react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

interface Props {
  data: Encomienda[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onChangeStatus?: (id: string) => void;
  hiddenColumns?: string[];
}

export default function TransactionsTableTanStack({
  data,
  onEdit,
  onDelete,
  onView,
  onChangeStatus,
  hiddenColumns = [],
}: Props) {
  const c = createColumnHelper<Encomienda>();

  const columnsRaw = [
    c.accessor('fecha', {
      header: 'Fecha',
      cell: (info) => formatDateEs(info.getValue()),
    }),
    c.accessor('numero', {
      header: 'Número',
    }),
    c.accessor('cliente', {
      header: 'Cliente',
    }),
    c.accessor('vendedor', {
      header: 'Vendedor',
      cell: (info) => info.getValue(),
    }),
    c.accessor('servicios', {
      id: 'servicios',
      header: 'Servicios',
      cell: (info) => {
        const row = info.row;
        const count = info.getValue().length;
        return (
          <button
            className="cursor-pointer text-[#4a3540] underline decoration-dotted hover:decoration-solid"
            onClick={() => onView(row.original.id)}
          >
            {count} {count === 1 ? 'item' : 'items'}
          </button>
        );
      },
      enableSorting: false,
    }),
    c.accessor('subtotal', {
      header: 'Subtotal',
      cell: (info) => (
        <div className="text-right">
          <div className="font-medium">
            {formatCurrencyArs(info.getValue())}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatCurrencyUsd(info.getValue())}
          </div>
        </div>
      ),
    }),
    c.accessor('total', {
      header: 'Total',
      cell: (info) => (
        <div className="text-right font-semibold text-[#4a3540]">
          {formatCurrencyArs(info.getValue())}
        </div>
      ),
    }),
    c.accessor('metodoPago', {
      header: 'Método',
      cell: (info) => {
        const val: string = info.getValue() as string;
        const style = (method: string): string => {
          switch (method.toLowerCase()) {
            case 'efectivo':
              return 'bg-green-100 text-green-800';
            case 'tarjeta':
              return 'bg-blue-100 text-blue-800';
            case 'transferencia':
              return 'bg-purple-100 text-purple-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };
        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${style(val)}`}
          >
            {val}
          </span>
        );
      },
    }),
    c.accessor('estado', {
      header: 'Estado',
      cell: (info) => {
        const estado = info.getValue();
        const map: Record<string, string> = {
          pendiente: 'bg-yellow-100 text-yellow-800',
          completado: 'bg-green-100 text-green-800',
          validado: 'bg-blue-100 text-blue-800',
          cancelado: 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${map[estado] || 'bg-gray-100 text-gray-800'}`}
          >
            {estado}
          </span>
        );
      },
    }),
    c.display({
      id: 'acciones',
      header: '',
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(id)}>
                <Eye className="mr-2 h-4 w-4" /> Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              {onChangeStatus && (
                <DropdownMenuItem onClick={() => onChangeStatus(id)}>
                  <Lock className="mr-2 h-4 w-4" /> Cambiar estado
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    }),
  ] as ColumnDef<Encomienda, unknown>[];

  return (
    <DataTable<Encomienda>
      data={data}
      columns={columnsRaw}
      hiddenColumns={hiddenColumns}
      enableSearch
      enablePagination
      pageSize={10}
    />
  );
}
