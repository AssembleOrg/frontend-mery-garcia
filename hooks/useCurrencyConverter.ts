import { useDatosReferencia } from '@/features/comandas/store/comandaStore';
import {
  formatCurrencyArs,
  formatCurrencyUsd,
  convertARStoUSD,
  convertUSDtoARS,
  formatDualCurrency,
  isValidExchangeRate,
} from '@/lib/utils';

/**
 * Hook para manejar conversiones de moneda de manera centralizada
 * Utiliza el tipo de cambio del store global
 */
export function useCurrencyConverter() {
  const { tipoCambio } = useDatosReferencia();

  const exchangeRate = tipoCambio.valorVenta;

  // Verificar si el tipo de cambio es válido
  const isExchangeRateValid = isValidExchangeRate(exchangeRate);

  /**
   * Convierte ARS a USD usando el tipo de cambio del store
   */
  const arsToUsd = (amountARS: number): number => {
    return convertARStoUSD(amountARS, exchangeRate);
  };

  /**
   * Convierte USD a ARS usando el tipo de cambio del store
   */
  const usdToArs = (amountUSD: number): number => {
    return convertUSDtoARS(amountUSD, exchangeRate);
  };

  /**
   * Formatea un monto en ARS
   */
  const formatARS = (amount: number): string => {
    return formatCurrencyArs(amount);
  };

  /**
   * Formatea un monto en USD (convirtiendo desde ARS)
   */
  const formatUSD = (amountARS: number): string => {
    return formatCurrencyUsd(amountARS, exchangeRate);
  };

  /**
   * Formatea un monto mostrando tanto ARS como USD
   */
  const formatDual = (amountARS: number, showUSD: boolean = true): string => {
    return formatDualCurrency(amountARS, exchangeRate, showUSD);
  };

  /**
   * Obtiene información del tipo de cambio actual
   */
  const getExchangeRateInfo = () => ({
    rate: exchangeRate,
    isValid: isExchangeRateValid,
    source: tipoCambio.fuente,
    lastUpdate: tipoCambio.fecha,
    compra: tipoCambio.valorCompra,
    venta: tipoCambio.valorVenta,
  });

  return {
    // Conversiones
    arsToUsd,
    usdToArs,

    // Formateo
    formatARS,
    formatUSD,
    formatDual,

    // Información del tipo de cambio
    exchangeRate,
    isExchangeRateValid,
    getExchangeRateInfo,

    // Acceso directo al objeto completo
    tipoCambio,
  };
}
