import { apiFetch } from "@/lib/apiClient";
import { MovimientoCreateNew, MovimientoNew } from "./unidadNegocio.service";

class MovimientoService {
  private readonly baseUrl = '/api/movimientos';

  async crearMovimiento(movimiento: MovimientoCreateNew): Promise<MovimientoNew> {
    const response = await apiFetch<{ data: MovimientoNew }>(`${this.baseUrl}`, {
      method: 'POST',
      json: movimiento,
    });
    return response.data;   
  }
}

export const movimientoService = new MovimientoService();