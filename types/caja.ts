export type UnidadNegocio = 'tattoo' | 'estilismo' | 'formacion';

export interface Personal {
  id: string;
  nombre: string;
  activo: boolean;
  unidadesDisponibles: UnidadNegocio[];
  telefono?: string;
  fechaIngreso: Date;
}

// Personal simplificado para lista de personal
export interface PersonalSimple {
  id: string;
  nombre: string;
  activo: boolean;
  comision: number;
  rol: 'admin' | 'vendedor';
}

// Cliente
export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  cuit?: string;
  señasDisponibles: {
    ars: number;
    usd: number;
  };
  fechaRegistro: Date;
}

// Productos y Servicios
export interface ProductoServicio {
  id: string;
  nombre: string;
  precio: number;
  tipo: 'producto' | 'servicio';
  businessUnit: UnidadNegocio;
  descripcion?: string;
  activo: boolean;
  duracion?: number;
  codigoBarras?: string;
  // Campos para precios congelados en ARS
  esPrecioCongelado?: boolean;
  precioFijoARS?: number;
}

// Item seleccionado en la comanda
export interface ItemComanda {
  productoServicioId: string;
  nombre: string;
  tipo: 'producto' | 'servicio';
  precio: number;
  precioOriginalUSD: number;
  cantidad: number;
  descuentoPorcentaje?: number;
  descuento: number;
  subtotal: number;
  personalId?: string;
  servicioId?: string;
  categoria?: string;
  // Campos para precios congelados en ARS (heredados del ProductoServicio)
  esPrecioCongelado?: boolean;
  precioFijoARS?: number;
  // Campo para egresos con monto fijo en ARS
  esMontoFijoARS?: boolean;
}

// Seña - Siguiendo el mismo patrón que MetodoPago
export interface Seña {
  monto: number;
  moneda: 'USD' | 'ARS';
  fecha: Date;
  observaciones?: string;
}

export interface MetodoPago {
  tipo:
    | 'efectivo'
    | 'tarjeta'
    | 'transferencia'
    | 'giftcard'
    | 'qr'
    | 'mixto'
    | 'precio_lista';
  monto: number;
  moneda: 'USD' | 'ARS';
  giftcard?: {
    nombre: string;
    codigo: string;
  };
}

// Comanda principal
export interface Comanda {
  id: string;
  numero: string;
  fecha: Date;
  businessUnit: UnidadNegocio;
  cliente: Cliente;
  mainStaff: Personal;
  items: ItemComanda[];
  seña?: Seña;
  metodosPago: MetodoPago[];
  subtotal: number;
  totalDescuentos: number;
  totalSeña: number; // Mantener para compatibilidad
  totalSeñaUSD: number;
  totalSeñaARS: number;
  montoSeñaAplicadaArs?: number;
  montoSeñaAplicadaUsd?: number;
  totalFinal: number;
  moneda?: 'USD' | 'ARS'; // Moneda principal de la transacción
  estado: 'pendiente' | 'completado' | 'cancelado';
  observaciones?: string;
  tipo: 'ingreso' | 'egreso';
  estadoNegocio?: EstadoComandaNegocio;
  estadoValidacion?: EstadoValidacion;
  tipoCambioAlCrear?: TipoCambio;
  metadata?: {
    movimientoManual?: boolean;
    cajaOrigen?: string;
    cajaDestino?: string;
    tipoMovimiento?: 'ingreso' | 'egreso' | 'transferencia';
  };
}

// Tipo de cambio
export interface TipoCambio {
  valorCompra: number;
  valorVenta: number;
  fecha: Date;
  fuente: string;
  modoManual: boolean;
}

// Filtros para búsquedas (UNIFICADO)
export interface FiltrosComanda {
  startDate?: Date;
  endDate?: Date;
  businessUnit?: UnidadNegocio;
  estado?: string;
  personalId?: string;
  metodoPago?: string;
  moneda?: string;
  cliente?: string;
  busqueda?: string;
  numeroComanda?: string;
}

// Estados
export type EstadoComandaNegocio = 'pendiente' | 'completado' | 'incompleto';
export type EstadoValidacion = 'no_validado' | 'validado';

// Aliases para compatibilidad
export type FiltrosEncomienda = FiltrosComanda;

