import { apiFetch } from '@/lib/apiClient';
import { TrabajadorCreateNew, TrabajadorNew, TrabajadorUpdateNew } from './unidadNegocio.service';

class TrabajadoresService {
  private readonly baseUrl = '/api/trabajadores';

  async crearTrabajador(trabajador: TrabajadorCreateNew): Promise<TrabajadorNew> {
    const response = await apiFetch<{
      data: TrabajadorNew;
      status: string;
    }>(`${this.baseUrl}`, {
      method: 'POST',
      json: trabajador
    });
    return response.data;
  }

  async getTrabajadores(): Promise<TrabajadorNew[]> {
    const response = await apiFetch<{
      data: TrabajadorNew[];
      status: string;
    }>(`${this.baseUrl}`, {
      method: 'GET',
    });
    return response.data;
  }

  async actualizarTrabajador(id: string, trabajador: TrabajadorUpdateNew): Promise<TrabajadorNew> {
    const response = await apiFetch<{
      data: TrabajadorNew;
      status: string;
    }>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      json: trabajador
    });
    return response.data;
  }

  async getTrabajadorPorId(id: string): Promise<TrabajadorNew> {
    const response = await apiFetch<{
      data: TrabajadorNew;
      status: string;
    }>(`${this.baseUrl}/${id}`, {
      method: 'GET',
    });
    return response.data;
  }

  // async actualizarTrabajador(id: string, trabajador: TrabajadorUpdateNew): Promise<TrabajadorNew> {
  //   const response = await apiFetch<{
  //     data: TrabajadorNew;
}

export const trabajadoresService = new TrabajadoresService();