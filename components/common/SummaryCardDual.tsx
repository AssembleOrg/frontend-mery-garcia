'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { cn } from '@/lib/utils';

interface SummaryCardDualProps {
  title: string;
  totalUSD: number;
  totalARS: number;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  showTransactionCount?: boolean;
  transactionCountUSD?: number;
  transactionCountARS?: number;
}

export default function SummaryCardDual({
  title,
  totalUSD,
  totalARS,
  className,
  titleClassName,
  valueClassName,
  showTransactionCount = false,
  transactionCountUSD = 0,
  transactionCountARS = 0,
}: SummaryCardDualProps) {
  const { formatUSD, formatARSFromNative } = useCurrencyConverter();

  return (
    <Card
      className={cn(
        'border border-[#f9bbc4]/20 bg-white/80 shadow-sm',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3
            className={cn('text-sm font-medium text-[#4a3540]', titleClassName)}
          >
            {title}
          </h3>

          <div className="space-y-2">
            {/* USD Total */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">USD:</span>
              <div className="text-right">
                <div className={cn('text-sm font-bold', valueClassName)}>
                  {formatUSD(totalUSD)}
                </div>
                {showTransactionCount && transactionCountUSD > 0 && (
                  <div className="text-xs text-gray-500">
                    {transactionCountUSD} transacción
                    {transactionCountUSD !== 1 ? 'es' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* ARS Total */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">ARS:</span>
              <div className="text-right">
                <div className={cn('text-sm font-bold', valueClassName)}>
                  {formatARSFromNative(totalARS)}
                </div>
                {showTransactionCount && transactionCountARS > 0 && (
                  <div className="text-xs text-gray-500">
                    {transactionCountARS} transacción
                    {transactionCountARS !== 1 ? 'es' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Separator line if both currencies have values */}
            {totalUSD > 0 && totalARS > 0 && (
              <div className="border-t border-gray-200 pt-2">
                <div className="text-center text-xs text-gray-500">
                  Total en ambas monedas
                </div>
              </div>
            )}

            {/* Show message if no transactions */}
            {totalUSD === 0 && totalARS === 0 && (
              <div className="text-center">
                <div
                  className={cn(
                    'text-sm font-bold text-gray-400',
                    valueClassName
                  )}
                >
                  {formatUSD(0)}
                </div>
                <div className="text-xs text-gray-400">Sin transacciones</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
