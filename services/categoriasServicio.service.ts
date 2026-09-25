import { apiFetch } from '@/lib/apiClient';

/** Servicio tal como viene dentro de una categoría. */
export interface ServicioDeCategoria {
  id: string;
  nombre: string;
  activo: boolean;
  unidadNegocio?: { id: string; nombre: string } | null;
}

export interface CategoriaServicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  servicios: ServicioDeCategoria[];
}

export interface GuardarCategoriaServicio {
  nombre: string;
  descripcion?: string;
  orden?: number;
  /** Reemplaza la lista de servicios de la categoría. */
  servicioIds?: string[];
}

/** Servicio del sistema, para elegir cuáles van en cada categoría. */
export interface ServicioParaCategorizar {
  id: string;
  nombre: string;
  tipo: 'SERVICIO' | 'PRODUCTO';
  activo: boolean;
  unidadNegocio?: { id: string; nombre: string } | null;
  categoria?: { id: string; nombre: string } | null;
}

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/categorias-servicio';

class CategoriasServicioService {
  async listar(): Promise<CategoriaServicio[]> {
    const res = await apiFetch<Envelope<CategoriaServicio[]>>(BASE);
    return res.data;
  }

  async crear(datos: GuardarCategoriaServicio): Promise<CategoriaServicio> {
    const res = await apiFetch<Envelope<CategoriaServicio>>(BASE, {
      method: 'POST',
      json: datos,
    });
    return res.data;
  }

  async actualizar(id: string, datos: Partial<GuardarCategoriaServicio>): Promise<CategoriaServicio> {
    const res = await apiFetch<Envelope<CategoriaServicio>>(`${BASE}/${id}`, {
      method: 'PUT',
      json: datos,
    });
    return res.data;
  }

  async eliminar(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }

  /** Todos los servicios (no productos) del sistema, con su categoría actual. */
  async serviciosDisponibles(): Promise<ServicioParaCategorizar[]> {
    const res = await apiFetch<Envelope<ServicioParaCategorizar[]>>('/api/productos-servicios');
    return res.data.filter((s) => s.tipo === 'SERVICIO');
  }
}

export const categoriasServicioService = new CategoriasServicioService();
