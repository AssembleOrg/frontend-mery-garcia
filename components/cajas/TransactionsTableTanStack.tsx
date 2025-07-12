import React from 'react';
import { Comanda } from '@/types/caja';
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
  resolverMetodoPagoPrincipal,
  formatearDetalleMetodosPago,
} from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { MoreHorizontal, Edit, Eye, Trash2, Lock } from 'lucide-react';
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/constants';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

interface Props {
  data: Comanda[];
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
  const { formatARS, formatUSD } = useCurrencyConverter();
  const c = createColumnHelper<Comanda>();

  const columnsRaw = [
    c.accessor('fecha', {
      header: 'Fecha',
      cell: (info) => formatDateEs(info.getValue()),
    }),
    c.accessor('numero', {
      header: 'Número',
    }),
    c.accessor('cliente.nombre', {
      header: 'Cliente',
      cell: (info) => info.getValue(),
    }),
    c.accessor('mainStaff.nombre', {
      header: 'Vendedor',
      cell: (info) => info.getValue(),
    }),
    c.accessor('items', {
      id: 'servicios',
      header: 'Servicios',
      cell: (info) => {
        const count = info.getValue().length;
        return (
          <button
            className="cursor-pointer text-[#4a3540] underline decoration-dotted hover:decoration-solid"
            onClick={() => onView(info.row.original.id)}
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
          <div className="font-medium text-green-600">
            {formatUSD(info.getValue())}
          </div>
          <div className="text-muted-foreground text-xs">
            {formatARS(info.getValue())}
          </div>
        </div>
      ),
    }),
    c.accessor('totalFinal', {
      header: 'Total',
      cell: (info) => (
        <div className="text-right font-semibold text-green-600">
          {formatUSD(info.getValue())}
        </div>
      ),
    }),
    c.accessor('metodosPago', {
      header: 'Método',
      cell: (info) => {
        const metodosPago = info.getValue();

        // Resolver método principal
        const metodoPrincipal =
          metodosPago && metodosPago.length > 0
            ? resolverMetodoPagoPrincipal(
                metodosPago.map((m) => ({ tipo: m.tipo, monto: m.monto }))
              )
            : 'efectivo';

        const style = (method: string): string => {
          switch (method.toLowerCase()) {
            case 'efectivo':
              return 'bg-green-100 text-green-800';
            case 'tarjeta':
              return 'bg-blue-100 text-blue-800';
            case 'transferencia':
              return 'bg-purple-100 text-purple-800';
            case 'mixto':
              return 'bg-orange-100 text-orange-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };

        const detalleTooltip =
          metodosPago && metodosPago.length > 0
            ? formatearDetalleMetodosPago(metodosPago)
            : metodoPrincipal;

        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${style(metodoPrincipal)} cursor-help`}
            title={detalleTooltip}
          >
            {metodoPrincipal}
          </span>
        );
      },
    }),
    c.accessor('estado', {
      header: 'Estado',
      cell: (info) => {
        const estado = info.getValue();
        const colorClass =
          ESTADO_COLORS[estado as keyof typeof ESTADO_COLORS] ||
          'bg-gray-100 text-gray-800';
        const label =
          ESTADO_LABELS[estado as keyof typeof ESTADO_LABELS] || estado;

        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}
          >
            {label}
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
  ] as ColumnDef<Comanda, unknown>[];

  return (
    <DataTable<Comanda>
      data={data}
      columns={columnsRaw}
      hiddenColumns={hiddenColumns}
      enableSearch={false}
      enablePagination
      pageSize={10}
    />
  );
}
