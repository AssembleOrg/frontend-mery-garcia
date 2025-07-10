import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  valueClassName?: string;
}

export default function SummaryCard({
  title,
  value,
  format = 'number',
  valueClassName,
}: SummaryCardProps) {
  const formattedValue =
    format === 'currency'
      ? new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value)
      : new Intl.NumberFormat('es-AR').format(value);

  return (
    <Card className="overflow-hidden border border-[#f9bbc4]/30 bg-white/90">
      <CardHeader className="pb-2">
        <CardTitle className="truncate text-sm font-medium text-[#6b4c57]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p
          className={cn(
            'text-xl leading-tight font-bold break-words sm:text-2xl',
            valueClassName ?? 'text-[#4a3540]'
          )}
          title={formattedValue}
        >
          {formattedValue}
        </p>
      </CardContent>
    </Card>
  );
}
