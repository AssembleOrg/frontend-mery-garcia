import { apiFetch, getToken } from '@/lib/apiClient';

export type Moneda = 'ARS' | 'USD';
export type TipoAcreedor = 'PERSONA' | 'EMPRESA';
export type EstadoDeuda = 'PENDIENTE' | 'PARCIAL' | 'SALDADA';

export interface Totales {
  deuda: number;
  pagado: number;
  saldo: number;
  /** Adelantos sin aplicar. */
  aFavor: number;
  /** saldo - aFavor (negativo = se adelantó de más). */
  neto: number;
}

export interface Comprobante {
  id: string;
  pagoId: string | null;
  adelantoId: string | null;
  nombre: string;
  mimeType: string;
  tamanio: number;
  createdAt: string;
  editable: boolean;
}

export interface Pago {
  id: string;
  deudaId: string;
  monto: number;
  fecha: string;
  metodo: string | null;
  nota: string | null;
  /** Si es un descuento de adelanto (no salió plata en este pago). */
  adelantoId: string | null;
  adelanto: { id: string; concepto: string; fecha: string } | null;
  creadoPorNombre: string | null;
  createdAt: string;
  editableHasta: string;
  editable: boolean;
  comprobantes: Comprobante[];
}

export interface Adelanto {
  id: string;
  acreedorId: string;
  acreedor?: { id: string; nombre: string; tipo: TipoAcreedor };
  concepto: string;
  moneda: Moneda;
  monto: number;
  fecha: string;
  /** Orientativa: cuándo se espera liquidar. */
  fechaEstimada: string | null;
  metodo: string | null;
  nota: string | null;
  creadoPorNombre: string | null;
  createdAt: string;
  editableHasta: string;
  editable: boolean;
  aplicado: number;
  disponible: number;
  aplicaciones: {
    pagoId: string;
    deudaId: string;
    deudaConcepto: string | null;
    monto: number;
    fecha: string;
    createdAt: string;
    editable: boolean;
  }[];
  comprobantes: Comprobante[];
}

export interface Deuda {
  id: string;
  acreedorId: string;
  acreedor?: { id: string; nombre: string; tipo: TipoAcreedor };
  concepto: string;
  moneda: Moneda;
  monto: number;
  fecha: string;
  vencimiento: string | null;
  notas: string | null;
  creadoPorNombre: string | null;
  createdAt: string;
  editableHasta: string;
  /** Dentro de las 24 h: se puede cambiar monto/moneda/fecha o borrar. */
  editable: boolean;
  pagado: number;
  saldo: number;
  estado: EstadoDeuda;
  vencida: boolean;
  /** Saldo a favor del acreedor en esta moneda que se puede descontar. */
  aFavorDisponible: number;
  pagos: Pago[];
}

export interface Acreedor {
  id: string;
  nombre: string;
  tipo: TipoAcreedor;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  createdAt: string;
}

export interface AcreedorResumen extends Acreedor {
  totales: Record<Moneda, Totales>;
  cantidadDeudas: number;
  deudasAbiertas: number;
  deudasVencidas: number;
  adelantosAbiertos: number;
  ultimoMovimiento: string;
}

export interface AcreedorDetalle extends Acreedor {
  totales: Record<Moneda, Totales>;
  deudas: Deuda[];
  adelantos: Adelanto[];
}

export type TipoMovimiento =
  | 'ACREEDOR_CREADO'
  | 'ACREEDOR_EDITADO'
  | 'ACREEDOR_ELIMINADO'
  | 'DEUDA_CREADA'
  | 'DEUDA_EDITADA'
  | 'DEUDA_ELIMINADA'
  | 'PAGO_REGISTRADO'
  | 'PAGO_EDITADO'
  | 'PAGO_ELIMINADO'
  | 'COMPROBANTE_AGREGADO'
  | 'COMPROBANTE_ELIMINADO'
  | 'ADELANTO_REGISTRADO'
  | 'ADELANTO_EDITADO'
  | 'ADELANTO_ELIMINADO'
  | 'ADELANTO_APLICADO';

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  acreedorId: string | null;
  deudaId: string | null;
  pagoId: string | null;
  adelantoId: string | null;
  moneda: Moneda | null;
  monto: number | null;
  descripcion: string;
  detalle: Record<string, { antes: unknown; despues: unknown } | unknown> | null;
  usuarioNombre: string | null;
  createdAt: string;
}