// Configuración de columnas para tablas
export interface ColumnaComanda {
  key:
    | keyof Comanda
    | 'acciones'
    | 'cliente.nombre'
    | 'mainStaff.nombre'
    | 'servicios'
    | 'descuentoTotal'
    | 'iva'
    | 'total'
    | 'metodoPago'
    | 'vendedor'
    | 'estadoNegocio'
    | 'estadoValidacion';
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

export type ColumnaCaja = ColumnaComanda;

// Resumen para estadísticas
export interface ResumenCaja {
  totalIncoming: number;
  totalOutgoing: number;
  saldo: number;
  cantidadComandas: number;
  unidadMasActiva?: string;
  personalMasVentas?: string;
}

// Archivos adjuntos
export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'imagen';
  url: string;
  tamaño: number;
  fechaSubida: Date;
  descripcion?: string;
}

export interface ComandaConArchivos extends Comanda {
  archivosAdjuntos?: ArchivoAdjunto[];
}

export interface UploadConfig {
  maxTamaño: number;
  tiposPermitidos: string[];
  maxArchivos: number;
}

// Trazabilidad
export interface TrazabilidadComanda {
  creadoPor: string;
  fechaCreacion: string;
  modificadoPor?: string;
  fechaModificacion?: string;
  validadoPor?: string;
  fechaValidacion?: string;
  observacionesValidacion?: string;
}

// Historial
export interface HistorialTipoCambio {
  id: string;
  valorCompra: number;
  valorVenta: number;
  fechaCreacion: Date;
  creadoPor?: string;
}

export interface HistorialCambio {
  id: string;
  comandaId: string;
  usuario: string;
  accion:
    | 'creacion'
    | 'cambio_estado'
    | 'validacion'
    | 'edicion'
    | 'eliminacion';
  estadoAnterior: Record<string, unknown>;
  estadoNuevo: Record<string, unknown>;
  fecha: string;
  observaciones?: string;
}

// Validación extendida
export interface ComandaConValidacion extends Omit<Comanda, 'estado'> {
  estadoNegocio: EstadoComandaNegocio;
  estadoValidacion: EstadoValidacion;
  trazabilidad: TrazabilidadComanda;
  puedeEditar: boolean;
  puedeValidar: boolean;
}

// Traspaso
export interface TraspasoInfo {
  id: string;
  fechaTraspaso: string;
  adminQueTraspaso: string;
  comandasTraspasadas: string[];
  montoTotal: number;
  rangoFechas: {
    desde: string;
    hasta: string;
  };
  observaciones?: string;
  montoParcial?: number;
  montoResidual?: number;
  esTraspasoParcial?: boolean;
  // Nuevos campos para monedas separadas
  montoTotalUSD?: number;
  montoTotalARS?: number;
  montoParcialUSD?: number;
  montoParcialARS?: number;
  montoResidualUSD?: number;
  montoResidualARS?: number;
}

export interface ResumenConMontoParcial {
  totalCompletados: number;
  totalPendientes: number;
  montoNeto: number;
  totalIngresos: number;
  totalEgresos: number;
  // Campos separados por moneda
  totalIngresosUSD: number;
  totalEgresosUSD: number;
  totalIngresosARS: number;
  totalEgresosARS: number;
  montoNetoUSD: number;
  montoNetoARS: number;
  montoDisponibleParaTraslado: number;
  // Campos para traspaso parcial por moneda
  montoDisponibleTrasladoUSD: number;
  montoDisponibleTrasladoARS: number;
  montoParcialSeleccionado?: number;
  montoParcialSeleccionadoUSD?: number;
  montoParcialSeleccionadoARS?: number;
  montoResidual?: number;
  montoResidualUSD?: number;
  montoResidualARS?: number;
}

export interface ConfiguracionTraspasoParcial {
  montoMaximo: number;
  montoParcial: number;
  montoResidual: number;
  porcentajeSeleccionado: number;
  // Campos separados por moneda
  montoMaximoUSD: number;
  montoMaximoARS: number;
  montoParcialUSD: number;
  montoParcialARS: number;
  montoResidualUSD: number;
  montoResidualARS: number;
  porcentajeSeleccionadoUSD: number;
  porcentajeSeleccionadoARS: number;
}
export interface MetodoPagoForm extends MetodoPago {
  montoFinal: number;
  descuentoAplicado: number;
  montoOriginal: number;
  montoFinalARS?: number;
  descuentoOriginalARS?: number;
  montoFinalOriginalARS?: number;
}
