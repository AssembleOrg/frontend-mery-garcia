// Enum para roles de trabajador
export enum RolTrabajador {
  ENCARGADO = 'encargado',
  TRABAJADOR = 'trabajador'
}

// Interfaz principal del trabajador
export interface Trabajador {
  id: string;
  nombre: string;
  rol: RolTrabajador;
  comisionPorcentaje: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// DTO para crear trabajador
export interface CrearTrabajadorDto {
  nombre: string;
  rol?: RolTrabajador;
  comisionPorcentaje?: number;
  activo?: boolean;
}

// DTO para actualizar trabajador
export interface ActualizarTrabajadorDto {
  nombre?: string;
  rol?: RolTrabajador;
  comisionPorcentaje?: number;
  activo?: boolean;
}

// DTO para filtros (solo los que necesitamos)
export interface FiltrarTrabajadoresDto {
  nombre?: string;
  rol?: RolTrabajador;
  activo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: 'nombre' | 'rol' | 'comisionPorcentaje' | 'createdAt';
  orderDirection?: 'ASC' | 'DESC';
}

// Respuesta del API
export interface TrabajadorResponse {
  status: string;
  data: Trabajador | Trabajador[];
  message?: string;
}