export interface KpisMoneda {
  deudaTotal: number;
  pagadoTotal: number;
  saldo: number;
  saldoVencido: number;
  deudasAbiertas: number;
  deudasVencidas: number;
  acreedoresConSaldo: number;
  nuevaDeudaMes: number;
  pagadoMes: number;
  pagadoMesAnterior: number;
  porcentajeCancelado: number;
  saldoAFavor: number;
  adelantosAbiertos: number;
  /** saldo - saldoAFavor. */
  saldoNeto: number;
}

export interface PuntoSerie {
  mes: string;
  ARS: { deuda: number; pagos: number; saldo: number };
  USD: { deuda: number; pagos: number; saldo: number };
}

export interface Resumen {
  hoy: string;
  kpis: Record<Moneda, KpisMoneda>;
  serie: PuntoSerie[];
  acreedores: { id: string; nombre: string; tipo: TipoAcreedor; ARS: number; USD: number }[];
  proximosVencimientos: Omit<Deuda, 'pagos'>[];
  adelantosPendientes: Omit<Adelanto, 'aplicaciones' | 'comprobantes'>[];
  actividad: Movimiento[];
}

export interface GuardarAcreedor {
  nombre: string;
  tipo: TipoAcreedor;
  documento?: string;
  telefono?: string;
  email?: string;
  notas?: string;
}

export interface GuardarDeuda {
  acreedorId: string;
  concepto: string;
  moneda: Moneda;
  monto: number;
  fecha?: string;
  vencimiento?: string | null;
  notas?: string;
  /** Al crear: descontar el saldo a favor del acreedor. */
  aplicarAdelantos?: boolean;
}

export interface GuardarAdelanto {
  acreedorId: string;
  concepto: string;
  moneda: Moneda;
  monto: number;
  fecha?: string;
  fechaEstimada?: string | null;
  metodo?: string;
  nota?: string;
}

export interface GuardarPago {
  monto: number;
  fecha?: string;
  metodo?: string;
  nota?: string;
}

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/contable';

function urlApi(path: string): string {
  return `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')}${path}`;
}

function cabecerasAuth(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Mensaje legible de un error de apiFetch ("API 409: ..." → "..."). */
export function mensajeError(e: unknown, porDefecto = 'Algo salió mal'): string {
  const msg = e instanceof Error ? e.message : '';
  const limpio = msg.replace(/^API \d+:\s*/, '');
  if (!limpio || limpio.startsWith('[') || limpio.startsWith('{')) return porDefecto;
  return limpio;
}

async function get<T>(path: string): Promise<T> {
  return (await apiFetch<Envelope<T>>(`${BASE}${path}`)).data;
}

async function send<T>(method: 'POST' | 'PUT', path: string, json: unknown): Promise<T> {
  return (await apiFetch<Envelope<T>>(`${BASE}${path}`, { method, json })).data;
}

async function del(path: string): Promise<void> {
  await apiFetch(`${BASE}${path}`, { method: 'DELETE' });
}

/** multipart: no pasa por apiFetch porque no es JSON. */
async function subir<T>(path: string, archivos: File[]): Promise<T> {
  const form = new FormData();
  for (const a of archivos) form.append('comprobantes', a, a.name);
  const res = await fetch(urlApi(`${BASE}${path}`), {
    method: 'POST',
    headers: cabecerasAuth(),
    body: form,
  });
  const json = (await res.json().catch(() => null)) as Envelope<T> | { message?: string } | null;
  if (!res.ok) {
    const msg = (json as { message?: string | string[] } | null)?.message;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || `Error ${res.status}`);
  }
  return (json as Envelope<T>).data;
}

