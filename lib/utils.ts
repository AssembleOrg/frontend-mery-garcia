import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sistema de logging condicional para evitar logs en producción
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  success: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${message}`, ...args);
    }
  },
  warning: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // Los errores siempre se muestran, pero sin detalles sensibles en prod
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${message}`, ...args);
    } else {
      console.error(`❌ ${message}`);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 ${message}`, ...args);
    }
  },
};

// ======================
// Helpers de Formateo  📅💰
// ======================

/**
 * Formatea una fecha al estilo dd/mm/yyyy (por defecto es-ES).
 * Acepta Date, string o número timestamp.
 */
export function formatDate(date: Date | string | number, locale = 'es-ES') {
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatea números como moneda ARS usando convención es-AR.
 */
export function formatCurrencyArs(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una cantidad en USD calculando a partir de un tipo de cambio.
 * @param amount   Cantidad en ARS
 * @param exchangeRate  Tipo de cambio ARS→USD (por defecto 1000)
 */
export function formatCurrencyUsd(amount: number, exchangeRate = 1000) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount / exchangeRate);
}

/**
 * Convierte pesos argentinos a dólares usando el tipo de cambio especificado
 * @param amountARS Cantidad en pesos argentinos
 * @param exchangeRate Tipo de cambio (ARS por USD)
 * @returns Cantidad en dólares
 */
export function convertARStoUSD(
  amountARS: number,
  exchangeRate: number
): number {
  if (exchangeRate <= 0) {
    console.warn('Tipo de cambio inválido, usando valor por defecto de 1000');
    return amountARS / 1000;
  }
  return amountARS / exchangeRate;
}

/**
 * Convierte dólares a pesos argentinos usando el tipo de cambio especificado
 * @param amountUSD Cantidad en dólares
 * @param exchangeRate Tipo de cambio (ARS por USD)
 * @returns Cantidad en pesos argentinos
 */
export function convertUSDtoARS(
  amountUSD: number,
  exchangeRate: number
): number {
  if (exchangeRate <= 0) {
    console.warn('Tipo de cambio inválido, usando valor por defecto de 1000');
    return amountUSD * 1000;
  }
  return amountUSD * exchangeRate;
}

/**
 * Formatea un monto mostrando tanto ARS como USD
 * @param amountARS Cantidad en pesos argentinos
 * @param exchangeRate Tipo de cambio (ARS por USD)
 * @param showUSD Si mostrar o no la conversión a USD
 * @returns String formateado con ambas monedas
 */
export function formatDualCurrency(
  amountARS: number,
  exchangeRate: number,
  showUSD: boolean = true
): string {
  const arsFormatted = formatCurrencyArs(amountARS);

  if (!showUSD) {
    return arsFormatted;
  }

  const usdFormatted = formatCurrencyUsd(amountARS, exchangeRate);
  return `${arsFormatted} (≈ ${usdFormatted})`;
}

/**
 * Valida que un tipo de cambio sea válido
 * @param exchangeRate Tipo de cambio a validar
 * @returns true si es válido, false si no
 */
export function isValidExchangeRate(exchangeRate: number): boolean {
  return (
    typeof exchangeRate === 'number' &&
    exchangeRate > 0 &&
    isFinite(exchangeRate)
  );
}
