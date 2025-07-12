import { useMemo } from 'react';
import { formatUSD, formatARS } from '@/lib/utils';
import { TipoCambio } from '@/types/caja';

interface UseCurrencyConverterHistoricoProps {
  tipoCambioHistorico?: TipoCambio;
  tipoCambioActual: TipoCambio;
}

export function useCurrencyConverterHistorico({
  tipoCambioHistorico,
  tipoCambioActual,
}: UseCurrencyConverterHistoricoProps) {
  const exchangeRate = useMemo(() => {
    const tipoCambio = tipoCambioHistorico || tipoCambioActual;
    return tipoCambio.valorVenta > 0 ? tipoCambio.valorVenta : 1200; // fallback
  }, [tipoCambioHistorico, tipoCambioActual]);

  const convertUSDToARS = useMemo(() => {
    return (amountUSD: number): number => {
      return amountUSD * exchangeRate;
    };
  }, [exchangeRate]);

  const formatARSHistorico = useMemo(() => {
    return (amountUSD: number): string => {
      const arsAmount = convertUSDToARS(amountUSD);
      return formatARS(arsAmount);
    };
  }, [convertUSDToARS]);

  return {
    exchangeRate,
    convertUSDToARS,
    formatUSD,
    formatARS: formatARSHistorico,
    isHistorical: !!tipoCambioHistorico,
  };
}
