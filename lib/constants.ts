// Estados de comandas - CONSISTENCIA TOTAL
export const ESTADOS_COMANDA = {
  PENDIENTE: 'pendiente',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
} as const;

export type EstadoComanda =
  (typeof ESTADOS_COMANDA)[keyof typeof ESTADOS_COMANDA];

export const ESTADOS_VALIDACION = {
  NO_VALIDADO: 'no_validado',
  VALIDADO: 'validado',
} as const;

export type EstadoValidacion =
  (typeof ESTADOS_VALIDACION)[keyof typeof ESTADOS_VALIDACION];

export const METODOS_PAGO = {
  EFECTIVO: 'EFECTIVO',
  TARJETA: 'TARJETA',
  TRANSFERENCIA: 'TRANSFERENCIA',
  GIFTCARD: 'GIFT_CARD',
  QR: 'QR',
  MIXTO: 'MIXTO',
  PRECIO_LISTA: 'PRECIO_LISTA',
} as const;

export type MetodoPago = (typeof METODOS_PAGO)[keyof typeof METODOS_PAGO];

// Monedas soportadas
export const MONEDAS = {
  USD: 'USD',
  ARS: 'ARS',
} as const;

export type Moneda = (typeof MONEDAS)[keyof typeof MONEDAS];

export const MONEDA_LABELS = {
  [MONEDAS.USD]: 'USD ($)',
  [MONEDAS.ARS]: 'ARS ($)',
} as const;

// Labels para estados
export const ESTADO_LABELS = {
  [ESTADOS_COMANDA.PENDIENTE]: '⏳ Pendiente',
  [ESTADOS_COMANDA.COMPLETADO]: '✅ Completado',
  [ESTADOS_COMANDA.CANCELADO]: '❌ Cancelado',
} as const;

export const VALIDACION_LABELS = {
  [ESTADOS_VALIDACION.NO_VALIDADO]: '⏳ Sin Validar',
  [ESTADOS_VALIDACION.VALIDADO]: '🔒 Validado',
} as const;

export const METODO_PAGO_LABELS = {
  [METODOS_PAGO.EFECTIVO]: 'Efectivo',
  [METODOS_PAGO.TARJETA]: 'Tarjeta',
  [METODOS_PAGO.TRANSFERENCIA]: 'Transferencia',
  [METODOS_PAGO.GIFTCARD]: 'Gift Card',
  [METODOS_PAGO.QR]: 'QR',
  [METODOS_PAGO.MIXTO]: 'Mixto',
} as const;

// Colores para estados
export const ESTADO_COLORS = {
  [ESTADOS_COMANDA.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [ESTADOS_COMANDA.COMPLETADO]: 'bg-green-100 text-green-800',
  [ESTADOS_COMANDA.CANCELADO]: 'bg-red-100 text-red-800',
} as const;

// Reglas de validación comunes
export const VALIDATION_RULES = {
  CLIENTE: {
    required: true,
    minLength: 2,
    message: 'El nombre del cliente es obligatorio (mínimo 2 caracteres)',
  },
  TELEFONO: {
    required: false,
    pattern: /^[\d\s\-\+\(\)]+$/,
    message:
      'El teléfono debe contener solo números, espacios, guiones y paréntesis',
  },
  NUMERO_COMANDA: {
    required: true,
    pattern: /^\d+$/,
    message: 'El número de comanda debe ser numérico',
  },
  SERVICIOS: {
    required: true,
    minItems: 1,
    message: 'Debe agregar al menos un servicio',
  },
  PRECIO: {
    required: true,
    min: 0.01,
    message: 'El precio debe ser mayor a 0',
  },
  CANTIDAD: {
    required: true,
    min: 1,
    message: 'La cantidad debe ser mayor a 0',
  },
} as const;
