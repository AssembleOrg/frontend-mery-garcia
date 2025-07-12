import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import {
  convertARStoUSD,
  convertUSDtoARS,
  formatDualCurrency,
  isValidExchangeRate,
  formatUSD as formatCurrencyUsd,
  formatARS as formatCurrencyArs,
} from '@/lib/utils';

export function useCurrencyConverter() {
  const { tipoCambio } = useDatosReferencia();

  const exchangeRate = tipoCambio.valorVenta;

  const isExchangeRateValid = isValidExchangeRate(exchangeRate);

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
  };
}
