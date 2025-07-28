import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatARS, formatUSD } from '@/lib/utils';
import { ItemComandaNew, ProductoServicioNew, UnidadNegocioNew } from '@/services/unidadNegocio.service';

interface ModalDetallesServiciosProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemComandaNew[];
  valorDolar?: number;
}

export default function ModalDetallesServicios({
  isOpen,
  onClose,
  items,
  valorDolar = 1,
}: ModalDetallesServiciosProps) {
  // Agrupar items por tipo
  const itemsPorTipo = items.reduce((acc, item) => {
    const tipo = item.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(item);
    return acc;
  }, {} as Record<string, ItemComandaNew[]>);

  // Si no hay items, mostrar mensaje
  if (!items || items.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#4a3540]">
              Detalles de Servicios
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            No hay servicios para mostrar
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatPrice = (item: ItemComandaNew) => {
    const productoServicio = item.productoServicio as ProductoServicioNew;
    
    if (productoServicio?.esPrecioCongelado && productoServicio.precioFijoARS) {
      return `${formatARS(productoServicio.precioFijoARS)} (ARS)`;
    }
    
    // Si no es precio congelado, mostrar en USD
    return `${formatUSD(item.precio)} (USD)`;
  };

  const getUnidadNegocioName = (item: ItemComandaNew) => {
    const productoServicio = item.productoServicio as ProductoServicioNew;
    return productoServicio?.unidadNegocio?.nombre || 'Sin unidad';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#4a3540]">
            Detalles de Servicios
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {Object.entries(itemsPorTipo).map(([tipo, itemsDelTipo]) => (
            <div key={tipo} className="space-y-2">
              <h3 className="font-medium text-[#4a3540] capitalize">
                {/* {tipo.toLowerCase()} */}
              </h3>
              <div className="space-y-2">
                {itemsDelTipo.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#4a3540]">
                        {item.nombre}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getUnidadNegocioName(item)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Cantidad: {item.cantidad}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {formatPrice(item)}
                      </div>
                      {item.descuento > 0 && (
                        <div className="text-xs text-red-500">
                          -{formatARS(item.descuento)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 