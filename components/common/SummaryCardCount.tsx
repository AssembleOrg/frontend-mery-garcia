'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardCountProps {
  title: string;
  count: number;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  subtitle?: string;
  icon?: string;
}

export default function SummaryCardCount({
  title,
  count,
  className,
  titleClassName,
  valueClassName,
  subtitle,
  icon,
}: SummaryCardCountProps) {
  return (
    <Card className={cn('border border-[#f9bbc4]/20 bg-white/80 shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className={cn('text-sm font-medium text-[#4a3540]', titleClassName)}>
            {icon && <span className="mr-1">{icon}</span>}
            {title}
          </h3>
          
          <div className="text-center">
            <div className={cn('text-2xl font-bold text-[#4a3540]', valueClassName)}>
              {count.toLocaleString('es-ES')}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-500 mt-1">
                {subtitle}
              </div>
            )}
            {count === 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Sin registros
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}