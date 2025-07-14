import { create } from 'zustand';
import { authService, UserProfile } from '@/services/auth.service';
import { components } from '@/types/backend';
import { toast } from 'sonner';
import { UnidadNegocio } from '@/types/caja';

// ✅ Tipos extraídos de components.schemas
type LoginDto = components['schemas']['LoginDto'];
type RegisterDto = components['schemas']['RegisterDto'];

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginDto) => Promise<boolean>;
  register: (userData: RegisterDto) => Promise<boolean>;
  logout: () => void;
  getProfile: () => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Estado inicial
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Acciones
  login: async (credentials: LoginDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      set({
        user: {
          ...response.data.user,
          unidadesDisponibles: response.data.user
            .unidadesDisponibles as UnidadNegocio[],
          fechaIngreso:
            response.data.user.fechaIngreso || new Date().toISOString(),
          activo: true,
        },
        token: response.data.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      const nombreUsuario = response.data.user.nombre || 'Usuario';
      toast.success(`¡Bienvenida ${nombreUsuario}!`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error de autenticación';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  register: async (userData: RegisterDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(userData);

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      set({
        user: {
          ...response.data.user,
          unidadesDisponibles: response.data.user
            .unidadesDisponibles as UnidadNegocio[],

          fechaIngreso: userData.fechaIngreso || new Date().toISOString(),
          activo: true,
        },
        token: response.data.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      toast.success(
        `¡Usuario ${response.data.user.nombre} registrado exitosamente!`
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error en el registro';
      set({ isLoading: false, error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  getProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await authService.getProfile();
      localStorage.setItem('user', JSON.stringify(profile));
      set({ user: profile, isLoading: false });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      if (
        errorMessage.includes('500') ||
        errorMessage.includes('401') ||
        errorMessage.includes('403')
      ) {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        });
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        set({
          isLoading: false,
          error: 'Error al obtener perfil de usuario',
        });
        toast.error('Error al obtener perfil de usuario');
      }
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    toast.info('Sesión cerrada correctamente');
  },

  initializeAuth: () => {
    try {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();

      if (token && user) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Date.now() / 1000;

          if (payload.exp && payload.exp < now) {
            // Token expirado, limpiar
            authService.logout();
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }
        } catch {
          // Token malformado, limpiar
          authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({
          token,
          user,
          isAuthenticated: true,
        });
        get().getProfile();
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      authService.logout();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false, // ✅ Crítico
        error: 'Error al cargar datos de sesión',
      });
    }
  },

  clearError: () => set({ error: null }),
}));
