import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';

interface SummaryCardProps {
  title: string;
  value: number | undefined;
  format?: 'currency' | 'number';
  valueClassName?: string;
}

export default function SummaryCard({
  title,
  value,
  format = 'number',
  valueClassName,
}: SummaryCardProps) {
  const { formatUSD } = useCurrencyConverter();

  const safeValue = value ?? 0;

  const formattedValue =
    format === 'currency'
      ? formatUSD(safeValue)
      : new Intl.NumberFormat('es-AR').format(safeValue);

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
