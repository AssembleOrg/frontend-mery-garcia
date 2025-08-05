'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react';
import { ComandaNew, EstadoDeComandaNew } from '@/services/unidadNegocio.service';
import EditarComandaButton from './EditarComandaButton';

interface ComandaActionsProps {
  comanda: ComandaNew;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string) => void;
}

export default function ComandaActions({
  comanda,
  onView,
  onDelete,
  onStatusChange,
}: ComandaActionsProps) {
  const getEstadoBadge = (estado: EstadoDeComandaNew) => {
    switch (estado) {
      case EstadoDeComandaNew.PENDIENTE:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        );
      case EstadoDeComandaNew.PAGADA:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Pagada
          </Badge>
        );
      case EstadoDeComandaNew.CANCELADA:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {estado}
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Estado */}
      {getEstadoBadge(comanda.estadoDeComanda)}
      
      {/* Acciones */}
      <div className="flex items-center gap-1">
        {/* Ver detalles */}
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(comanda.id)}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        {/* Editar - Solo para comandas pendientes */}
        <EditarComandaButton comanda={comanda} />

        {/* Cambiar estado - Solo para comandas pendientes */}
        {comanda.estadoDeComanda === EstadoDeComandaNew.PENDIENTE && onStatusChange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(comanda.id)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Cambiar estado"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}

        {/* Eliminar - Solo para comandas pendientes */}
        {comanda.estadoDeComanda === EstadoDeComandaNew.PENDIENTE && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(comanda.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 