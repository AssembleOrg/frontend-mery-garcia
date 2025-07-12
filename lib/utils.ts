import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  success: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, ...args);
    }
  },
  warning: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
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

export function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatARS(amountUSD: number, exchangeRate = 1000) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(amountUSD * exchangeRate);
}

export function formatCurrencyUyu(amount: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number) {
  return new Intl.NumberFormat('es-AR').format(amount);
}

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

export function formatDualCurrency(
  amountUSD: number,
  exchangeRate: number,
  showARS: boolean = true
): string {
  const usdFormatted = formatUSD(amountUSD);

  if (!showARS) {
    return usdFormatted;
  }

  const arsFormatted = formatARS(amountUSD, exchangeRate);
  return `${usdFormatted} (≈ ${arsFormatted})`;
}

export function isValidExchangeRate(exchangeRate: number): boolean {
  return (
    typeof exchangeRate === 'number' &&
    exchangeRate > 0 &&
    isFinite(exchangeRate)
  );
}

export function resolverMetodoPagoPrincipal(
  metodosPago: Array<{ tipo: string; monto: number }>
): string {
  if (!metodosPago || metodosPago.length === 0) {
    return 'efectivo';
  }

  if (metodosPago.length === 1) {
    return metodosPago[0].tipo;
  }

  const metodoPrincipal = metodosPago.reduce((prev, current) =>
    current.monto > prev.monto ? current : prev
  );

  const totalMonto = metodosPago.reduce((sum, m) => sum + m.monto, 0);
  const porcentajePrincipal = (metodoPrincipal.monto / totalMonto) * 100;

  if (porcentajePrincipal < 80) {
    return 'mixto';
  }

  return metodoPrincipal.tipo;
}

export function formatearDetalleMetodosPago(
  metodosPago: Array<{ tipo: string; monto: number }>
): string {
  if (!metodosPago || metodosPago.length === 0) {
    return 'Sin métodos de pago';
  }

  if (metodosPago.length === 1) {
    const metodo = metodosPago[0];
    return `${metodo.tipo} ${formatUSD(metodo.monto)}`;
  }

  return metodosPago.map((m) => `${m.tipo} ${formatUSD(m.monto)}`).join(', ');
}