export const contableService = {
  resumen: (meses = 12) => get<Resumen>(`/resumen?meses=${meses}`),

  acreedores: (buscar?: string) =>
    get<AcreedorResumen[]>(`/acreedores${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''}`),
  acreedor: (id: string) => get<AcreedorDetalle>(`/acreedores/${id}`),
  crearAcreedor: (d: GuardarAcreedor) => send<Acreedor>('POST', '/acreedores', d),
  actualizarAcreedor: (id: string, d: Partial<GuardarAcreedor>) => send<Acreedor>('PUT', `/acreedores/${id}`, d),
  eliminarAcreedor: (id: string) => del(`/acreedores/${id}`),

  deudas: (filtro: { estado?: string; moneda?: Moneda; acreedorId?: string } = {}) => {
    const q = new URLSearchParams(
      Object.entries(filtro).filter(([, v]) => v) as [string, string][],
    ).toString();
    return get<Deuda[]>(`/deudas${q ? `?${q}` : ''}`);
  },
  crearDeuda: (d: GuardarDeuda) => send<Deuda>('POST', '/deudas', d),
  actualizarDeuda: (id: string, d: Partial<GuardarDeuda>) => send<Deuda>('PUT', `/deudas/${id}`, d),
  eliminarDeuda: (id: string) => del(`/deudas/${id}`),

  registrarPago: (deudaId: string, d: GuardarPago) => send<Pago>('POST', `/deudas/${deudaId}/pagos`, d),
  actualizarPago: (id: string, d: Partial<GuardarPago>) => send<Pago>('PUT', `/pagos/${id}`, d),
  eliminarPago: (id: string) => del(`/pagos/${id}`),

  adelantos: (filtro: { acreedorId?: string; estado?: 'disponibles' | 'todos' } = {}) => {
    const q = new URLSearchParams(
      Object.entries(filtro).filter(([, v]) => v) as [string, string][],
    ).toString();
    return get<Adelanto[]>(`/adelantos${q ? `?${q}` : ''}`);
  },
  crearAdelanto: (d: GuardarAdelanto) => send<Adelanto>('POST', '/adelantos', d),
  actualizarAdelanto: (id: string, d: Partial<GuardarAdelanto>) => send<Adelanto>('PUT', `/adelantos/${id}`, d),
  eliminarAdelanto: (id: string) => del(`/adelantos/${id}`),
  /** Descuenta de la deuda el saldo a favor del acreedor (todo lo posible, o `monto`). */
  aplicarAdelantos: (deudaId: string, monto?: number) =>
    send<Deuda>('POST', `/deudas/${deudaId}/aplicar-adelantos`, monto ? { monto } : {}),

  subirComprobantes: (pagoId: string, archivos: File[]) =>
    subir<Pago>(`/pagos/${pagoId}/comprobantes`, archivos),
  subirComprobantesAdelanto: (adelantoId: string, archivos: File[]) =>
    subir<Adelanto>(`/adelantos/${adelantoId}/comprobantes`, archivos),

  /** Abre el comprobante en otra pestaña (fetch con token → blob:). */
  async abrirComprobante(c: Comprobante): Promise<void> {
    const ventana = window.open('', '_blank');
    const res = await fetch(urlApi(`${BASE}/comprobantes/${c.id}`), { headers: cabecerasAuth() });
    if (!res.ok) {
      ventana?.close();
      throw new Error(`No se pudo abrir el comprobante (${res.status})`);
    }
    const url = URL.createObjectURL(await res.blob());
    if (ventana) ventana.location.href = url;
    else window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  eliminarComprobante: (id: string) => del(`/comprobantes/${id}`),

  historial: (filtro: { acreedorId?: string; deudaId?: string; limite?: number } = {}) => {
    const q = new URLSearchParams(
      Object.entries(filtro)
        .filter(([, v]) => v)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return get<Movimiento[]>(`/historial${q ? `?${q}` : ''}`);
  },
};
