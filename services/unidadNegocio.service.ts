import { apiFetch } from "@/lib/apiClient";

export interface Movimiento {
  id: string;
  montoARS: number;
  montoUSD: number;
  comandas?: Partial<ComandaCreateNew>[];
  esIngreso: boolean;
  residualARS: number;
  residualUSD: number;
  comentario?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export type MovimientoCreateNew = Partial<Movimiento> & {
  comandasValidadasIds?: string[];
  personalId?: string;
  comandas?: Partial<ComandaNew>[];
};
export type MovimientoUpdateNew = Partial<Movimiento> & {
  comandasValidadasIds?: string[];
  personalId?: string;
};


export interface FiltrarComandasNew {
  /** Número de página (≥ 1) — *default*: 1 */
  page?: number;

  /** Registros por página (1-100) — *default*: 10 */
  limit?: number;

  /** Búsqueda parcial por `numero` */
  search?: string;

  /** Ingreso / Egreso */
  tipoDeComanda?: TipoDeComandaNew;

  /** Abierta, Cerrada, etc. */
  estadoDeComanda?: EstadoDeComandaNew;

  /** UUID del cliente */
  clienteNombre?: string;

  /** UUID de la unidad de negocio */
  unidadNegocioId?: string;

  /** UUID del servicio */
  servicioId?: string;

  /** UUID del trabajador asignado */
  trabajadorNombre?: string;

  /** UUID del personal creador */
  creadoPorNombre?: string;

  /** ISO-date de inicio (inclusive) */
  fechaDesde?: string;

  /** ISO-date de fin (inclusive) */
  fechaHasta?: string;

  /** Campo por el que ordenar — *default*: 'createdAt' */
  orderBy?: 'createdAt' | 'numero' | 'tipoDeComanda' | 'estadoDeComanda' | 'creadoPor';

  /** Dirección ASC/DESC — *default*: 'DESC' */
  order?: 'ASC' | 'DESC';

  /** Incluir comandas traspasadas */
  incluirTraspasadas?: boolean;
}

export enum TipoDeComandaNew {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

export enum EstadoDeComandaNew {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  CANCELADA = 'CANCELADA',
  FINALIZADA = 'FINALIZADA',
  TRASPASADA = 'TRASPASADA',
  VALIDADO = 'VALIDADO',
}

export interface Egreso {
  id: string;
  total: number;
  totalDolar: number;
  totalPesos: number;
  valorDolar: number;
  moneda: string;
}

export interface EgresoFromPaginacion {
  id: string;
  total: string;
  totalDolar: string;
  totalPesos: string;
  valorDolar: string;
  moneda: string;
}

export type EgresoCreateNew = Partial<Egreso>;
export type EgresoUpdateNew = Partial<Egreso>;

export enum CajaNew {
  CAJA_1 = 'caja_1',
  CAJA_2 = 'caja_2',
}

export enum RolTrabajadorNew {
  TRABAJADOR = 'TRABAJADOR',
  ENCARGADO = 'ENCARGADO',
  VENDEDOR = 'VENDEDOR',
}

export enum RolPersonalNew {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  USER = 'user',
}

export interface TrabajadorNew {
  id: string;
  nombre: string;
  email: string;
  rol: RolTrabajadorNew;
  telefono: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  comandas: ComandaNew[];
  comisionPorcentaje: number;
}

export type TrabajadorCreateNew = Partial<TrabajadorNew>;
export type TrabajadorUpdateNew = Partial<TrabajadorNew>;

export interface PersonalNew {
  id: string;
  movimientos: MovimientoNew[];
  email: string;
  password: string;
  activo: boolean;
  rol: RolPersonalNew;
  comandas: ComandaNew[];
  nombre: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export enum TipoPagoNew {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  GIFT_CARD = 'GIFT_CARD',
}

export interface UnidadNegocioNew {
  id: string;
  nombre: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  productosServicios: ProductoServicioNew[];
}

export type UnidadNegocioCreateNew = Partial<UnidadNegocioNew>;
export enum MonedaNew {
  ARS = 'ARS',
  USD = 'USD',
}
export enum EstadoPrepagoNew {
  ACTIVA = 'ACTIVO',
  UTILIZADA = 'UTILIZADO',
  VENCIDA = 'VENCIDO',
  CANCELADA = 'CANCELADO',
}

export interface PrepagoGuardadoNew {
  id: string;
  monto: number;
  moneda: MonedaNew;
  fechaCreacion: string;
  fechaVencimiento: string;
  cliente: ClienteNew;
  estado: EstadoPrepagoNew;
  comanda: ComandaNew;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export interface SeñaNew {
  ars: number;
  usd: number;
}

export interface ClienteNew {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  activo: boolean;
  cuit?: string;
  dni?: string;
  fechaRegistro: string;
  comentarios: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  items: ComandaNew[];
  señasDisponibles: SeñaNew;
  prepagosGuardados: PrepagoGuardadoNew[];
}

export enum NombreDescuentoNew {
  DESCUENTO_COMANDA = 'DESCUENTO_COMANDA',
  DESCUENTO_ITEM = 'DESCUENTO_ITEM',
  DESCUENTO_POR_METODO_PAGO = 'DESCUENTO_POR_METODO_PAGO',
}

export interface DescuentoNew {
  id: string;
  nombre: NombreDescuentoNew;
  descripcion?: string | null;

