'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  totalUSD: number;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  subtitle?: string;
}

export default function SummaryCard({
  title,
  totalUSD,
  className,
  titleClassName,
  valueClassName,
  subtitle,
}: SummaryCardProps) {
  const { formatUSD } = useCurrencyConverter();

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

          <div className="space-y-1">
            <div
              className={cn(
                'text-2xl font-bold text-[#6b4c57]',
                valueClassName
              )}
            >
              {formatUSD(totalUSD)}
            </div>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
