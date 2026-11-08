import { apiFetch, getToken } from '@/lib/apiClient';

// ─── Tipos (lo que devuelve /api/compras) ─────────────────────

export type EstadoPedido =
  | 'ANOTADO'
  | 'PEDIR_PRECIO'
  | 'COMPRADO'
  | 'ENTREGADO'
  | 'CANCELADO';
export type FiltroEstado = EstadoPedido | 'ABIERTOS';
export type Moneda = 'ARS' | 'USD';

export interface Proveedor {
  id: string;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
}

export interface ItemPedido {
  id: string;
  /** Artículo del catálogo de stock (obligatorio si afecta stock). */
  productoId: string | null;
  nombre: string;
  cantidad: number;
  /** Lo que llegó; null = llegó todo. */
  cantidadRecibida: number | null;
  precioUnitario: number | null;
  afectaStock: boolean;
  categorias: { id: string; nombre: string }[];
}

export interface ComprobantePedido {
  id: string;
  nombre: string;
  mimeType: string;
  tamanio: number;
  subidoPorNombre: string | null;
  createdAt: string;
  /** Null = no se mandó a Costear (no está configurado). */
  costearEstado: string | null;
  costearDetalle: string | null;
  costearEnviadoAt: string | null;
}

export interface Pedido {
  id: string;
  numero: number;
  titulo: string | null;
  nota: string | null;
  estado: EstadoPedido;
  moneda: Moneda;
  /** Total cargado a mano. */
  total: number | null;
  /** Suma de cantidad × precio de los renglones con precio. */
  totalCalculado: number | null;
  medioPago: string | null;
  compradoAt: string | null;
  entregadoAt: string | null;
  /** Null = todavía no se compró: se edita sin límite. */
  editableHasta: string | null;
  bloqueado: boolean;
  creadoPorNombre: string;
  actualizadoPorNombre: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  proveedores: { id: string; nombre: string; dadoDeBaja: boolean }[];
  items: ItemPedido[];
  comprobantes: ComprobantePedido[];
}

export interface GuardarItem {
  productoId?: string | null;
  nombre: string;
  cantidad: number;
  cantidadRecibida?: number | null;
  precioUnitario?: number | null;
  afectaStock?: boolean;
  categoriaIds?: string[];
}

export interface GuardarPedido {
  titulo?: string | null;
  nota?: string | null;
  estado?: EstadoPedido;
  moneda?: Moneda;
  total?: number | null;
  medioPago?: string | null;
  proveedorIds: string[];
  items: GuardarItem[];
  version?: number;
}

export interface FiltroPedidos {
  buscar?: string;
  estado?: FiltroEstado;
  categoriaId?: string;
  proveedorId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

export interface PaginaPedidos {
  items: Pedido[];
  total: number;
  page: number;
  limit: number;
}

export interface GuardarProveedor {
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
}

// ─── Llamadas ─────────────────────────────────────────────────

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/compras';

async function get<T>(path: string): Promise<T> {
  return (await apiFetch<Envelope<T>>(`${BASE}${path}`)).data;
}

async function send<T>(
  method: 'POST' | 'PUT' | 'PATCH',
  path: string,
  json?: unknown
): Promise<T> {
  return (
    await apiFetch<Envelope<T>>(`${BASE}${path}`, { method, json: json ?? {} })
  ).data;
}

async function del(path: string): Promise<void> {
  await apiFetch(`${BASE}${path}`, { method: 'DELETE' });
}

function urlApi(path: string): string {
  return `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')}${path}`;
}

function cabecerasAuth(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function query(filtro: object): string {
  const q = new URLSearchParams(
    Object.entries(filtro)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return q ? `?${q}` : '';
}

export const comprasService = {
  pedidos: (filtro: FiltroPedidos = {}) =>
    get<PaginaPedidos>(`/pedidos${query(filtro)}`),
  porEstado: () => get<Record<EstadoPedido, number>>('/pedidos/por-estado'),
  pedido: (id: string) => get<Pedido>(`/pedidos/${id}`),
  crear: (d: GuardarPedido) => send<Pedido>('POST', '/pedidos', d),
  actualizar: (id: string, d: GuardarPedido) =>
    send<Pedido>('PUT', `/pedidos/${id}`, d),
  cambiarEstado: (id: string, estado: EstadoPedido) =>
    send<Pedido>('PATCH', `/pedidos/${id}/estado`, { estado }),
  /** `recibidos`: sólo los renglones que no llegaron completos. */
  entregar: (
    id: string,
    recibidos: { itemId: string; cantidadRecibida: number }[] = []
  ) => send<Pedido>('POST', `/pedidos/${id}/entregar`, { recibidos }),
  repetir: (id: string) => send<Pedido>('POST', `/pedidos/${id}/repetir`),
  eliminar: (id: string) => del(`/pedidos/${id}`),

  /** multipart: no pasa por apiFetch porque no es JSON. */
  async subirComprobantes(pedidoId: string, archivos: File[]): Promise<Pedido> {
    const form = new FormData();
    for (const a of archivos) form.append('comprobantes', a, a.name);
    const res = await fetch(
      urlApi(`${BASE}/pedidos/${pedidoId}/comprobantes`),
      {
        method: 'POST',
        headers: cabecerasAuth(),
        body: form,
      }
    );
    const json = (await res.json().catch(() => null)) as
      | Envelope<Pedido>
      | { message?: string | string[] }
      | null;
    if (!res.ok) {
      const msg = (json as { message?: string | string[] } | null)?.message;
      throw new Error(
        Array.isArray(msg) ? msg.join(', ') : msg || `Error ${res.status}`
      );
    }
    return (json as Envelope<Pedido>).data;
  },

  /** Abre el comprobante en otra pestaña (fetch con token → blob:). */
  async abrirComprobante(c: { id: string }): Promise<void> {
    const ventana = window.open('', '_blank');
    const res = await fetch(urlApi(`${BASE}/comprobantes/${c.id}`), {
      headers: cabecerasAuth(),
    });
    if (!res.ok) {
      ventana?.close();
      throw new Error(`No se pudo abrir el comprobante (${res.status})`);
    }
    const url = URL.createObjectURL(await res.blob());
    if (ventana) ventana.location.href = url;
    else window.location.assign(url);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  eliminarComprobante: async (id: string) =>
    (
      await apiFetch<Envelope<Pedido>>(`${BASE}/comprobantes/${id}`, {
        method: 'DELETE',
      })
    ).data,
  reenviarACostear: (id: string) =>
    send<Pedido>('POST', `/comprobantes/${id}/costear`),
  estadoEnCostear: (id: string) => get<Pedido>(`/comprobantes/${id}/costear`),

  proveedores: (buscar?: string) =>
    get<Proveedor[]>(
      `/proveedores${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''}`
    ),
  crearProveedor: (d: GuardarProveedor) =>
    send<Proveedor>('POST', '/proveedores', d),
  actualizarProveedor: (id: string, d: GuardarProveedor) =>
    send<Proveedor>('PUT', `/proveedores/${id}`, d),
  eliminarProveedor: (id: string) => del(`/proveedores/${id}`),

  categorias: () => get<Categoria[]>('/categorias'),
  crearCategoria: (d: { nombre: string; orden?: number }) =>
    send<Categoria>('POST', '/categorias', d),
  actualizarCategoria: (id: string, d: { nombre: string; orden?: number }) =>
    send<Categoria>('PUT', `/categorias/${id}`, d),
  eliminarCategoria: (id: string) => del(`/categorias/${id}`),
};
