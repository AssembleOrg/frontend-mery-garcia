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
} from 'lucide-react';
import { Encomienda, ColumnaCaja } from '@/types/caja';

interface TablaEncomiendasProps {
  data: Encomienda[];
  columnas: ColumnaCaja[];
  onEditar: (id: string) => void;
  onEliminar: (id: string) => void;
  onVer: (id: string) => void;
  titulo: string;
  accentColor?: string;
  tipo: 'ingreso' | 'egreso';
}

export default function TablaEncomiendas({
  data,
  columnas,
  onEditar,
  onEliminar,
  onVer,
  titulo,
  accentColor = '#f9bbc4',
  tipo,
}: TablaEncomiendasProps) {
  const [filasExpandidas, setFilasExpandidas] = useState<Set<string>>(
    new Set()
  );

  const toggleFila = (id: string) => {
    const nuevasExpandidas = new Set(filasExpandidas);
    if (nuevasExpandidas.has(id)) {
      nuevasExpandidas.delete(id);
    } else {
      nuevasExpandidas.add(id);
    }
    setFilasExpandidas(nuevasExpandidas);
  };

  const formatearFecha = (fecha: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(fecha));
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  const formatearMontoUSD = (monto: number, tipoCambio: number = 1000) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(monto / tipoCambio);
  };

  const getEstadoBadge = (estado: string) => {
    const estilos = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      en_proceso: 'bg-blue-100 text-blue-800 border-blue-200',
      completado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200',
    };
    return estilos[estado as keyof typeof estilos] || estilos.pendiente;
  };

  const renderCellContent = (encomienda: Encomienda, columna: ColumnaCaja) => {
    switch (columna.key) {
      case 'fecha':
        return formatearFecha(encomienda.fecha);
      case 'numero':
        return encomienda.numero;
      case 'cliente':
        return encomienda.cliente;
      case 'servicios':
        return (
          <div className="flex items-center gap-2">
            <span>{encomienda.servicios.length} servicio(s)</span>
            {encomienda.servicios.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFila(encomienda.id);
                }}
              >
                {filasExpandidas.has(encomienda.id) ? (
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
              {formatearMonto(encomienda.subtotal)}
            </div>
            <div className="text-xs text-gray-500">
              {formatearMontoUSD(encomienda.subtotal)}
            </div>
          </div>
        );
      case 'descuentoTotal':
        return encomienda.descuentoTotal > 0 ? (
          <div className="text-right">
            <div className="font-medium text-red-600">
              {formatearMonto(encomienda.descuentoTotal)}
            </div>
            <div className="text-xs text-red-400">
              {formatearMontoUSD(encomienda.descuentoTotal)}
            </div>
          </div>
        ) : (
          '-'
        );
      case 'iva':
        return (
          <div className="text-right">
            <div className="font-medium">{formatearMonto(encomienda.iva)}</div>
            <div className="text-xs text-gray-500">
              {formatearMontoUSD(encomienda.iva)}
            </div>
          </div>
        );
      case 'total':
        return (
          <div className="text-right">
            <div className="font-semibold text-[#4a3540]">
              {formatearMonto(encomienda.total)}
            </div>
            <div className="text-xs font-medium text-green-600">
              {formatearMontoUSD(encomienda.total)}
            </div>
          </div>
        );
      case 'metodoPago':
        const getMetodoPagoStyle = (metodo: string) => {
          switch (metodo.toLowerCase()) {
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
        return (
          <Badge
            className={`capitalize ${getMetodoPagoStyle(encomienda.metodoPago)}`}
          >
            💳 {encomienda.metodoPago.replace('_', ' ')}
          </Badge>
        );
      case 'estado':
        return (
          <Badge className={getEstadoBadge(encomienda.estado)}>
            {encomienda.estado.replace('_', ' ')}
          </Badge>
        );
      case 'vendedor':
        return encomienda.vendedor;
      default:
        return String(encomienda[columna.key as keyof Encomienda] || '-');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header solo con título */}
      <div className="flex items-center justify-center">
        <h3 className="text-center text-xl font-semibold text-[#4a3540]">
          {titulo}
        </h3>
      </div>

      {/* Tabla */}
      <div
        className="overflow-hidden rounded-lg border-2"
        style={{ borderColor: `${accentColor}20` }}
      >
        <Table>
          <TableHeader>
            <TableRow
              className="hover:bg-transparent"
              style={{ backgroundColor: `${accentColor}10` }}
            >
              {columnas
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
              <TableHead className="w-20 font-semibold text-[#4a3540]">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((encomienda) => (
              <React.Fragment key={encomienda.id}>
                {/* Fila principal */}
                <TableRow
                  className="hover:bg-opacity-50 cursor-pointer transition-colors"
                  style={{ backgroundColor: `${accentColor}05` }}
                  onClick={() =>
                    encomienda.servicios.length > 1 && toggleFila(encomienda.id)
                  }
                >
                  {columnas
                    .filter((col) => col.visible)
                    .map((col) => (
                      <TableCell key={col.key} className="text-[#5a4550]">
                        {renderCellContent(encomienda, col)}
                      </TableCell>
                    ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onVer(encomienda.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditar(encomienda.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEliminar(encomienda.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Fila expandida con servicios */}
                {filasExpandidas.has(encomienda.id) &&
                  encomienda.servicios.length > 1 && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          columnas.filter((col) => col.visible).length + 1
                        }
                        className="p-0"
                        style={{ backgroundColor: `${accentColor}02` }}
                      >
                        <div
                          className="border-opacity-30 border-l-4 px-4 py-3"
                          style={{ borderColor: accentColor }}
                        >
                          <h4 className="mb-3 font-semibold text-[#4a3540]">
                            Servicios detallados:
                          </h4>
                          <div className="grid gap-2">
                            {encomienda.servicios.map((servicio, index) => (
                              <div
                                key={index}
                                className="border-opacity-20 flex items-center justify-between rounded-lg border bg-white/50 p-3"
                                style={{ borderColor: accentColor }}
                              >
                                <div className="flex-1">
                                  <span className="font-medium text-[#4a3540]">
                                    {servicio.nombre}
                                  </span>
                                  <span className="ml-2 text-sm text-[#8b6b75]">
                                    ({servicio.categoria})
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-[#6b4c57]">
                                    Cant: {servicio.cantidad}
                                  </span>
                                  <span className="text-[#6b4c57]">
                                    Precio: {formatearMonto(servicio.precio)}
                                  </span>
                                  {servicio.descuento > 0 && (
                                    <span className="text-red-600">
                                      Desc: {formatearMonto(servicio.descuento)}
                                    </span>
                                  )}
                                  <span className="font-semibold text-[#4a3540]">
                                    Total: {formatearMonto(servicio.subtotal)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación placeholder */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b4c57]">
          Mostrando {data.length} de {data.length}{' '}
          {tipo === 'ingreso' ? 'ingresos' : 'egresos'}
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-opacity-20"
            style={{ borderColor: accentColor }}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-opacity-20"
            style={{ borderColor: accentColor }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
