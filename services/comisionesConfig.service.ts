import { apiFetch } from '@/lib/apiClient';

/** Categoría de servicio tal como la devuelve /comisiones-config. */
export interface CategoriaComision {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

export interface BaseComision {
  categoriaId: string;
  categoria: string | null;
  montoBase: number;
}

export interface PorcentajeMes {
  /** "YYYY-MM" */
  mes: string;
  porcentaje: number;
  nota: string | null;
}

/** Esquema de comisión de una trabajadora (base fija por categoría + rango de %). */
export interface EsquemaComisionTrabajador {
  id: string;
  nombre: string;
  porcentajeMin: number;
  porcentajeMax: number | null;
  productosPorcentaje: number | null;
  /** "YYYY-MM-DD"; null = no usa el esquema por base fija. */
  baseDesde: string | null;
  bases: BaseComision[];
  meses: PorcentajeMes[];
}

export interface ComisionesConfig {
  categorias: CategoriaComision[];
  trabajadores: EsquemaComisionTrabajador[];
}

export interface ActualizarEsquemaComision {
  porcentajeMin?: number;
  porcentajeMax?: number | null;
  productosPorcentaje?: number | null;
  baseDesde?: string | null;
  /** Reemplaza todas las bases de la trabajadora. */
  bases?: { categoriaId: string; montoBase: number }[];
}

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/comisiones-config';

// Los numeric de Postgres pueden llegar como string: se normalizan acá.
const num = (v: unknown): number => Number(v ?? 0);
const numONull = (v: unknown): number | null => (v == null ? null : Number(v));

function normalizar(c: ComisionesConfig): ComisionesConfig {
  return {
    categorias: c.categorias,
    trabajadores: c.trabajadores.map((t) => ({
      ...t,
      porcentajeMin: num(t.porcentajeMin),
      porcentajeMax: numONull(t.porcentajeMax),
      productosPorcentaje: numONull(t.productosPorcentaje),
      baseDesde: t.baseDesde ? String(t.baseDesde).slice(0, 10) : null,
      bases: t.bases.map((b) => ({ ...b, montoBase: num(b.montoBase) })),
      meses: t.meses.map((m) => ({ ...m, porcentaje: num(m.porcentaje) })),
    })),
  };
}

class ComisionesConfigService {
  async obtener(): Promise<ComisionesConfig> {
    const res = await apiFetch<Envelope<ComisionesConfig>>(BASE);
    return normalizar(res.data);
  }

  async actualizarTrabajador(id: string, datos: ActualizarEsquemaComision): Promise<ComisionesConfig> {
    const res = await apiFetch<Envelope<ComisionesConfig>>(`${BASE}/trabajadores/${id}`, {
      method: 'PUT',
      json: datos,
    });
    return normalizar(res.data);
  }

  /** Confirma el porcentaje de un mes ("YYYY-MM") al cierre. */
  async confirmarMes(id: string, mes: string, porcentaje: number, nota?: string): Promise<ComisionesConfig> {
    const res = await apiFetch<Envelope<ComisionesConfig>>(`${BASE}/trabajadores/${id}/meses/${mes}`, {
      method: 'PUT',
      json: { porcentaje, ...(nota ? { nota } : {}) },
    });
    return normalizar(res.data);
  }

  /** Quita el porcentaje confirmado: el mes vuelve a calcularse al mínimo. */
  async quitarMes(id: string, mes: string): Promise<ComisionesConfig> {
    const res = await apiFetch<Envelope<ComisionesConfig>>(`${BASE}/trabajadores/${id}/meses/${mes}`, {
      method: 'DELETE',
    });
    return normalizar(res.data);
  }
}

export const comisionesConfigService = new ComisionesConfigService();
