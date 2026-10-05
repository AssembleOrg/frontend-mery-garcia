import { apiFetch, getToken } from '@/lib/apiClient';

export type EstadoLote = 'SUBIDO' | 'LEYENDO' | 'LISTO';
export type EstadoPagina = 'PENDIENTE' | 'LEYENDO' | 'LEIDA' | 'ERROR';
export type ResultadoPagina = 'OK' | 'REVISAR' | 'NO_ENCONTRADA';
export type CampoDiferencia = 'fecha' | 'cliente' | 'servicios' | 'responsables' | 'sena' | 'cobrado' | 'anulada';

/** Lo que leyó la IA en la hoja (sin ver el sistema). */
export interface LecturaComanda {
  numero: string | null;
  fecha: string | null;
  cliente: string | null;
  servicios: { fila: string; responsable: string | null; anotacion: string | null }[];
  otros: string[];
  montos: {
    donde: 'SENA' | 'SALDO' | 'SENA_PROXIMO' | 'OTROS' | 'OBSERVACIONES';
    etiquetaTachada: boolean;
    monto: number | null;
    moneda: 'ARS' | 'USD' | null;
    metodo: string | null;
    texto: string;
  }[];
  observaciones: string | null;
  anulada: boolean;
  dudas: string[];
  legibilidad: 'buena' | 'regular' | 'mala';
}

/** La comanda del sistema tal como estaba al comparar. */
export interface ComandaSistema {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  cliente: string | null;
  observaciones: string | null;
  items: { nombre: string; trabajador: string | null }[];
  pagos: { tipo: string; moneda: string; monto: number }[];
  senas: { moneda: string; monto: number }[];
}

export interface Diferencia {
  campo: CampoDiferencia;
  papel: string;
  sistema: string;
}

export interface Hoja {
  id: string;
  loteId: string;
  orden: number;
  mimeType: string;
  estado: EstadoPagina;
  lectura: LecturaComanda | null;
  numeroComanda: string | null;
  comandaId: string | null;
  resultado: ResultadoPagina | null;
  diferencias: Diferencia[] | null;
  sistema: ComandaSistema | null;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
  error: string | null;
  leidaAt: string | null;
  /** El mismo número aparece en otra hoja del lote. */
  repetida: boolean;
}

export interface ResumenLote {
  total: number;
  pendientes: number;
  leyendo: number;
  errores: number;
  ok: number;
  revisar: number;
  noEncontradas: number;
}

export interface Lote {
  id: string;
  fecha: string;
  nombreArchivo: string;
  estado: EstadoLote;
  totalPaginas: number;
  modelo: string | null;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
  creadoPorNombre: string | null;
  createdAt: string;
  /** El servidor está leyendo este lote ahora. */
  leyendo: boolean;
  resumen: ResumenLote;
}

export interface LoteDetalle extends Lote {
  iaConfigurada: boolean;
  paginas: Hoja[];
  /** Comandas cargadas ese día que no aparecen en ninguna hoja. */
  faltantes: { id: string; numero: string; cliente: string | null; estado: string }[];
}

interface Envelope<T> {
  status: string;
  data: T;
}

const BASE = '/api/validacion-comandas';

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

const urlsImagen = new Map<string, Promise<string>>();

export const validacionComandasService = {
  lotes: async () => (await apiFetch<Envelope<Lote[]>>(`${BASE}/lotes`)).data,
  lote: async (id: string) => (await apiFetch<Envelope<LoteDetalle>>(`${BASE}/lotes/${id}`)).data,

  /** multipart: el PDF o las fotos no pasan por apiFetch porque no son JSON. No lee nada. */
  async subir(fecha: string, archivos: File[]): Promise<LoteDetalle> {
    const form = new FormData();
    form.append('fecha', fecha);
    for (const a of archivos) form.append('archivos', a, a.name);
    const res = await fetch(urlApi(`${BASE}/lotes`), { method: 'POST', headers: cabecerasAuth(), body: form });
    const json = (await res.json().catch(() => null)) as Envelope<LoteDetalle> | { message?: unknown } | null;
    if (!res.ok) {
      const msg = (json as { message?: unknown } | null)?.message;
      throw new Error(typeof msg === 'string' ? msg : `No se pudo subir (${res.status})`);
    }
    return (json as Envelope<LoteDetalle>).data;
  },

  /** Lee con IA las hojas pendientes. Responde enseguida; la lectura sigue en el servidor. */
  leer: async (id: string) =>
    (await apiFetch<Envelope<LoteDetalle>>(`${BASE}/lotes/${id}/leer`, { method: 'POST' })).data,
  recomparar: async (id: string) =>
    (await apiFetch<Envelope<LoteDetalle>>(`${BASE}/lotes/${id}/recomparar`, { method: 'POST' })).data,
  releer: async (paginaId: string) =>
    (await apiFetch<Envelope<LoteDetalle>>(`${BASE}/paginas/${paginaId}/releer`, { method: 'POST' })).data,
  eliminar: async (id: string) => {
    await apiFetch(`${BASE}/lotes/${id}`, { method: 'DELETE' });
  },

  /**
   * Imagen de la hoja como URL local (blob:). Se usa fetch y no `src` directo
   * porque un <img src> no puede mandar el token en la cabecera. Se cachea por hoja.
   */
  imagenUrl(paginaId: string): Promise<string> {
    let p = urlsImagen.get(paginaId);
    if (!p) {
      p = fetch(urlApi(`${BASE}/paginas/${paginaId}/imagen`), { headers: cabecerasAuth() }).then(async (res) => {
        if (!res.ok) throw new Error(`No se pudo cargar la imagen (${res.status})`);
        return URL.createObjectURL(await res.blob());
      });
      p.catch(() => urlsImagen.delete(paginaId));
      urlsImagen.set(paginaId, p);
    }
    return p;
  },
};
