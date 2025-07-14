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

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  getStoredUser(): UserProfile | null {
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem('user');
        if (!user) return null;

        const parsedUser = JSON.parse(user);

        // Validar que el objeto tiene las propiedades mínimas requeridas
        if (!parsedUser.id || !parsedUser.nombre || !parsedUser.email) {
          console.warn(
            'Usuario en localStorage tiene formato inválido, limpiando...'
          );
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          return null;
        }

        return parsedUser;
      } catch (error) {
        console.error('Error parseando usuario de localStorage:', error);
        // Limpiar localStorage corrupto
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  },
};
