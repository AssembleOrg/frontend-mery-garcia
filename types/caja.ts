// Tipos para el sistema de salón Mery García

// Unidades de Negocio
export type UnidadNegocio = 'tattoo' | 'estilismo' | 'formacion';

// Personal del salón
export interface Personal {
  id: string;
  nombre: string;
  comisionPorcentaje: number; // ej: 15 = 15%
  activo: boolean;
  unidadesDisponibles: UnidadNegocio[];
  telefono?: string;
  fechaIngreso: Date;
}

// Personal simplificado para lista de personal
export interface PersonalSimple {
  id: string;
  nombre: string;
  comision: number; // Porcentaje 0-100
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
  // Para servicios
  duracion?: number; // minutos
  // Para productos (futuro stock)
  codigoBarras?: string;
}

// Item seleccionado en la comanda
export interface ItemComanda {
  productoServicioId: string;
  nombre: string;
  tipo: 'producto' | 'servicio';
  precio: number;
  cantidad: number;
  /** Porcentaje de descuento aplicado (0-100). Mantiene la intención de la UI. */
  descuentoPorcentaje?: number;
  descuento: number;
  subtotal: number;
  personalId?: string; // quien realizó el servicio/vendió
  // Legacy compatibility
  servicioId?: string; // mapea a productoServicioId
  categoria?: string; // mapea a tipo o descripción
}

// Seña
export interface Seña {
  monto: number;
  moneda: 'pesos' | 'dolares';
  fecha: Date;
  observaciones?: string;
}

// Método de pago individual
export interface MetodoPago {
  tipo: 'efectivo' | 'tarjeta' | 'transferencia';
  monto: number;
  recargoPorcentaje: number; // ej: 35 = 35%
  montoFinal: number; // monto + recargo
}

// Comisión calculada
export interface Comision {
  personalId: string;
  personalNombre: string;
  itemComandaId: string;
  montoBase: number;
  porcentaje: number;
  montoComision: number;
}

// Comanda principal
export interface Comanda {
  id: string;
  numero: string; // manual, único global
  fecha: Date;
  businessUnit: UnidadNegocio;
  cliente: Cliente;
  mainStaff: Personal; // quien registra la comanda
  items: ItemComanda[];
  seña?: Seña;
  metodosPago: MetodoPago[];
  subtotal: number;
  totalDescuentos: number;
  totalRecargos: number;
  totalSeña: number;
  totalFinal: number;
  comisiones: Comision[];
  estado: 'pendiente' | 'completado' | 'validado' | 'cancelado';
  observaciones?: string;
  tipo: 'ingreso' | 'egreso';
  // Campos para validación
  estadoNegocio?: EstadoComandaNegocio;
  estadoValidacion?: EstadoValidacion;
}

// Configuración de recargos por método de pago
export interface ConfiguracionRecargo {
  metodoPago: 'tarjeta' | 'transferencia';
  porcentaje: number;
  activo: boolean;
}

// Tipo de cambio
export interface TipoCambio {
  valorCompra: number;
  valorVenta: number;
  fecha: Date;
  fuente: string; // 'manual' | 'dolarOK'
  /** Si true, el usuario prefiere valor manual y no se debe sobrescribir con API */
  modoManual: boolean;
}

// Filtros para búsquedas
export interface FiltrosComanda {
  startDate?: Date;
  endDate?: Date;
  businessUnit?: UnidadNegocio;
  estado?: string;
  personalId?: string;
  numeroComanda?: string;
  cliente?: string;
  busqueda?: string;
  // Legacy compatibility
  metodoPago?: string;
  vendedor?: string;
}

// Configuración de columns para tablas
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

// Resumen para estadísticas
export interface ResumenCaja {
  totalIncoming: number;
  totalOutgoing: number;
  saldo: number;
  cantidadComandas: number;
  comisionesTotales: number;
  unidadMasActiva?: string;
  personalMasVentas?: string;
}

// Legacy types para compatibilidad (eliminar gradualmente)
export type FiltrosEncomienda = FiltrosComanda;
export type ColumnaCaja = ColumnaComanda;

// Tipo legacy para compatibilidad con el código existente
export interface Encomienda {
  id: string;
  fecha: Date;
  numero: string;
  cliente: string; // legacy: solo nombre
  telefono?: string;
  servicios: ItemComanda[]; // legacy: items
  subtotal: number;
  descuentoTotal: number;
  iva: number;
  total: number;
  metodoPago: string; // legacy: string simple
  observaciones?: string;
  vendedor: string; // legacy: nombre del personal
  estado: 'pendiente' | 'completado' | 'validado' | 'cancelado';
  tipo: 'ingreso' | 'egreso';
  // Nuevos campos para validación
  estadoNegocio?: EstadoComandaNegocio;
  estadoValidacion?: EstadoValidacion;
  /** Detalle completo de métodos de pago (si fue mixto) */
  metodosPago?: MetodoPago[];
}

// Nuevo tipo para archivos adjuntos
export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'imagen';
  url: string;
  tamaño: number; // en bytes
  fechaSubida: Date;
  descripcion?: string;
}

// Agregar a la interfaz Comanda existente
export interface ComandaConArchivos extends Comanda {
  archivosAdjuntos?: ArchivoAdjunto[];
}

// Tipos para el componente de upload
export interface UploadConfig {
  maxTamaño: number; // en MB
  tiposPermitidos: string[];
  maxArchivos: number;
}

// Estados de la comanda por vendedor (nuevos estados específicos)
export type EstadoComandaNegocio = 'pendiente' | 'completado' | 'incompleto';

// Estados de validación por admin
export type EstadoValidacion = 'no_validado' | 'validado';

// Información de trazabilidad
export interface TrazabilidadComanda {
  creadoPor: string; // ID del usuario que creó
  fechaCreacion: string;
  modificadoPor?: string; // ID del último usuario que modificó
  fechaModificacion?: string;
  validadoPor?: string; // ID del admin que validó
  fechaValidacion?: string;
  observacionesValidacion?: string;
}

// Historial de cambios para auditoría
export interface HistorialCambio {
  id: string;
  comandaId: string;
  usuario: string;
  accion: 'creacion' | 'edicion' | 'validacion' | 'cambio_estado';
  estadoAnterior?: Record<string, unknown>;
  estadoNuevo: Record<string, unknown>;
  fecha: string;
  observaciones?: string;
}

// Nueva interfaz para comandas con funcionalidades extendidas
export interface ComandaConValidacion extends Omit<Comanda, 'estado'> {
  estadoNegocio: EstadoComandaNegocio; // Estado del negocio (vendedor)
  estadoValidacion: EstadoValidacion; // Validación del admin
  trazabilidad: TrazabilidadComanda;
  puedeEditar: boolean; // Calculado: false si está validado
  puedeValidar: boolean; // Calculado: true si es admin y no está validado
}

// Información del traspaso a Caja 2
export interface TraspasoInfo {
  id: string;
  fechaTraspaso: string;
  adminQueTraspaso: string;
  comandasTraspasadas: string[]; // IDs de comandas
  montoTotal: number;
  rangoFechas: {
    desde: string;
    hasta: string;
  };
  observaciones?: string;
}

// Filtros extendidos para las nuevas funcionalidades
export interface FiltrosComandaExtendidos {
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
  vendedor?: string;
  metodoPago?: string;
  estadoNegocio?: EstadoComandaNegocio[];
  estadoValidacion?: EstadoValidacion[];
  soloEditables?: boolean;
  soloValidables?: boolean;
}
