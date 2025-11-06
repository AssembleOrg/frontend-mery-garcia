'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { cn } from '@/lib/utils';

interface SummaryCardSeñasYTotalProps {
  title?: string;
  señasUSD: number;
  señasARS: number;
  ingresosUSD: number;
  ingresosARS: number;
  residualUSD: number;
  residualARS: number;
  className?: string;
  titleClassName?: string;
  señaClassName?: string;
  totalClassName?: string;
}

export default function SummaryCardSeñasYTotal({
  title = "💰 Señas y Total en Caja",
  señasUSD,
  señasARS,
  ingresosUSD,
  ingresosARS,
  residualUSD,
  residualARS,
  className,
  titleClassName,
  señaClassName = "text-orange-600",
  totalClassName = "text-green-700",
}: SummaryCardSeñasYTotalProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();

  // Calcular totales en caja (ingresos + señas)
  const totalEnCajaUSD = ingresosUSD + señasUSD + residualUSD;
  const totalEnCajaARS = ingresosARS + señasARS + residualARS;

  return (
    <Card
      className={cn(
        'border border-[#f9bbc4]/20 bg-white/80 shadow-sm',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          <h3
            className={cn('text-sm font-medium text-[#4a3540]', titleClassName)}
          >
            {title}
          </h3>

          {/* Señas Activas */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 border-b border-gray-100 pb-1">
              💰 Señas Activas
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">USD:</span>
                <div className={cn('text-sm font-semibold', señaClassName)}>
                  {formatUSD(señasUSD)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">ARS:</span>
                <div className={cn('text-sm font-semibold', señaClassName)}>
                  {formatARSFromNative(señasARS)}
                </div>
              </div>
            </div>
          </div>

          {/* Total en Caja */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 border-b border-gray-100 pb-1">
              🏦 Total en Caja (Ingresos + Señas activas + Residual)
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">USD:</span>
                <div className={cn('text-sm font-bold', totalClassName)}>
                  {formatUSD(totalEnCajaUSD)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">ARS:</span>
                <div className={cn('text-sm font-bold', totalClassName)}>
                  {formatARSFromNative(totalEnCajaARS)}
                </div>
              </div>
            </div>
          </div>

          {/* Separator line */}
          {/* <div className="border-t border-gray-200 pt-2">
            <div className="text-center text-xs text-gray-500">
              💡 El total incluye ingresos y señas disponibles
            </div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
} 