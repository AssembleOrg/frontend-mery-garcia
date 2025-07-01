import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  /** Label shown at the top of the card */
  title: string;
  /** Raw numeric value to display. Will be formatted automatically if `format` is provided. */
  value: number;
  /** Optional formatting hint. Currently supports `currency`. */
  format?: 'currency' | 'number';
  /** Optional Tailwind colour classes for the value text (e.g. 'text-green-700'). Defaults to `text-[#4a3540]`. */
  valueClassName?: string;
}

/**
 * Simple, reusable statistic card used across Caja modules. Keeps UI & ARS
 * formatting consistent while following KISS and single-responsibility
 * principles.
 */
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
        }).format(value)
      : new Intl.NumberFormat('es-AR').format(value);

  return (
    <Card className="border border-[#f9bbc4]/30 bg-white/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#6b4c57]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-2xl font-bold',
            valueClassName ?? 'text-[#4a3540]'
          )}
        >
          {formattedValue}
        </p>
      </CardContent>
    </Card>
  );
}
