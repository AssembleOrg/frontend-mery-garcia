import { useExchangeRate } from '@/features/exchange-rate/hooks/useExchangeRate';
import {
  convertARStoUSD,
  convertUSDtoARS,
  formatDualCurrency,
  formatUSD as formatCurrencyUsd,
  formatARS as formatCurrencyArs,
} from '@/lib/utils';

export function useCurrencyConverter() {
  const { tipoCambio, inicializado } = useExchangeRate();

  // ✅ Esperar a que esté inicializado antes de usar el valor
  const exchangeRate =
    inicializado && tipoCambio.valorVenta > 0 ? tipoCambio.valorVenta : 0;

  const isExchangeRateValid = inicializado && exchangeRate > 0;
  const isInitialized = inicializado;
  const needsManualSetup = !inicializado || exchangeRate === 0;

  const arsToUsd = (amountARS: number): number => {
    return convertARStoUSD(amountARS, exchangeRate);
  };

  const usdToArs = (amountUSD: number): number => {
    return convertUSDtoARS(amountUSD, exchangeRate);
  };

  const formatARS = (amountUSD: number): string => {
    return formatCurrencyArs(amountUSD, exchangeRate);
  };

  const formatUSD = (amountUSD: number): string => {
    return formatCurrencyUsd(amountUSD);
  };

  const formatDual = (amountUSD: number, showARS: boolean = true): string => {
    return formatDualCurrency(amountUSD, exchangeRate, showARS);
  };

  const getExchangeRateInfo = () => ({
    rate: exchangeRate,
    isValid: isExchangeRateValid,
    source: tipoCambio.fuente,
    lastUpdate: tipoCambio.fecha,
    compra: tipoCambio.valorCompra,
    venta: tipoCambio.valorVenta,
  });

  return {
    arsToUsd,
    usdToArs,
    formatARS,
    formatUSD,
    formatDual,
    exchangeRate,
    isExchangeRateValid,
    getExchangeRateInfo,
    tipoCambio,
    isInitialized,
    needsManualSetup,
  };
}
