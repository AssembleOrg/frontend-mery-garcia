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
  unidadNegocio: UnidadNegocio;
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
  unidadNegocio: UnidadNegocio;
  cliente: Cliente;
  personalPrincipal: Personal; // quien registra la comanda
  items: ItemComanda[];
  seña?: Seña;
  metodosPago: MetodoPago[];
  subtotal: number;
  totalDescuentos: number;
  totalRecargos: number;
  totalSeña: number;
  totalFinal: number;
  comisiones: Comision[];
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  observaciones?: string;
  tipo: 'ingreso' | 'egreso';
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
}

// Filtros para búsquedas
export interface FiltrosComanda {
  fechaInicio?: Date;
  fechaFin?: Date;
  unidadNegocio?: UnidadNegocio;
  estado?: string;
  personalId?: string;
  numeroComanda?: string;
  cliente?: string;
  busqueda?: string;
  // Legacy compatibility
  metodoPago?: string;
  vendedor?: string;
}

// Configuración de columnas para tablas
export interface ColumnaComanda {
  key:
    | keyof Comanda
    | 'acciones'
    | 'cliente.nombre'
    | 'personalPrincipal.nombre'
    | 'servicios'
    | 'descuentoTotal'
    | 'iva'
    | 'total'
    | 'metodoPago'
    | 'vendedor';
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

// Resumen para estadísticas
export interface ResumenCaja {
  totalIngresos: number;
  totalEgresos: number;
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
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  tipo: 'ingreso' | 'egreso';
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
