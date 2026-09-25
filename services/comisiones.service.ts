import { apiFetch, getToken } from '@/lib/apiClient';

// Interfaces basadas en el endpoint v1.5.0
export interface ProductoServicioItem {
  nombre: string;
  cantidad: number;
  tipo: 'SERVICIO' | 'PRODUCTO';
}

export interface ComisionTrabajadorDto {
  trabajadorId: string;
  nombre: string;
  // Montos separados por moneda. Estilismo/Productos = ARS; Cosmetic Tatto/Tattoo = USD.
  serviciosARS: number;
  serviciosUSD: number;
  productosARS: number;
  productosUSD: number;
  cantidadConsultas: number;
  totalConsultas: number;
  unidadesNegocio: Record<string, number>;
  productosServicios: ProductoServicioItem[];
  /** Servicios por categoría (A, B, C...), ordenadas. */
  categorias?: { id: string; nombre: string; orden: number; cantidad: number }[];
  /** Servicios sin categoría asignada (sin contar consultas). */
  serviciosSinCategoria?: number;
  comisiones: {
    serviciosARS: number;
    serviciosUSD: number;
    productosARS: number;
    productosUSD: number;
    totalARS: number;
    totalUSD: number;
  };
}

export interface TotalesComisionesDto {
  serviciosARS: number;
  serviciosUSD: number;
  productosARS: number;
  productosUSD: number;
  totalARS: number;
  totalUSD: number;
}

export interface ResumenComisionesDto {
  fechaDesde: string;
  fechaHasta: string;
  trabajadores: ComisionTrabajadorDto[];
  totales: TotalesComisionesDto;
  totalComisionesARS: number;
  totalComisionesUSD: number;
}

export interface ComisionesQueryParams {
  fechaDesde?: string;
  fechaHasta?: string;
  dolar?: number;
}

class ComisionesService {
  private readonly baseUrl = '/api/comandas/comisiones';

  async obtenerComisiones(params: ComisionesQueryParams = {}): Promise<ResumenComisionesDto> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.fechaDesde) {
        queryParams.append('fechaDesde', params.fechaDesde);
      }
      
      if (params.fechaHasta) {
        queryParams.append('fechaHasta', params.fechaHasta);
      }

      if (params.dolar && params.dolar > 0) {
        queryParams.append('dolar', params.dolar.toString());
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await apiFetch<{
        status: string;
        data: ResumenComisionesDto;
      }>(url);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener comisiones:', error);
      throw error;
    }
  }

  /**
   * Descarga el PDF de servicios y señas por profesional. No pasa por apiFetch
   * porque la respuesta es un archivo, no JSON: el token va en la cabecera,
   * igual que el reporte de presentismo (nunca en la URL, que queda en logs).
   */
  async descargarReporteServiciosPdf(params: {
    fechaDesde?: string;
    fechaHasta?: string;
    trabajadores?: string[];
  }): Promise<void> {
    const qs = new URLSearchParams();
    if (params.fechaDesde) qs.append('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) qs.append('fechaHasta', params.fechaHasta);
    if (params.trabajadores?.length) qs.append('trabajadores', params.trabajadores.join(','));

    const token = getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}${this.baseUrl}/reporte-servicios/pdf?${qs.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) throw new Error('No se pudo generar el PDF');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `servicios-y-senas_${params.fechaDesde ?? ''}_a_${params.fechaHasta ?? ''}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const comisionesService = new ComisionesService();

