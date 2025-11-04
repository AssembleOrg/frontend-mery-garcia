import { apiFetch } from '@/lib/apiClient';

// Interfaces basadas en el endpoint v1.5.0
export interface ProductoServicioItem {
  nombre: string;
  cantidad: number;
  tipo: 'SERVICIO' | 'PRODUCTO';
}

export interface ComisionTrabajadorDto {
  trabajadorId: string;
  nombre: string;
  totalServicios: number;
  totalProductos: number;
  cantidadConsultas: number;
  totalConsultas: number;
  unidadesNegocio: Record<string, number>;
  productosServicios: ProductoServicioItem[];
  comisiones: {
    servicios: number;
    productos: number;
    total: number;
  };
}

export interface TotalesComisionesDto {
  serviciosSinDescuento: number;
  serviciosConDescuento: number;
  productosSinDescuento: number;
  productosConDescuento: number;
  totalSinDescuento: number;
  totalConDescuento: number;
}

export interface ResumenComisionesDto {
  fechaDesde: string;
  fechaHasta: string;
  trabajadores: ComisionTrabajadorDto[];
  totales: TotalesComisionesDto;
  totalComisiones: number;
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
}

export const comisionesService = new ComisionesService();

