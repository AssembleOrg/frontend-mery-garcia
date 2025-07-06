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
 * Formatea números como moneda UYU usando convención es-UY.
 */
export function formatCurrencyUyu(amount: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea números sin símbolo de moneda (genérico)
 */
export function formatNumber(amount: number) {
  return new Intl.NumberFormat('es-AR').format(amount);
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

/**
 * Determina el método de pago principal para mostrar en la tabla
 * Resuelve el bug: tarjeta con recargo → "Mixto"
 */
export function resolverMetodoPagoPrincipal(
  metodosPago: Array<{ tipo: string; monto: number }>
): string {
  if (!metodosPago || metodosPago.length === 0) {
    return 'efectivo';
  }

  // Si hay solo un método, retornar ese
  if (metodosPago.length === 1) {
    return metodosPago[0].tipo;
  }

  // Si hay múltiples métodos, buscar el de mayor monto
  const metodoPrincipal = metodosPago.reduce((prev, current) =>
    current.monto > prev.monto ? current : prev
  );

  // Si hay múltiples métodos con montos similares, es realmente mixto
  const totalMonto = metodosPago.reduce((sum, m) => sum + m.monto, 0);
  const porcentajePrincipal = (metodoPrincipal.monto / totalMonto) * 100;

  // Si el método principal representa menos del 80%, es mixto
  if (porcentajePrincipal < 80) {
    return 'mixto';
  }

  return metodoPrincipal.tipo;
}

/**
 * Formatea el detalle de métodos de pago para mostrar en tooltips o detalles
 */
export function formatearDetalleMetodosPago(
  metodosPago: Array<{ tipo: string; monto: number; montoFinal?: number }>
): string {
  if (!metodosPago || metodosPago.length === 0) {
    return 'Sin métodos de pago';
  }

  if (metodosPago.length === 1) {
    const metodo = metodosPago[0];
    const montoFinal = metodo.montoFinal || metodo.monto;
    if (montoFinal > metodo.monto) {
      return `${metodo.tipo} $${metodo.monto.toFixed(2)} (+recargo: $${montoFinal.toFixed(2)})`;
    }
    return `${metodo.tipo} $${metodo.monto.toFixed(2)}`;
  }

  return metodosPago
    .map((m) => {
      const montoFinal = m.montoFinal || m.monto;
      if (montoFinal > m.monto) {
        return `${m.tipo} $${m.monto.toFixed(2)} (+recargo)`;
      }
      return `${m.tipo} $${m.monto.toFixed(2)}`;
    })
    .join(', ');
}
