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
