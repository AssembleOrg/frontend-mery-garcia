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

export function formatARSNative(amountARS: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(amountARS);
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

  // Verificar si todos los métodos de pago son del mismo tipo
  const tiposUnicos = [...new Set(metodosPago.map(m => m.tipo.toLowerCase()))];
  
  // Si hay más de un tipo diferente, es mixto
  if (tiposUnicos.length > 1) {
    return 'mixto';
  }

  // Si todos son del mismo tipo, devolver ese tipo
  return metodosPago[0].tipo;
}

export function formatearDetalleMetodosPago(
  metodosPago: Array<{ tipo: string; monto: number; moneda?: string }>
): string {
  if (!metodosPago || metodosPago.length === 0) {
    return 'Sin métodos de pago';
  }

  if (metodosPago.length === 1) {
    const metodo = metodosPago[0];
    const moneda = metodo.moneda || 'USD';
    const montoFormateado =
      moneda === 'ARS'
        ? formatARSNative(metodo.monto)
        : formatUSD(metodo.monto);
    return `${metodo.tipo} ${montoFormateado}`;
  }

  return metodosPago
    .map((m) => {
      const moneda = m.moneda || 'USD';
      const montoFormateado =
        moneda === 'ARS' ? formatARSNative(m.monto) : formatUSD(m.monto);
      return `${m.tipo} ${montoFormateado}`;
    })
    .join(', ');
}

export function resolverMetodoPagoPrincipalConMoneda(
  metodosPago: Array<{ tipo: string; monto: number; moneda?: string }>
): string {
  if (!metodosPago || metodosPago.length === 0) {
    return 'EFE - USD';
  }

  if (metodosPago.length === 1) {
    const metodo = metodosPago[0];
    const moneda = metodo.moneda || 'USD';
    const tipoAbrev = abreviarTipoMetodo(metodo.tipo);
    return `${tipoAbrev} - ${moneda}`;
  }

  const metodoPrincipal = metodosPago.reduce((prev, current) =>
    current.monto > prev.monto ? current : prev
  );

  const totalMonto = metodosPago.reduce((sum, m) => sum + m.monto, 0);
  const porcentajePrincipal = (metodoPrincipal.monto / totalMonto) * 100;

  if (porcentajePrincipal < 80) {
    // Para mixto, mostrar las monedas involucradas
    const monedasUnicas = [
      ...new Set(metodosPago.map((m) => m.moneda || 'USD')),
    ];
    return monedasUnicas.length > 1
      ? 'MIXTO - USD/ARS'
      : `MIXTO - ${monedasUnicas[0]}`;
  }

  const moneda = metodoPrincipal.moneda || 'USD';
  const tipoAbrev = abreviarTipoMetodo(metodoPrincipal.tipo);
  return `${tipoAbrev} - ${moneda}`;
}

function abreviarTipoMetodo(tipo: string): string {
  switch (tipo.toLowerCase()) {
    case 'efectivo':
      return 'EFE';
    case 'tarjeta':
      return 'TAR';
    case 'transferencia':
      return 'TRANS';
    case 'giftcard':
      return 'GIFT';
    case 'qr':
      return 'QR';
    case 'precio_lista':
      return 'LISTA';
    case 'mixto':
      return 'MIXTO';
    default:
      return tipo.toUpperCase().substring(0, 5);
  }
}

/**
 * Genera el próximo número de comanda basado en el tipo
 * @param tipo - Tipo de comanda ('ingreso' | 'egreso')
 * @returns Número de comanda formateado
 */
export const obtenerProximoNumero = (tipo: 'ingreso' | 'egreso'): string => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  
  const prefijo = tipo === 'ingreso' ? 'ING' : 'EGR';
  
  return `${prefijo}-${año}${mes}${dia}-${timestamp}`;
};

/**
 * Genera un número de comanda manual
 * @returns Número de comanda manual formateado
 */
export const obtenerNumeroComandaManual = (): string => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  
  return `MAN-${año}${mes}${dia}-${timestamp}`;
};
