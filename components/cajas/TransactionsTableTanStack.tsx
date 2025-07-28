import React, { useState } from 'react';
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
  resolverMetodoPagoPrincipalConMoneda,
  formatearDetalleMetodosPago,
  formatARS,
} from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Lock,
  CheckCircle,
} from 'lucide-react';
import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/constants';
import { ColumnDef } from '@tanstack/react-table';
import { ComandaNew, EstadoDeComandaNew, TipoDeComandaNew } from '@/services/unidadNegocio.service';
import ModalDetallesServicios from './ModalDetallesServicios';

interface Props {
  data: ComandaNew[];
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
  const { formatARS: formatARSCurrent, formatUSD: formatUSDCurrent, formatARSFromNative } =
    useCurrencyConverter();
  
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedValorDolar, setSelectedValorDolar] = useState(1);

  // Función para detectar si es un egreso con monto fijo ARS
  const esEgresoConMontoFijoARS = (comanda: ComandaNew) => {
    return comanda.tipoDeComanda === TipoDeComandaNew.EGRESO && 
           comanda.items?.some(item => item.precio !== null);
  };

  // Función para formatear con tipo de cambio específico o actual
  const formatWithExchangeRate = (amountUSD: number, comanda: ComandaNew) => {
    // Para egresos con monto fijo ARS: NO convertir, mostrar valor nativo
    if (esEgresoConMontoFijoARS(comanda)) {
      return {
        usd: `🔒 ${formatARSFromNative(amountUSD)}`, // amountUSD es en realidad ARS
        ars: null, // No mostrar conversión
      };
    }

    // Si la comanda tiene tipo de cambio almacenado, usarlo
    if (comanda.valorDolar) {
      return {
        usd: formatUSDCurrent(amountUSD),
        ars: formatARS(amountUSD, comanda.valorDolar),
      };
    }
    // Fallback al tipo de cambio actual
    return {
      usd: formatUSDCurrent(amountUSD),
      ars: formatARSCurrent(amountUSD),
    };
  };

  const columns: ColumnDef<ComandaNew, unknown>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ getValue, row }) => {
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        return (
          <div className={isValidated ? 'text-gray-500' : ''}>
            {formatDateEs(getValue() as Date)}
          </div>
        );
      },
    },
    {
      accessorKey: 'numero',
      header: 'Número',
      cell: ({ getValue, row }) => {
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        return (
          <div
            className={`flex items-center gap-2 ${isValidated ? 'text-gray-500' : ''}`}
          >
            {isValidated && <CheckCircle className="h-4 w-4 text-green-500" />}
            {getValue() as string}
          </div>
        );
      },
    },
    {
      accessorKey: 'cliente.nombre',
      header: 'Cliente',
      cell: ({ getValue, row }) => {
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        return (
          <div className={isValidated ? 'text-gray-500' : ''}>
            {getValue() as string}
          </div>
        );
      },
    },
    {
      accessorKey: 'mainStaff.nombre',
      header: 'Personal',
      cell: ({ row }) => {
        const trabajadores = row.original.items
          .filter(item => item.trabajador)
          .map(item => item.trabajador)
          .filter((trabajador, index, array) => 
            array.findIndex(t => t?.id === trabajador?.id) === index
          ); // Eliminar duplicados
        
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        
        if (trabajadores.length === 0) {
          return (
            <div className={`text-sm ${isValidated ? 'text-gray-400' : 'text-gray-500'}`}>
              Sin asignar
            </div>
          );
        }
        
        if (trabajadores.length === 1) {
          const trabajador = trabajadores[0];
          return (
            <div className={`flex items-center gap-2 ${isValidated ? 'text-gray-500' : ''}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-xs font-semibold text-white shadow-sm">
                {trabajador?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{trabajador?.nombre}</span>
                <span className="text-xs text-gray-500">{trabajador?.rol}</span>
              </div>
            </div>
          );
        }
        
        // Múltiples vendedores
        return (
          <div className={`space-y-2 ${isValidated ? 'text-gray-500' : ''}`}>
            <div className="flex items-center gap-1">
              {trabajadores.slice(0, 3).map((trabajador, index) => (
                <div
                  key={trabajador?.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#f9bbc4] to-[#e292a3] text-xs font-semibold text-white shadow-sm"
                  title={trabajador?.nombre}
                >
                  {trabajador?.nombre?.charAt(0).toUpperCase()}
                </div>
              ))}
              {trabajadores.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
                  +{trabajadores.length - 3}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {trabajadores.length} Persona{trabajadores.length > 1 ? 's' : ''}
            </div>
          </div>
        );
      },
    },
    {
      id: 'servicios',
      accessorKey: 'items',
      header: 'Servicios',
      cell: ({ getValue, row }) => {
        const items = getValue() as Array<{
          tipo: string;
          monto: number;
        }>;
        const count = items.length;
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        return (
          <button
            className={`cursor-pointer underline decoration-dotted hover:decoration-solid ${
              isValidated ? 'text-gray-500' : 'text-[#4a3540]'
            }`}
            onClick={() => {
              setSelectedItems(row.original.items || []);
              setSelectedValorDolar(row.original.valorDolar || 1);
              setModalDetallesOpen(true);
            }}
          >
            {count} {count === 1 ? 'item' : 'items'}
          </button>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => {
        const subtotalUSD = row.original.metodosPago.reduce((acc, item) => item.moneda === 'USD' ? acc + item.monto! : acc, 0);
        const subtotalARS = row.original.metodosPago.reduce((acc, item) => item.moneda === 'ARS' ? acc + item.monto! : acc, 0);
        const subtotalARSToUSD = subtotalARS / row.original.valorDolar;
        const subtotal = subtotalUSD + subtotalARSToUSD;
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        const isManualMovement = row.original.cliente.nombre === 'Movimiento Manual';
        
        if (isManualMovement) {
          // Para movimientos manuales, mostrar solo el valor simple
          const moneda = row.original.precioDolar || 'USD';
          return (
            <div className="text-right">
              <div
                className={`font-medium ${isValidated ? 'text-gray-500' : 'text-green-600'}`}
              >
                {moneda}: ${subtotal.toFixed(2)}
              </div>
            </div>
          );
        }
        
        const formatted = formatWithExchangeRate(subtotal, row.original);
        return (
          <div className="text-right">
            <div
              className={`font-medium ${isValidated ? 'text-gray-500' : 'text-green-600'}`}
            >
              {formatted.usd}
            </div>
            {formatted.ars && (
              <div
                className={`text-xs ${isValidated ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                {formatted.ars}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'totalFinal',
      header: 'Total',
      cell: ({ row }) => {
        const totalUSD = row.original.metodosPago.reduce((acc, item) => item.moneda === 'USD' ? acc + item.montoFinal! : acc, 0);
        const totalARS = row.original.metodosPago.reduce((acc, item) => item.moneda === 'ARS' ? acc + item.montoFinal! : acc, 0);
        const totalARSToUSD = totalARS / row.original.valorDolar;
        const total = totalUSD + totalARSToUSD;
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;
        const isManualMovement = row.original.cliente.nombre === 'Movimiento Manual';
        
        if (isManualMovement) {
          // Para movimientos manuales, mostrar solo el valor simple
          const moneda = row.original.precioDolar || 'USD';
          return (
            <div
              className={`text-right font-semibold ${isValidated ? 'text-gray-500' : 'text-green-600'}`}
            >
              {moneda}: ${total.toFixed(2)}
            </div>
          );
        }
        
        const formatted = formatWithExchangeRate(total, row.original);
        return (
          <div className="text-right">
            <div
              className={`font-semibold ${isValidated ? 'text-gray-500' : 'text-green-600'}`}
            >
              {formatted.usd}
            </div>
            {formatted.ars && (
              <div
                className={`text-xs ${isValidated ? 'text-gray-400' : 'text-muted-foreground'}`}
              >
                {formatted.ars}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'metodosPago',
      header: 'Método',
      cell: ({ getValue, row }) => {
        const metodosPago = getValue() as Array<{
          tipo: string;
          monto: number;
        }>;
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;

        // Resolver método principal
        const metodoPrincipal =
          metodosPago && metodosPago.length > 0
            ? resolverMetodoPagoPrincipalConMoneda(
                metodosPago.map((m) => ({
                  tipo: m.tipo,
                  monto: m.monto,
                  moneda: (m as { moneda?: string }).moneda || 'USD',
                }))
              )
            : 'efectivo';

        const style = (method: string): string => {
          if (isValidated) {
            return 'bg-gray-100 text-gray-500';
          }
          switch (method.toLowerCase()) {
            case 'efectivo':
              return 'bg-green-100 text-green-800';
            case 'tarjeta':
              return 'bg-blue-100 text-blue-800';
            case 'transferencia':
              return 'bg-purple-100 text-purple-800';
            case 'giftcard':
              return 'bg-pink-100 text-pink-800';
            case 'qr':
              return 'bg-indigo-100 text-indigo-800';
            case 'precio_lista':
              return 'bg-purple-100 text-purple-800';
            case 'mixto':
              return 'bg-orange-100 text-orange-800';
            default:
              return 'bg-gray-100 text-gray-800';
          }
        };

        const detalleTooltip =
          metodosPago && metodosPago.length > 0
            ? formatearDetalleMetodosPago(
                metodosPago.map((m) => ({
                  tipo: m.tipo,
                  monto: m.monto,
                  moneda: (m as { moneda?: string }).moneda || 'USD',
                }))
              )
            : metodoPrincipal;

        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${style(metodoPrincipal)} cursor-help`}
            title={detalleTooltip}
          >
            💰 {metodoPrincipal}
          </span>
        );
      },
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ getValue, row }) => {
        const estado = getValue() as string;
          const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;

        const colorClass = isValidated
          ? 'bg-gray-100 text-gray-500'
          : ESTADO_COLORS[estado as keyof typeof ESTADO_COLORS] ||
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
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => {
        const id = row.original.id;
        const isValidated = row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={isValidated ? 'opacity-50' : ''}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(id)}>
                <Eye className="mr-2 h-4 w-4" /> Ver
              </DropdownMenuItem>

              {!isValidated && (
                <>
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
                </>
              )}

              {isValidated && (
                <DropdownMenuItem disabled className="text-gray-400">
                  <CheckCircle className="mr-2 h-4 w-4" /> Comanda validada
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <>
      <DataTable<ComandaNew>
        data={data}
        columns={columns}
        hiddenColumns={hiddenColumns}
        enableSearch={false}
        enablePagination
        getRowClassName={(row) =>
          row.original.estadoDeComanda === EstadoDeComandaNew.VALIDADO
            ? 'bg-gray-50/50 opacity-75'
            : ''
        }
      />
      
      <ModalDetallesServicios
        isOpen={modalDetallesOpen}
        onClose={() => setModalDetallesOpen(false)}
        items={selectedItems}
        valorDolar={selectedValorDolar}
      />
    </>
  );
}