  /** % de descuento (0–100, ej. 15.5) */
  porcentaje: number;

  /** Monto fijo en AR$ que se descuenta además del % */
  montoFijo: number;

  /** Comanda sobre la que se aplica */
  comanda: ComandaNew;

  /* ---------- Fechas ---------- */
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MetodoPagoNew {
  id: string;

  /** Efectivo, débito, crédito, etc. */
  tipo: TipoPagoNew;

  /** Importe original ingresado */
  monto: number;

  /** % de recargo aplicado (0–100) */
  recargoPorcentaje: number;

  descuentoGlobalPorcentaje: number;
  moneda: MonedaNew;

  /** Importe resultante luego del recargo */
  montoFinal: number;

  /** Comanda a la que pertenece */
  comanda: ComandaNew;

  /* ---------- Fechas ---------- */
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export enum TipoItemNew {
  EGRESO = 'EGRESO',
  INGRESO = 'INGRESO',
}

export interface ItemComandaNew {
  /** PK */
  id: string;

  /** Producto o servicio asociado (se carga eager) */
  productoServicio: ProductoServicioNew;

  /** Nombre “congelado” al momento de la venta */
  nombre: string;

  /** Tipo de ítem (servicio, producto, combo, etc.) */
  tipo: TipoItemNew;

  /** Precio unitario al momento de la venta */
  precio: number;

  /** Cantidad vendida */
  cantidad: number;

  /** Descuento unitario aplicado (en AR$) */
  descuento: number;

  /** Subtotal = (precio − descuento) × cantidad */
  subtotal: number;

  /* ---------- Fechas ---------- */
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  /* ---------- Relaciones ---------- */
  comanda: ComandaNew;
  trabajador: TrabajadorNew;
  metodosPago: Partial<MetodoPagoNew>[];
}

export type ItemComandaCreateNew = Partial<ItemComandaNew> & {
  comandaId?: string;
  productoServicioId?: string;
  trabajador?: TrabajadorNew;
  trabajadorId?: string;
  responsablesIds?: string[];
  mostrarSelectorResponsables?: boolean;
}

export type ItemComandaUpdateNew = Partial<ItemComandaNew> & {
  comandaId?: string;
  productoServicioId?: string;
  trabajadorId?: string;
}

export interface MovimientoNew {
  /** PK */
  id: string;

  /** Monto del movimiento en AR$ */
  montoARS: number;

  /** Monto del movimiento en US$ */
  montoUSD: number;

  residualARS: number;

  residualUSD: number;
  comentario?: string;
  esIngreso?: boolean;

  /** Comanda asociada (relación obligatoria) */
  comandas: ComandaNew[];


  /** Personal que lo registró (puede ser nulo) */
  personal?: PersonalNew | null;

  /** Saldo residual luego del movimiento */
  residual: number;

  /* ---------- Fechas ---------- */
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ComandaNew {
  id: string;
  numero: string;
  caja: CajaNew;
  createdAt: Date;
  updatedAt: string;
  deletedAt: string;
  estadoDeComanda: EstadoDeComandaNew;
  tipoDeComanda: TipoDeComandaNew;
  creadoPor: TrabajadorNew;
  cliente: ClienteNew;
  movimientos: MovimientoNew[];
  usuarioConsumePrepagoARS: boolean;
  usuarioConsumePrepagoUSD: boolean;
  descuentosAplicados: Partial<DescuentoNew>[];
  items: ItemComandaCreateNew[];
  productosServicios: ProductoServicioNew[];
  egresos?: EgresoCreateNew[];
  precioDolar: number;
  precioPesos: number;
  valorDolar: number;
  responsablesIds?: string[];
  observaciones: string;
}

export type ComandaCreateNew = Partial<ComandaNew> & {
  clienteId?: string;
  creadoPorId?: string;
  unidadNegocioId?: string;
  egresos?: EgresoCreateNew[];
};
export type ComandaUpdateNew = Partial<ComandaNew> & {
  clienteId?: string;
  creadoPorId?: string;
  unidadNegocioId?: string;
};

export enum TipoProductoServicioNew {
  PRODUCTO = 'PRODUCTO',
  SERVICIO = 'SERVICIO',
}

export interface ProductoServicioNew {
  id: string;
  nombre: string;
  precio: number;
  tipo: TipoProductoServicioNew;
  unidadNegocio: UnidadNegocioNew;
  descripcion: string;
  duracion: number;
  codigoBarras: string;
  esPrecioCongelado: boolean;
  precioFijoARS: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  comandas: ComandaNew[];
}

export type ProductoServicioCreateNew = Partial<ProductoServicioNew> & { unidadNegocioId: string };
export type ProductoServicioUpdateNew = Partial<ProductoServicioNew> & { unidadNegocioId: string };

export interface FiltrarProductosServiciosNew {
  /** Búsqueda parcial por nombre (case-insensitive) */
  nombre?: string;

  /** Producto o servicio */
  tipo?: TipoProductoServicioNew;

  /** UUID de la unidad de negocio */
  unidadNegocioId?: string;

  /** Sólo activos/inactivos */
  activo?: boolean;

  /** Paginación ─ número de página (>= 1, default 1) */
  page?: number;

  /** Paginación ─ items por página (1-100, default 20) */
  limit?: number;

  /** Sólo ítems con precio congelado */
  esPrecioCongelado?: boolean;

  /** Campo por el que se ordena (default 'nombre') */
  orderBy?: 'nombre' | 'precio' | 'tipo' | 'unidadNegocioId' | 'createdAt';

  /** Dirección ASC/DESC (default 'ASC') */
  orderDirection?: 'ASC' | 'DESC';
}


export class UnidadNegocioService {
  private readonly baseUrl = '/api/unidades-negocio';

  async crearUnidadNegocio(unidadNegocio: UnidadNegocioCreateNew): Promise<UnidadNegocioNew> {
    const response = await apiFetch<
      {
        data: UnidadNegocioNew;
        status: string;
      }
    >(`${this.baseUrl}`, {
      method: 'POST',
      json: unidadNegocio,
    });
    return response.data;
  }

  async getAllUnidadesNegocio(): Promise<UnidadNegocioNew[]> {
    const response = await apiFetch<
      {
        data: UnidadNegocioNew[];
        status: string;
      }
    >(`${this.baseUrl}`);
    return response.data;
  }

  async getUnidadNegocioById(id: string): Promise<UnidadNegocioNew> {
    const response = await apiFetch<
      {
        data: UnidadNegocioNew;
        status: string;
      }
    >(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async actualizarUnidadNegocio(id: string, unidadNegocio: UnidadNegocioCreateNew): Promise<UnidadNegocioNew> {
    const response = await apiFetch<
      {
        data: UnidadNegocioNew;
        status: string;
      }
    >(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      json: unidadNegocio,
    });
    return response.data;
  }
}
export const unidadNegocioService = new UnidadNegocioService();
