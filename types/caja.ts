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
  comision: number;
  rol: 'admin' | 'vendedor';
}

// Cliente
export interface Cliente {
  cuit?: string;
  nombre: string;
  telefono?: string;
  email?: string;
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
  duracion?: number; // minutos para servicios
  codigoBarras?: string; // para productos
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
}

// Seña
export interface Seña {
  monto: number;
  moneda: 'pesos' | 'dolares';
  fecha: Date;
  observaciones?: string;
}

export interface MetodoPago {
  tipo: 'efectivo' | 'tarjeta' | 'transferencia';
  monto: number;
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
  totalSeña: number;
  totalFinal: number;
  estado: 'pendiente' | 'completado' | 'validado' | 'cancelado';
  observaciones?: string;
  tipo: 'ingreso' | 'egreso';
  estadoNegocio?: EstadoComandaNegocio;
  estadoValidacion?: EstadoValidacion;
  tipoCambioAlCrear?: TipoCambio;
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
}

// Encomienda (para compatibilidad)
export interface Encomienda {
  id: string;
  fecha: Date;
  numero: string;
  cliente: string;
  telefono?: string;
  servicios: ItemComanda[];
  subtotal: number;
  descuentoTotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  observaciones?: string;
  vendedor: string;
  estado: 'pendiente' | 'completado' | 'validado' | 'cancelado';
  tipo: 'ingreso' | 'egreso';
  estadoNegocio?: EstadoComandaNegocio;
  estadoValidacion?: EstadoValidacion;
  metodosPago?: MetodoPago[];
}
