'use client';

import SummaryCardDual from '@/components/common/SummaryCardDual';
import { formatDate } from '@/lib/utils';

interface ResidualDisplayProps {
  residualUSD: number;
  residualARS: number;
  fecha: string;
}

export default function ResidualDisplay({ 
  residualUSD, 
  residualARS, 
  fecha 
}: ResidualDisplayProps) {
  return (
    <SummaryCardDual
      title={`💰 Residual ${formatDate(fecha)}`}
      totalUSD={residualUSD}
      totalARS={residualARS}
      showTransactionCount={false}
      valueClassName="text-orange-600"
    />
  );
}