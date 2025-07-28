import { apiFetch } from '@/lib/apiClient';
import { components } from '@/types/backend';

type LoginDto = components['schemas']['LoginDto'];
type RegisterDto = components['schemas']['RegisterDto'];

export interface AuthResponse {
  status: string;
  data: {
    access_token: string;
    user: {
      id: string;
      email: string;
      nombre: string;
      rol: 'admin' | 'user' | 'encargado';
      unidadesDisponibles: string[];
      fechaIngreso?: string;
    };
  };
}

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'user' | 'encargado';
  unidadesDisponibles: ('tattoo' | 'estilismo' | 'formacion')[];
  telefono?: string;
  fechaIngreso: string;
  activo: boolean;
}

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('api/auth/login', {
      method: 'POST',
      json: credentials,
    });
  },

  async register(userData: RegisterDto): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('api/auth/register', {
      method: 'POST',
      json: userData,
    });
  },

  async getProfile(): Promise<UserProfile> {
    return apiFetch<UserProfile>('api/auth/profile');
  },
};
