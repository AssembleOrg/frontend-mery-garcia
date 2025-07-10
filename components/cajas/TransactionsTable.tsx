'use client';

import React from 'react';
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
import { MoreHorizontal, Edit, Trash2, Eye, Lock } from 'lucide-react';
import { Comanda, ColumnaCaja } from '@/types/caja';
import { formatDate as formatDateEs, formatCurrencyArs } from '@/lib/utils';

interface TransactionsTableProps {
  data: Comanda[];
  columns?: ColumnaCaja[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onChangeStatus?: (id: string) => void;
  title?: string;
  accentColor?: string;
  hiddenColumns?: string[];
}

export default function TransactionsTable({
  data,
  onEdit,
  onDelete,
  onView,
  onChangeStatus,
}: TransactionsTableProps) {
  const formatDate = formatDateEs;
  const formatAmount = formatCurrencyArs;

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

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Personal</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.fecha)}</TableCell>
              <TableCell>{transaction.numero}</TableCell>
              <TableCell>{transaction.cliente?.nombre || 'N/A'}</TableCell>
              <TableCell>{transaction.mainStaff?.nombre || 'N/A'}</TableCell>
              <TableCell>{transaction.items?.length || 0} item(s)</TableCell>
              <TableCell className="text-right">
                {formatAmount(transaction.subtotal)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatAmount(transaction.totalFinal)}
              </TableCell>
              <TableCell>
                <Badge className="capitalize">
                  {transaction.metodosPago?.[0]?.tipo || 'efectivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadge(transaction.estado)}>
                  {getStatusLabel(transaction.estado)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(transaction.id)}>
                      <Eye className="mr-2 h-4 w-4" /> Ver
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(transaction.id)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    {onChangeStatus && (
                      <DropdownMenuItem
                        onClick={() => onChangeStatus(transaction.id)}
                      >
                        <Lock className="mr-2 h-4 w-4" /> Cambiar estado
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(transaction.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
