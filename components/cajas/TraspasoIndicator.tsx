import React from 'react';
import { TraspasoInfo } from '@/types/caja';
import { formatDate } from '@/lib/utils';
import {
  ArrowUpRight,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface TraspasoIndicatorProps {
  traspaso: TraspasoInfo;
  className?: string;
}

export default function TraspasoIndicator({
  traspaso,
  className = '',
}: TraspasoIndicatorProps) {
  return (
    <div
      className={`my-4 rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              🚚 Traspaso realizado a Caja Grande
            </h3>
            <p className="text-sm text-blue-600">
              Las comandas mostradas a continuación fueron trasladadas y están
              marcadas como validadas
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-right">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {formatDate(traspaso.fechaTraspaso)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-lg font-bold text-blue-800">
            <DollarSign className="h-5 w-5" />
            <span>
              $
              {traspaso.esTraspasoParcial && traspaso.montoParcial
                ? `${traspaso.montoParcial.toFixed(2)} (Parcial)`
                : `${traspaso.montoTotal.toFixed(2)}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Package className="h-4 w-4" />
            <span className="font-medium">
              {traspaso.comandasTraspasadas.length} comandas trasladadas
            </span>
          </div>

          {traspaso.esTraspasoParcial && traspaso.montoResidual && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Residual: ${traspaso.montoResidual.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {traspaso.observaciones && (
        <div className="mt-3 rounded-md bg-blue-100 p-2">
          <p className="text-sm text-blue-700">
            <strong>Observaciones:</strong> {traspaso.observaciones}
          </p>
        </div>
      )}
    </div>
  );
}
