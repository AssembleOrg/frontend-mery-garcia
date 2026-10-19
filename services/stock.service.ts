import { apiFetch } from '@/lib/apiClient';

export interface ProductoStock {
  id: string;
  nombre: string;
  trabajadores: { id: string; nombre: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/stock';

class StockService {
  async listarProductos(): Promise<ProductoStock[]> {
    const res = await apiFetch<Envelope<ProductoStock[]>>(`${BASE}/productos`);
    return res.data;
  }

  async crearProductos(nombres: string[]): Promise<ProductoStock[]> {
    const res = await apiFetch<Envelope<ProductoStock[]>>(`${BASE}/productos`, {
      method: 'POST',
      json: { nombres },
    });
    return res.data;
  }

  async renombrarProducto(id: string, nombre: string): Promise<void> {
    await apiFetch(`${BASE}/productos/${id}`, { method: 'PATCH', json: { nombre } });
  }

  async eliminarProducto(id: string): Promise<void> {
    await apiFetch(`${BASE}/productos/${id}`, { method: 'DELETE' });
  }

  /** Reemplaza los productos que usa el trabajador. */
  async asignarProductos(trabajadorId: string, productoIds: string[]): Promise<void> {
    await apiFetch(`${BASE}/trabajadores/${trabajadorId}/productos`, {
      method: 'PUT',
      json: { productoIds },
    });
  }
}

export const stockService = new StockService();

// ─── Solicitudes de productos (empleados) ─────────────────────────

export type EstadoSolicitudStock = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

export interface SolicitudStock {
  id: string;
  estado: EstadoSolicitudStock;
  trabajador: { id: string; nombre: string };
  nota: string | null;
  respuesta: string | null;
  resueltaPor: string | null;
  resueltaAt: string | null;
  createdAt: string;
  items: { productoId: string | null; nombre: string; cantidad: number }[];
}

export interface AccesoEmpleado {
  trabajadorId: string;
  usuario: string;
  activo: boolean;
}

class SolicitudesStockService {
  // Empleado
  async misProductos(): Promise<{ id: string; nombre: string }[]> {
    const res = await apiFetch<Envelope<{ id: string; nombre: string }[]>>(`${BASE}/mis-productos`);
    return res.data;
  }

  async misSolicitudes(): Promise<SolicitudStock[]> {
    const res = await apiFetch<Envelope<SolicitudStock[]>>(`${BASE}/solicitudes/mias`);
    return res.data;
  }

  async crear(items: { productoId: string; cantidad: number }[], nota?: string): Promise<SolicitudStock> {
    const res = await apiFetch<Envelope<SolicitudStock>>(`${BASE}/solicitudes`, {
      method: 'POST',
      json: { items, nota: nota?.trim() || undefined },
    });
    return res.data;
  }

  async cancelar(id: string): Promise<SolicitudStock> {
    const res = await apiFetch<Envelope<SolicitudStock>>(`${BASE}/solicitudes/${id}/cancelar`, { method: 'POST' });
    return res.data;
  }

  // Equipo
  async listar(filtro: { estado?: EstadoSolicitudStock; trabajadorId?: string } = {}): Promise<SolicitudStock[]> {
    const q = new URLSearchParams();
    if (filtro.estado) q.set('estado', filtro.estado);
    if (filtro.trabajadorId) q.set('trabajadorId', filtro.trabajadorId);
    const res = await apiFetch<Envelope<SolicitudStock[]>>(`${BASE}/solicitudes${q.size ? `?${q}` : ''}`);
    return res.data;
  }

  async pendientes(): Promise<number> {
    const res = await apiFetch<Envelope<{ cantidad: number }>>(`${BASE}/solicitudes/pendientes/cantidad`);
    return res.data.cantidad;
  }

  async resolver(id: string, accion: 'aprobar' | 'rechazar', respuesta?: string): Promise<SolicitudStock> {
    const res = await apiFetch<Envelope<SolicitudStock>>(`${BASE}/solicitudes/${id}/${accion}`, {
      method: 'POST',
      json: { respuesta: respuesta?.trim() || undefined },
    });
    return res.data;
  }

  // Accesos
  async accesos(): Promise<AccesoEmpleado[]> {
    const res = await apiFetch<Envelope<AccesoEmpleado[]>>(`${BASE}/accesos`);
    return res.data;
  }

  async guardarAcceso(trabajadorId: string, usuario: string, password?: string): Promise<AccesoEmpleado> {
    const res = await apiFetch<Envelope<AccesoEmpleado>>(`${BASE}/accesos/${trabajadorId}`, {
      method: 'PUT',
      json: { usuario: usuario.trim(), password: password || undefined },
    });
    return res.data;
  }

  async quitarAcceso(trabajadorId: string): Promise<void> {
    await apiFetch(`${BASE}/accesos/${trabajadorId}`, { method: 'DELETE' });
  }
}

export const solicitudesStockService = new SolicitudesStockService();
