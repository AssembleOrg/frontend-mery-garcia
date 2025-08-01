'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { ComandaNew, EgresoFromPaginacion } from '@/services/unidadNegocio.service';
import { cn } from '@/lib/utils';
import { TrendingDown, DollarSign, Coins } from 'lucide-react';
import { useEffect } from 'react';

interface EgresosTotalsDisplayProps {
  data: ComandaNew[];
  className?: string;
}

export default function EgresosTotalsDisplay({ data, className }: EgresosTotalsDisplayProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();


  useEffect(() => {
    console.log('dataEgresosTotalsDisplay', data);
  }, [data]);

  // Calcular totales de egresos
  const calcularTotales = () => {
    let totalUSD = 0;
    let totalARS = 0;
    let totalTransaccionesUSD = 0;
    let totalTransaccionesARS = 0;
    let totalTransacciones = 0;

    data.forEach((comanda) => {
      if (comanda.egresos && comanda.egresos.length > 0) {
        const egresos: EgresoFromPaginacion[] = (comanda.egresos ?? []).map(e => ({
            id:          e.id!,                            // ya existe
            total:       e.total?.toString() ?? '0',
            totalPesos:  e.totalPesos?.toString() ?? '0',
            totalDolar:  e.totalDolar?.toString() ?? '0',        // number ➜ string
            valorDolar:  e.valorDolar?.toString() ?? '0',
            moneda:      e.moneda ?? 'USD',
          }));
        
        egresos.forEach((egreso: EgresoFromPaginacion) => {
          // Sumar montos en USD
          if (egreso.totalDolar && egreso.moneda === 'USD') {
            totalUSD += parseFloat(egreso.totalDolar);
            totalTransaccionesUSD++;
          }
          
          // Sumar montos en ARS
          if (egreso.totalPesos && egreso.moneda === 'ARS') {
            totalARS += parseFloat(egreso.totalPesos);
            totalTransaccionesARS++;
          }
          totalTransacciones++;
        });
      }
    });

    return { totalUSD, totalARS, totalTransaccionesUSD, totalTransaccionesARS, totalTransacciones };
  };

  const { totalUSD, totalARS, totalTransaccionesUSD, totalTransaccionesARS, totalTransacciones } = calcularTotales();

  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-3', className)}>
      {/* Total USD */}
      <Card className="border border-[#f9bbc4]/20 bg-gradient-to-br from-red-50 to-pink-50 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#4a3540]">Total USD</h3>
                <p className="text-xs text-gray-500">Dólares Americanos</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-600">
                {formatUSD(totalUSD)}
              </div>
              <div className="text-xs text-gray-500">
                {totalTransaccionesUSD} transacción{totalTransaccionesUSD !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total ARS */}
      <Card className="border border-[#f9bbc4]/20 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#4a3540]">Total ARS</h3>
                <p className="text-xs text-gray-500">Pesos Argentinos</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {formatARSFromNative(totalARS)}
              </div>
              <div className="text-xs text-gray-500">
                {totalTransaccionesARS} transacción{totalTransaccionesARS !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <Card className="border border-[#f9bbc4]/20 bg-gradient-to-br from-purple-50 to-pink-50 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#4a3540]">Resumen</h3>
                <p className="text-xs text-gray-500">Total de Egresos</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {totalUSD > 0 || totalARS > 0 ? (
                  <>
                    <div className="text-sm">{formatUSD(totalUSD)} USD</div>
                    <div className="text-sm">{formatARSFromNative(totalARS)} ARS</div>
                  </>
                ) : (
                  <span className="text-gray-400">Sin egresos</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {totalTransacciones} egreso{totalTransacciones !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 