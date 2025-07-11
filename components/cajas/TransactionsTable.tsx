'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Encomienda, ColumnaCaja } from '@/types/caja';
import {
  formatDate as formatDateEs,
  formatCurrencyArs,
  formatCurrencyUsd,
} from '@/lib/utils';

interface TransactionsTableProps {
  data: Encomienda[];
  columns: ColumnaCaja[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onChangeStatus?: (id: string) => void;
  title: string;
  accentColor?: string;
}

export default function TransactionsTable({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  onChangeStatus,
  title,
  accentColor = '#f9bbc4',
}: TransactionsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = formatDateEs;
  const formatAmount = formatCurrencyArs;
  const formatAmountUSD = formatCurrencyUsd;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'validado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendiente':
        return '⏳ Pendiente';
      case 'completado':
        return '✅ Completado';
      case 'validado':
        return '🔒 Validado';
      case 'cancelado':
        return '❌ Cancelado';
      default:
        return status;
    }
  };

  const renderCellContent = (transaction: Encomienda, column: ColumnaCaja) => {
    switch (column.key) {
      case 'fecha':
        return formatDate(transaction.fecha);
      case 'numero':
        return transaction.numero;
      case 'cliente':
        return transaction.cliente;
      case 'servicios':
        return (
          <div className="flex items-center gap-2">
            <span>{transaction.servicios.length} servicio(s)</span>
            {transaction.servicios.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRow(transaction.id);
                }}
              >
                {expandedRows.has(transaction.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
      case 'subtotal':
        return (
          <div className="text-right">
            <div className="font-medium">
              {formatAmount(transaction.subtotal)}
            </div>
            <div className="text-xs text-gray-500">
              {formatAmountUSD(transaction.subtotal)}
            </div>
          </div>
        );
      case 'descuentoTotal':
        return transaction.descuentoTotal > 0 ? (
          <div className="text-right">
            <div className="font-medium text-red-600">
              {formatAmount(transaction.descuentoTotal)}
            </div>
            <div className="text-xs text-red-400">
              {formatAmountUSD(transaction.descuentoTotal)}
            </div>
          </div>
        ) : (
          '-'
        );
      case 'iva':
        return (
          <div className="text-right">
            <div className="font-medium">{formatAmount(transaction.iva)}</div>
            <div className="text-xs text-gray-500">
              {formatAmountUSD(transaction.iva)}
            </div>
          </div>
        );
      case 'total':
        return (
          <div className="text-right">
            <div className="font-semibold text-[#4a3540]">
              {formatAmount(transaction.total)}
            </div>
            <div className="text-xs font-medium text-green-600">
              {formatAmountUSD(transaction.total)}
            </div>
          </div>
        );
      case 'metodoPago':
        const getPaymentMethodStyle = (method: string) => {
          switch (method.toLowerCase()) {
            case 'efectivo':
              return 'bg-green-100 text-green-800 border-green-300 font-medium';
            case 'tarjeta':
              return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
            case 'transferencia':
              return 'bg-purple-100 text-purple-800 border-purple-300 font-medium';
            case 'mixto':
              return 'bg-orange-100 text-orange-800 border-orange-300 font-medium';
            default:
              return 'bg-gray-100 text-gray-800 border-gray-300 font-medium';
          }
        };

        // Para mostrar método mixto, verificamos si tiene información adicional
        // Por ahora usamos el campo metodoPago existente del tipo Encomienda
        const metodoPrincipal = transaction.metodoPago || 'efectivo';

        return (
          <Badge
            className={`capitalize ${getPaymentMethodStyle(metodoPrincipal)}`}
          >
            💳 {metodoPrincipal.replace('_', ' ')}
          </Badge>
        );
      case 'vendedor':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="font-medium">{transaction.vendedor}</span>
          </div>
        );
      case 'estado':
        return (
          <Badge className={getStatusBadge(transaction.estado)}>
            {getStatusLabel(transaction.estado)}
          </Badge>
        );
      case 'acciones':
        const isTransactionValidated = transaction.estado === 'validado';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onView(transaction.id);
                }}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              {onChangeStatus && !isTransactionValidated && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeStatus(transaction.id);
                  }}
                  className="cursor-pointer"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Cambiar Estado
                </DropdownMenuItem>
              )}
              {!isTransactionValidated ? (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(transaction.id);
                    }}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(transaction.id);
                    }}
                    className="cursor-pointer text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed text-gray-400"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Transacción Validada
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-center">
        <h3 className="text-center text-xl font-semibold text-[#4a3540]">
          {title}
        </h3>
      </div>

      {/* Table */}
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow
              className="border-b-2"
              style={{ backgroundColor: `${accentColor}10` }}
            >
              {columns
                .filter((col) => col.visible)
                .map((col) => (
                  <TableHead
                    key={col.key}
                    className="font-semibold text-[#4a3540]"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data
              .filter(
                (transaction) =>
                  transaction &&
                  transaction.id &&
                  Array.isArray(transaction.servicios)
              )
              .map((transaction) => {
                const isValidated =
                  (transaction as Encomienda & { estadoValidacion?: string })
                    .estadoValidacion === 'validado';
                return (
                  <React.Fragment key={transaction.id}>
                    <TableRow
                      className={`table-row-hover cursor-pointer ${isValidated ? 'comanda-validada' : ''}`}
                      onClick={() => toggleRow(transaction.id)}
                    >
                      {columns
                        .filter((col) => col.visible)
                        .map((col) => (
                          <TableCell key={`${transaction.id}-${col.key}`}>
                            {renderCellContent(transaction, col)}
                          </TableCell>
                        ))}
                    </TableRow>

                    {/* Expanded row with services details */}
                    {expandedRows.has(transaction.id) && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.filter((col) => col.visible).length}
                          className="p-0"
                          style={{ backgroundColor: `${accentColor}02` }}
                        >
                          <div className="p-4">
                            <h4 className="mb-3 font-semibold text-[#4a3540]">
                              Detalles de Servicios
                            </h4>
                            <div className="space-y-2">
                              {transaction.servicios
                                ?.filter(
                                  (servicio) => servicio && servicio.nombre
                                )
                                .map((servicio, index) => {
                                  // Create a stable, unique key combining multiple fields with timestamp
                                  const serviceKey = `${transaction.id}-service-${index}-${servicio.productoServicioId || servicio.servicioId || 'no-id'}-${servicio.nombre?.replace(/\s+/g, '-').toLowerCase() || 'unnamed'}-${servicio.cantidad || 0}-${servicio.precio || 0}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                                  return (
                                    <div
                                      key={serviceKey}
                                      className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {servicio.nombre}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          Cantidad: {servicio.cantidad}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-green-600">
                                          {formatAmount(servicio.subtotal)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatAmountUSD(servicio.subtotal)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* Resumen de montos */}
                            <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                              <h5 className="mb-2 text-sm font-semibold text-[#4a3540]">
                                Resumen
                              </h5>
                              {(() => {
                                const subtotal = transaction.subtotal;
                                const descuentos =
                                  transaction.descuentoTotal || 0;
                                const base = subtotal - descuentos;
                                const recargo = Math.max(
                                  transaction.total - base,
                                  0
                                );
                                return (
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>{formatAmount(subtotal)}</span>
                                    </div>
                                    {descuentos > 0 && (
                                      <div className="flex justify-between text-red-600">
                                        <span>Descuentos:</span>
                                        <span>-{formatAmount(descuentos)}</span>
                                      </div>
                                    )}
                                    {recargo > 0 && (
                                      <div className="flex justify-between text-orange-600">
                                        <span>Recargos:</span>
                                        <span>+{formatAmount(recargo)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between font-medium">
                                      <span>Total:</span>
                                      <span>
                                        {formatAmount(transaction.total)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>

        {/* Empty state */}
        {data.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No se encontraron transacciones
            </h3>
            <p className="text-gray-500">
              No hay transacciones para mostrar en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
